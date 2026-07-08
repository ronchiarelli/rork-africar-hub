// Initiates a Hubtel Checkout transaction for a fleet_owner/dealership user
// to top up their subscription-funding wallet. Deploy with:
//   supabase functions deploy initiate-wallet-topup
// Requires secrets: HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET,
// HUBTEL_MERCHANT_ACCOUNT_NUMBER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (the last two are auto-injected by Supabase for every Edge Function).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MIN_TOPUP_AMOUNT = 10;

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

    // Client scoped to the caller's own JWT, purely to identify who's asking.
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: 'Invalid session' }, 401);
    }

    // Service-role client for privileged reads/writes, bypassing RLS.
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
      return json({ error: 'Only fleet owner and dealership accounts have a wallet' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < MIN_TOPUP_AMOUNT) {
      return json({ error: `Minimum top-up is GH₵${MIN_TOPUP_AMOUNT}` }, 400);
    }

    clientReference = `topup_${profile.id}_${crypto.randomUUID()}`;

    const { error: insertError } = await adminClient.from('wallet_transactions').insert({
      wallet_id: profile.id,
      type: 'credit',
      amount,
      description: 'Wallet top-up via Hubtel',
      status: 'pending',
      hubtel_reference: clientReference,
    });
    if (insertError) {
      return json({ error: 'Could not record transaction' }, 500);
    }

    const hubtelClientId = Deno.env.get('HUBTEL_CLIENT_ID')!;
    const hubtelClientSecret = Deno.env.get('HUBTEL_CLIENT_SECRET')!;
    const merchantAccountNumber = Deno.env.get('HUBTEL_MERCHANT_ACCOUNT_NUMBER')!;
    const basicAuth = btoa(`${hubtelClientId}:${hubtelClientSecret}`);

    const appScheme = Deno.env.get('APP_SCHEME') ?? 'gocarhub';

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
        description: 'GoCar Hub wallet top-up',
        callbackUrl: `${supabaseUrl}/functions/v1/hubtel-callback`,
        returnUrl: `${appScheme}://wallet?topup=success`,
        cancellationUrl: `${appScheme}://wallet?topup=cancelled`,
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
      const detail = `HTTP ${hubtelResponse.status} (non-JSON): ${hubtelRawText.slice(0, 1000)}`;
      await adminClient
        .from('wallet_transactions')
        .update({ status: 'failed', failure_detail: detail })
        .eq('hubtel_reference', clientReference);
      return json({ error: 'Hubtel returned a non-JSON response', debug: { status: hubtelResponse.status, body: hubtelRawText.slice(0, 500) } }, 502);
    }

    if (hubtelData.responseCode !== '0000' || !hubtelData.data?.checkoutUrl) {
      const detail = `HTTP ${hubtelResponse.status}: ${JSON.stringify(hubtelData).slice(0, 1000)}`;
      await adminClient
        .from('wallet_transactions')
        .update({ status: 'failed', failure_detail: detail })
        .eq('hubtel_reference', clientReference);
      return json({ error: hubtelData.message ?? 'Hubtel could not start this payment', debug: { status: hubtelResponse.status, hubtelData } }, 502);
    }

    return json({ checkoutUrl: hubtelData.data.checkoutUrl, clientReference });
  } catch (err) {
    console.error(err);
    if (clientReference) {
      try {
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await adminClient
          .from('wallet_transactions')
          .update({ status: 'failed', failure_detail: `Unhandled exception: ${String(err)}`.slice(0, 1000) })
          .eq('hubtel_reference', clientReference);
      } catch {
        // best-effort diagnostic write; ignore secondary failures
      }
    }
    return json({ error: 'Unexpected error initiating top-up', debug: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
