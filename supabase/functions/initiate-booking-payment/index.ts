// Initiates a direct Hubtel Checkout transaction for an approved booking,
// only for bookings whose car's owner has been admin-allowlisted for
// in-app payment (accepts_inapp_payment). Deploy with:
//   supabase functions deploy initiate-booking-payment
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

    const { bookingId } = await req.json().catch(() => ({}));
    if (!bookingId || typeof bookingId !== 'string') {
      return json({ error: 'bookingId is required' }, 400);
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

    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .select('id, customer_id, car_id, status, payment_status, total_price')
      .eq('id', bookingId)
      .single();
    if (bookingError || !booking) {
      return json({ error: 'Booking not found' }, 404);
    }
    if (booking.customer_id !== profile.id) {
      return json({ error: 'This booking does not belong to you' }, 403);
    }
    if (booking.status !== 'approved') {
      return json({ error: 'This booking is not ready for payment yet' }, 409);
    }
    if (booking.payment_status === 'paid') {
      return json({ error: 'This booking has already been paid' }, 409);
    }

    const { data: car, error: carError } = await adminClient
      .from('cars')
      .select('id, owner_id')
      .eq('id', booking.car_id)
      .single();
    if (carError || !car?.owner_id) {
      return json({ error: 'Could not determine this booking\'s car owner' }, 500);
    }

    const { data: ownerProfile } = await adminClient
      .from('profiles')
      .select('accepts_inapp_payment')
      .eq('id', car.owner_id)
      .single();
    if (!ownerProfile?.accepts_inapp_payment) {
      return json({ error: 'In-app payment is not enabled for this listing yet' }, 403);
    }

    // Amount is always the booking's own server-computed total, never a
    // client-supplied value.
    const amount = booking.total_price;

    clientReference = `booking_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

    const { error: insertError } = await adminClient.from('booking_payments').insert({
      booking_id: booking.id,
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

    // Same trust model as initiate-wallet-topup/initiate-subscription-payment:
    // only honor a web Origin if it's on the allowlist, otherwise fall back
    // to the production web URL — Hubtel rejects non-http(s)
    // ReturnUrl/CancellationUrl values outright (confirmed via a live 400
    // "Return URL is invalid" response), so the previous custom app-scheme
    // deep link never actually worked here. This endpoint can be called
    // directly, so Origin is untrusted input.
    const PRODUCTION_WEB_URL = 'https://gocar-hub.vercel.app';
    const allowedWebOrigins = (Deno.env.get('ALLOWED_WEB_ORIGINS') ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const webOrigin = req.headers.get('origin');
    const isAllowedOrigin = !!webOrigin && allowedWebOrigins.includes(webOrigin);
    const returnBase = isAllowedOrigin
      ? `${webOrigin}/booking-detail`
      : `${PRODUCTION_WEB_URL}/booking-detail`;

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
        description: `GoCar Hub booking payment #${booking.id.slice(0, 8).toUpperCase()}`,
        callbackUrl: `${supabaseUrl}/functions/v1/hubtel-callback`,
        returnUrl: `${returnBase}?id=${booking.id}&payment=success`,
        cancellationUrl: `${returnBase}?id=${booking.id}&payment=cancelled`,
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
        .from('booking_payments')
        .update({ status: 'failed' })
        .eq('hubtel_reference', clientReference);
      return json({ error: 'Hubtel returned a non-JSON response', debug: { status: hubtelResponse.status, body: hubtelRawText.slice(0, 500) } }, 502);
    }

    if (hubtelData.responseCode !== '0000' || !hubtelData.data?.checkoutUrl) {
      await adminClient
        .from('booking_payments')
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
          .from('booking_payments')
          .update({ status: 'failed' })
          .eq('hubtel_reference', clientReference);
      } catch {
        // best-effort diagnostic write; ignore secondary failures
      }
    }
    return json({ error: 'Unexpected error initiating booking payment', debug: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
