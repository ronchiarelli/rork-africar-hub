-- SMS-based PIN reset. Closes the recovery gap left by phone+PIN login:
-- without a verified channel there was no way for a user who forgot their
-- PIN to get back in without an admin doing it by hand.
--
-- Codes are stored HASHED, never in plaintext. A reset code is a bearer
-- credential for the account — if this table ever leaked, plaintext codes
-- would be immediately usable against every pending reset.

create table if not exists public.pin_reset_codes (
  phone text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  -- Throttles how often a new code can be requested. Each request costs
  -- real money (one SMS) and can be used to harass a number, so this is a
  -- spend control as much as a security control.
  last_sent_at timestamptz not null default now(),
  sent_count_hour int not null default 1,
  hour_window_started_at timestamptz not null default now()
);

alter table public.pin_reset_codes enable row level security;
-- Written only by the phone-pin-reset Edge Function via service role.
revoke all on public.pin_reset_codes from anon, authenticated;

comment on table public.pin_reset_codes is
  'Hashed SMS PIN-reset codes. Service-role only; never readable by clients.';

-- Hash helper so the Edge Function never has to handle the algorithm
-- choice, and so a code can be verified without ever being selected out.
create or replace function public.hash_reset_code(p_code text, p_phone text)
returns text language sql immutable as $$
  -- sha256() is core Postgres (11+), so this doesn't depend on pgcrypto
  -- being installed into any particular schema.
  -- Salted with the phone so an attacker who obtains the table can't build
  -- one rainbow table across all rows (only 1,000,000 possible codes).
  select encode(sha256(convert_to(p_phone || ':' || p_code, 'UTF8')), 'hex');
$$;
