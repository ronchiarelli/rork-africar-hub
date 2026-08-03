// Phone + 6-digit PIN authentication.
//
// Login MUST go through this function rather than the client calling
// signInWithPassword directly, because the per-account lockout is the only
// thing standing between a 6-digit PIN (1,000,000 combinations) and a
// trivial brute force. A client-side counter would be bypassed by simply
// not using our client.
//
// Credentials themselves are still Supabase Auth's job: the account is a
// normal auth.users row with a synthetic, non-deliverable email derived
// from the phone number, and the PIN as its password. We never hash or
// store the PIN ourselves.
//
// Deploy with:
//   supabase functions deploy phone-pin-auth
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_FAILED = 5;
const LOCKOUT_MINUTES = 15;

const PHONE_RE = /^233[0-9]{9}$/;
const PIN_RE = /^\d{6}$/;

function authEmail(phone: string) {
  return `${phone}@phone.gocarhub.app`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { action, phone, pin, name } = await req.json().catch(() => ({}));

    if (!PHONE_RE.test(phone ?? '')) {
      return json({ error: 'Enter a valid Ghana phone number.' }, 400);
    }
    if (!PIN_RE.test(pin ?? '')) {
      return json({ error: 'Your PIN must be exactly 6 digits.' }, 400);
    }

    if (action === 'register') {
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('phone_login', phone)
        .maybeSingle();
      if (existing) {
        return json({ error: 'That phone number already has an account. Try signing in.' }, 409);
      }

      // email_confirm so the synthetic address never needs a real inbox.
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: authEmail(phone),
        password: pin,
        email_confirm: true,
        user_metadata: { name: name ?? '', phone: `+${phone}` },
      });
      if (createError || !created.user) {
        return json({ error: createError?.message ?? 'Could not create the account.' }, 400);
      }

      // handle_new_user() already inserted the profile row; attach the
      // login identifier to it.
      const { error: linkError } = await admin
        .from('profiles')
        .update({ phone_login: phone })
        .eq('id', created.user.id);
      if (linkError) {
        // Roll the auth user back so a half-made account can't block the
        // number forever.
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: 'Could not link that phone number.' }, 400);
      }
      // Fall through to sign in so registration returns a live session.
    }

    if (action !== 'register' && action !== 'login') {
      return json({ error: 'action must be login or register' }, 400);
    }

    // --- lockout check (login and post-register sign-in alike) ---
    const { data: attempt } = await admin
      .from('pin_login_attempts')
      .select('failed_count, locked_until')
      .eq('phone', phone)
      .maybeSingle();

    if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
      const mins = Math.max(
        1,
        Math.ceil((new Date(attempt.locked_until).getTime() - Date.now()) / 60000),
      );
      return json(
        { error: `Too many incorrect PIN attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` },
        429,
      );
    }

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: signIn, error: signInError } = await userClient.auth.signInWithPassword({
      email: authEmail(phone),
      password: pin,
    });

    if (signInError || !signIn.session) {
      const failed = (attempt?.failed_count ?? 0) + 1;
      const lock = failed >= MAX_FAILED;
      await admin.from('pin_login_attempts').upsert({
        phone,
        failed_count: lock ? 0 : failed,
        locked_until: lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString() : null,
        last_attempt_at: new Date().toISOString(),
      });
      if (lock) {
        return json(
          { error: `Too many incorrect PIN attempts. Try again in ${LOCKOUT_MINUTES} minutes.` },
          429,
        );
      }
      // Deliberately identical whether the number exists or not, so this
      // can't be used to enumerate registered phone numbers.
      return json(
        { error: 'Incorrect phone number or PIN.', attemptsLeft: MAX_FAILED - failed },
        401,
      );
    }

    // Success — clear any accumulated failures.
    if (attempt) {
      await admin.from('pin_login_attempts').delete().eq('phone', phone);
    }

    return json({
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    });
  } catch (err) {
    console.error(err);
    return json({ error: 'Unexpected error signing in.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
