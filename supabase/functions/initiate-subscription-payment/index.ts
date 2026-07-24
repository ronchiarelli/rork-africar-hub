// Initiates a direct Hubtel Checkout transaction for a fleet_owner/dealership
// user's monthly platform subscription fee (separate from the wallet
// top-up path — this pays the subscription itself in one tap). Deploy with:
//   supabase functions deploy initiate-subscription-payment
// Requires secrets: HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET,
// HUBTEL_MERCHANT_ACCOUNT_NUMBER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (the last two are auto-injected by Supabase for every Edge Function).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let clientReference: string | undefined;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: 'Invalid session' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, name, email, phone, role')
      .eq('id', userData.user.id)
      .single();

    if (profileError || !profile) {
      return json({ error: 'Profile not found' }, 404);
    }

    if (profile.role !== 'fleet_owner' && profile.role !== 'dealership') {
      return json({ error: 'Only fleet owner and dealership accounts have a subscription' }, 403);
    }

    const { data: subscription, error: subError } = await adminClient
      .from('subscriptions')
      .select('id, amount')
      .eq('user_id', profile.id)
      .single();

    if (subError || !subscription) {
      return json({ error: 'No subscription found for this account' }, 404);
    }

    // Amount is always the account's own subscription row (server-trusted),
    // never a client-supplied value — this is the platform rate at the time
    // their subscription/trial started, not a figure the caller can pick.
    const amount = subscription.amount;

    clientReference = `sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

    const { error: insertError } = await adminClient.from('subscription_payments').insert({
      subscription_id: subscription.id,
      amount,
      status: 'pending',
      hubtel_reference: clientReference,
      period_start: new Date().toISOString(),
    });
    if (insertError) {
      return json({ error: 'Could not record payment' }, 500);
    }

    const hubtelClientId = Deno.env.get('HUBTEL_CLIENT_ID')!;
    const hubtelClientSecret = Deno.env.get('HUBTEL_CLIENT_SECRET')!;
    const merchantAccountNumber = Deno.env.get('HUBTEL_MERCHANT_ACCOUNT_NUMBER')!;
    const basicAuth = btoa(`${hubtelClientId}:${hubtelClientSecret}`);

    // Same trust model as initiate-wallet-topup: only honor a web Origin if
    // it's on the allowlist, otherwise fall back to the production web URL
    // — Hubtel rejects non-http(s) ReturnUrl/CancellationUrl values
    // outright (confirmed via a live 400 "Return URL is invalid"
    // response), so the previous custom app-scheme deep link never
    // actually worked here. This endpoint can be called directly, so
    // Origin is untrusted input.
    const PRODUCTION_WEB_URL = 'https://gocar-hub.vercel.app';
    const allowedWebOrigins = (Deno.env.get('ALLOWED_WEB_ORIGINS') ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const webOrigin = req.headers.get('origin');
    const isAllowedOrigin = !!webOrigin && allowedWebOrigins.includes(webOrigin);
    const returnBase = isAllowedOrigin ? `${webOrigin}/subscription` : `${PRODUCTION_WEB_URL}/subscription`;

    const hubtelResponse = await fetch('https://payproxyapi.hubtel.com/items/initiate', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        merchantAccountNumber,
        totalAmount: amount,
        description: 'GoCar Hub monthly subscription payment',
        callbackUrl: `${supabaseUrl}/functions/v1/hubtel-callback`,
        returnUrl: `${returnBase}?sub=success`,
        cancellationUrl: `${returnBase}?sub=cancelled`,
        clientReference,
        payeeName: profile.name || undefined,
        payeeEmail: profile.email || undefined,
        payeeMobileNumber: profile.phone || undefined,
      }),
    });

    const hubtelRawText = await hubtelResponse.text();
    let hubtelData: any;
    try {
      hubtelData = JSON.parse(hubtelRawText);
    } catch {
      await adminClient
        .from('subscription_payments')
        .update({ status: 'failed' })
        .eq('hubtel_reference', clientReference);
      return json({ error: 'Hubtel returned a non-JSON response', debug: { status: hubtelResponse.status, body: hubtelRawText.slice(0, 500) } }, 502);
    }

    if (hubtelData.responseCode !== '0000' || !hubtelData.data?.checkoutUrl) {
      await adminClient
        .from('subscription_payments')
        .update({ status: 'failed' })
        .eq('hubtel_reference', clientReference);
      return json({ error: hubtelData.message ?? 'Hubtel could not start this payment', debug: { status: hubtelResponse.status, hubtelData } }, 502);
    }

    return json({ checkoutUrl: hubtelData.data.checkoutUrl, clientReference, returnUrl: returnBase });
  } catch (err) {
    console.error(err);
    if (clientReference) {
      try {
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await adminClient
          .from('subscription_payments')
          .update({ status: 'failed' })
          .eq('hubtel_reference', clientReference);
      } catch {
        // best-effort diagnostic write; ignore secondary failures
      }
    }
    return json({ error: 'Unexpected error initiating subscription payment', debug: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
