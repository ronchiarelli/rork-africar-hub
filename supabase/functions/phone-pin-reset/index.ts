// SMS PIN reset via Hubtel.
//
// Two actions:
//   request — generate a 6-digit code, SMS it, store only its hash
//   confirm — verify the code and set the new PIN
//
// Hubtel SMS contract (help.hubtel.com):
//   POST https://api.hubtel.com/v1/messages/send
//   Authorization: Basic base64(clientId:clientSecret)
//   { From, To, Content, RegisteredDelivery }
// Deliberately POST + Basic Auth rather than the GET "Quick Send" variant,
// which carries ClientId/ClientSecret in the query string where they end up
// in proxy, CDN and function logs.
//
// Deploy with:
//   supabase functions deploy phone-pin-reset
// Requires secret: HUBTEL_SMS_SENDER_ID (an approved Hubtel sender ID).
// Reuses HUBTEL_CLIENT_ID / HUBTEL_CLIENT_SECRET unless SMS-specific
// credentials are set as HUBTEL_SMS_CLIENT_ID / HUBTEL_SMS_CLIENT_SECRET.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const PHONE_RE = /^233[0-9]{9}$/;
const PIN_RE = /^\d{6}$/;
const CODE_TTL_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { action, phone, code, pin } = await req.json().catch(() => ({}));
    if (!PHONE_RE.test(phone ?? '')) {
      return json({ error: 'Enter a valid Ghana phone number.' }, 400);
    }

    // Generic success used whenever we must not reveal whether a number is
    // registered. Someone probing the endpoint learns nothing either way.
    const genericSent = {
      sent: true,
      message: 'If that number has an account, a reset code has been sent to it.',
    };

    if (action === 'request') {
      const senderId = Deno.env.get('HUBTEL_SMS_SENDER_ID');
      if (!senderId) {
        return json({ error: 'PIN reset by SMS is not configured yet.' }, 503);
      }

      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('phone_login', phone)
        .maybeSingle();

      const { data: existing } = await admin
        .from('pin_reset_codes')
        .select('last_sent_at, sent_count_hour, hour_window_started_at')
        .eq('phone', phone)
        .maybeSingle();

      // Throttle before doing anything else — applies whether or not the
      // number is registered, so timing/behaviour can't be used to probe,
      // and an attacker can't burn your SMS credit.
      const now = Date.now();
      if (existing) {
        const sinceLast = (now - new Date(existing.last_sent_at).getTime()) / 1000;
        if (sinceLast < RESEND_COOLDOWN_SECONDS) {
          return json(
            { error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - sinceLast)}s before requesting another code.` },
            429,
          );
        }
        const windowAgeMin = (now - new Date(existing.hour_window_started_at).getTime()) / 60000;
        if (windowAgeMin < 60 && existing.sent_count_hour >= MAX_SENDS_PER_HOUR) {
          return json({ error: 'Too many reset requests. Please try again later.' }, 429);
        }
      }

      if (!profile) {
        // Unregistered: report success without sending anything.
        return json(genericSent);
      }

      const generated = String(Math.floor(100000 + Math.random() * 900000));
      const { data: hashed, error: hashError } = await admin.rpc('hash_reset_code', {
        p_code: generated,
        p_phone: phone,
      });
      if (hashError || !hashed) {
        return json({ error: 'Could not start the reset.' }, 500);
      }

      const windowExpired =
        !existing || (now - new Date(existing.hour_window_started_at).getTime()) / 60000 >= 60;

      const { error: upsertError } = await admin.from('pin_reset_codes').upsert({
        phone,
        code_hash: hashed,
        expires_at: new Date(now + CODE_TTL_MINUTES * 60000).toISOString(),
        attempts: 0,
        last_sent_at: new Date(now).toISOString(),
        sent_count_hour: windowExpired ? 1 : (existing?.sent_count_hour ?? 0) + 1,
        hour_window_started_at: windowExpired
          ? new Date(now).toISOString()
          : existing!.hour_window_started_at,
      });
      if (upsertError) {
        return json({ error: 'Could not start the reset.' }, 500);
      }

      const clientId = Deno.env.get('HUBTEL_SMS_CLIENT_ID') ?? Deno.env.get('HUBTEL_CLIENT_ID')!;
      const clientSecret =
        Deno.env.get('HUBTEL_SMS_CLIENT_SECRET') ?? Deno.env.get('HUBTEL_CLIENT_SECRET')!;

      const smsRes = await fetch('https://api.hubtel.com/v1/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          From: senderId,
          To: `+${phone}`,
          Content: `Your GoCar Hub PIN reset code is ${generated}. It expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, ignore this message.`,
          RegisteredDelivery: false,
        }),
      });

      if (!smsRes.ok) {
        const body = await smsRes.text();
        console.error('Hubtel SMS failed', smsRes.status, body.slice(0, 300));
        // Drop the code — leaving it live with no way to receive it would
        // just block the user behind the resend cooldown.
        await admin.from('pin_reset_codes').delete().eq('phone', phone);
        return json({ error: 'Could not send the reset code. Please try again.' }, 502);
      }

      return json(genericSent);
    }

    if (action === 'confirm') {
      if (!PIN_RE.test(pin ?? '')) {
        return json({ error: 'Your new PIN must be exactly 6 digits.' }, 400);
      }
      if (!/^\d{6}$/.test(code ?? '')) {
        return json({ error: 'Enter the 6-digit code from the SMS.' }, 400);
      }

      const { data: row } = await admin
        .from('pin_reset_codes')
        .select('code_hash, expires_at, attempts')
        .eq('phone', phone)
        .maybeSingle();

      if (!row) {
        return json({ error: 'That code is no longer valid. Request a new one.' }, 400);
      }
      if (new Date(row.expires_at) < new Date()) {
        await admin.from('pin_reset_codes').delete().eq('phone', phone);
        return json({ error: 'That code has expired. Request a new one.' }, 400);
      }
      if (row.attempts >= MAX_CODE_ATTEMPTS) {
        await admin.from('pin_reset_codes').delete().eq('phone', phone);
        return json({ error: 'Too many incorrect codes. Request a new one.' }, 429);
      }

      const { data: attemptHash } = await admin.rpc('hash_reset_code', {
        p_code: code,
        p_phone: phone,
      });
      if (attemptHash !== row.code_hash) {
        await admin
          .from('pin_reset_codes')
          .update({ attempts: row.attempts + 1 })
          .eq('phone', phone);
        return json({ error: 'That code is incorrect.' }, 401);
      }

      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('phone_login', phone)
        .maybeSingle();
      if (!profile) {
        return json({ error: 'That code is no longer valid. Request a new one.' }, 400);
      }

      const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
        password: pin,
      });
      if (updateError) {
        return json({ error: 'Could not set your new PIN.' }, 500);
      }

      // Consume the code and clear any sign-in lockout, so the user can use
      // the PIN they just set immediately.
      await admin.from('pin_reset_codes').delete().eq('phone', phone);
      await admin.from('pin_login_attempts').delete().eq('phone', phone);

      return json({ reset: true });
    }

    return json({ error: 'action must be request or confirm' }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: 'Unexpected error resetting your PIN.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
