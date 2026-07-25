// Initiates a direct Hubtel Checkout transaction for a fleet owner/dealer
// to self-serve buy a featured placement for one of their own listings.
// Deploy with:
//   supabase functions deploy initiate-featured-payment
// Requires secrets: HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET,
// HUBTEL_MERCHANT_ACCOUNT_NUMBER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (the last two are auto-injected by Supabase for every Edge Function).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Server-trusted pricing — never accept an amount from the client.
const PLACEMENT_PRICES: Record<string, number> = {
  marketplace: 300,
  home: 250,
};

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

    const { targetType, targetId, placement } = await req.json().catch(() => ({}));
    if (targetType !== 'car' && targetType !== 'sale_car') {
      return json({ error: 'targetType must be car or sale_car' }, 400);
    }
    if (placement !== 'marketplace' && placement !== 'home') {
      return json({ error: 'placement must be marketplace or home' }, 400);
    }
    if (!targetId || typeof targetId !== 'string') {
      return json({ error: 'targetId is required' }, 400);
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
      .select('id, name, email, phone')
      .eq('id', userData.user.id)
      .single();
    if (profileError || !profile) {
      return json({ error: 'Profile not found' }, 404);
    }

    // Ownership check is server-trusted — the client never gets to assert
    // it owns a listing it doesn't.
    let label: string;
    if (targetType === 'car') {
      const { data: car, error: carError } = await adminClient
        .from('cars')
        .select('id, owner_id, brand, model, is_featured, is_home_featured')
        .eq('id', targetId)
        .single();
      if (carError || !car) return json({ error: 'Car not found' }, 404);
      if (car.owner_id !== profile.id) return json({ error: 'This car does not belong to you' }, 403);
      const already = placement === 'marketplace' ? car.is_featured : car.is_home_featured;
      if (already) return json({ error: 'This car is already featured for this placement' }, 409);
      label = `${car.brand} ${car.model}`;
    } else {
      const { data: saleCar, error: saleCarError } = await adminClient
        .from('sale_cars')
        .select('id, dealer_id, brand, model, is_featured, is_home_featured')
        .eq('id', targetId)
        .single();
      if (saleCarError || !saleCar) return json({ error: 'Listing not found' }, 404);
      if (saleCar.dealer_id !== profile.id) return json({ error: 'This listing does not belong to you' }, 403);
      const already = placement === 'marketplace' ? saleCar.is_featured : saleCar.is_home_featured;
      if (already) return json({ error: 'This listing is already featured for this placement' }, 409);
      label = `${saleCar.brand} ${saleCar.model}`;
    }

    const amount = PLACEMENT_PRICES[placement];

    clientReference = `featured_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

    const { error: insertError } = await adminClient.from('featured_payments').insert({
      target_type: targetType,
      target_id: targetId,
      placement,
      amount,
      status: 'pending',
      hubtel_reference: clientReference,
    });
    if (insertError) {
      return json({ error: 'Could not record payment' }, 500);
    }

    const hubtelClientId = Deno.env.get('HUBTEL_CLIENT_ID')!;
    const hubtelClientSecret = Deno.env.get('HUBTEL_CLIENT_SECRET')!;
    const merchantAccountNumber = Deno.env.get('HUBTEL_MERCHANT_ACCOUNT_NUMBER')!;
    const basicAuth = btoa(`${hubtelClientId}:${hubtelClientSecret}`);

    // Same trust model as the other initiate-* functions: only honor a web
    // Origin if it's on the allowlist, otherwise fall back to the
    // production web URL — Hubtel rejects non-http(s) ReturnUrl/
    // CancellationUrl values outright. Real web browser callers get
    // redirected straight back into the SPA screen they came from; native
    // callers (no recognized web Origin) go through /payment-bridge first,
    // which forwards to the app's gocarhub:// scheme — see
    // payment-bridge.tsx for why that hop exists.
    const PRODUCTION_WEB_URL = 'https://gocar-hub.vercel.app';
    const allowedWebOrigins = (Deno.env.get('ALLOWED_WEB_ORIGINS') ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const webOrigin = req.headers.get('origin');
    const isAllowedOrigin = !!webOrigin && allowedWebOrigins.includes(webOrigin);
    const webScreen = targetType === 'car' ? '/fleet-dashboard' : '/dealer-dashboard';
    const returnBase = isAllowedOrigin ? `${webOrigin}${webScreen}` : `${PRODUCTION_WEB_URL}/payment-bridge`;

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
        description: `GoCar Hub featured placement — ${label}`,
        callbackUrl: `${supabaseUrl}/functions/v1/hubtel-callback`,
        returnUrl: `${returnBase}?featured=success`,
        cancellationUrl: `${returnBase}?featured=cancelled`,
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
        .from('featured_payments')
        .update({ status: 'failed' })
        .eq('hubtel_reference', clientReference);
      return json({ error: 'Hubtel returned a non-JSON response', debug: { status: hubtelResponse.status, body: hubtelRawText.slice(0, 500) } }, 502);
    }

    if (hubtelData.responseCode !== '0000' || !hubtelData.data?.checkoutUrl) {
      await adminClient
        .from('featured_payments')
        .update({ status: 'failed' })
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
          .from('featured_payments')
          .update({ status: 'failed' })
          .eq('hubtel_reference', clientReference);
      } catch {
        // best-effort diagnostic write; ignore secondary failures
      }
    }
    return json({ error: 'Unexpected error initiating featured payment', debug: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
