-- Phone + 6-digit PIN login, alongside the existing email + password.
--
-- Supabase Auth stays the source of truth for credentials and sessions —
-- we are NOT hand-rolling password hashing or tokens. A phone-first account
-- is created in auth.users with a synthetic, non-deliverable email derived
-- from the canonical phone number, and the PIN is stored as that user's
-- password (so bcrypt, refresh tokens and session handling are all still
-- Supabase's job). The phone number itself lives on profiles.phone_login
-- as the user-facing identifier.
--
-- Deliberate scope note: phone ownership is NOT verified (no SMS OTP), per
-- product decision. That means a PIN cannot be safely self-reset — there's
-- no proven channel to send a reset to — so an admin-only reset is provided
-- at the bottom of this file.

-- Canonical phone: E.164 digits without '+', e.g. 233241234567.
-- Unique so it can act as a login identifier; nullable so existing
-- email-only accounts keep working untouched.
alter table public.profiles add column if not exists phone_login text;

do $$ begin
  alter table public.profiles add constraint profiles_phone_login_format
    check (phone_login is null or phone_login ~ '^233[0-9]{9}$');
exception when duplicate_object then null; end $$;

create unique index if not exists profiles_phone_login_key
  on public.profiles (phone_login) where phone_login is not null;

-- Brute-force protection. A 6-digit PIN is only 1,000,000 combinations, so
-- unlimited attempts would be crackable in minutes; this makes it
-- impractical. Keyed by phone rather than user_id so attempts against a
-- non-existent number are throttled identically — otherwise the difference
-- in behaviour leaks which numbers are registered.
create table if not exists public.pin_login_attempts (
  phone text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

alter table public.pin_login_attempts enable row level security;
-- No client access at all: only the Edge Function (service role) touches this.
revoke all on public.pin_login_attempts from anon, authenticated;

comment on table public.pin_login_attempts is
  'PIN brute-force throttle. Written only by the phone-pin-auth Edge Function via service role.';

-- Returns the synthetic auth email for a canonical phone. Kept in SQL so
-- the Edge Function and any future server-side code derive it identically.
create or replace function public.phone_auth_email(p_phone text)
returns text language sql immutable as $$
  select p_phone || '@phone.gocarhub.app';
$$;

-- Look up whether a phone is registered, without exposing anything else
-- about the account. Used by the signup screen to fail early on a taken
-- number. Returns only a boolean, so it's safe to expose to anon.
create or replace function public.phone_is_registered(p_phone text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where phone_login = p_phone);
$$;

grant execute on function public.phone_is_registered(text) to anon, authenticated;

-- Admin-only PIN reset. Without SMS there is no self-service recovery, so
-- a locked-out user has to be helped manually. This clears the throttle;
-- the new PIN itself is set by the Edge Function (it needs auth admin API).
create or replace function public.admin_clear_pin_lockout(p_phone text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  delete from public.pin_login_attempts where phone = p_phone;
end;
$$;

grant execute on function public.admin_clear_pin_lockout(text) to authenticated;

-- Let a signed-in user attach a phone + PIN to their existing email account
-- (the migration path for users who registered before phone login existed).
-- Only claims the number if nobody else holds it.
create or replace function public.claim_phone_login(p_phone text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_phone !~ '^233[0-9]{9}$' then
    raise exception 'Invalid phone number';
  end if;
  if exists (select 1 from public.profiles where phone_login = p_phone and id <> auth.uid()) then
    raise exception 'That phone number is already linked to another account';
  end if;
  update public.profiles
  set phone_login = p_phone,
      phone = coalesce(phone, '+' || p_phone)
  where id = auth.uid();
end;
$$;

grant execute on function public.claim_phone_login(text) to authenticated;

-- Backfill: existing profiles whose stored phone already parses to a valid
-- Ghana number get it as their login identifier, so they can use phone+PIN
-- as soon as they set one. Numbers that are duplicated across accounts are
-- skipped — a login identifier has to be unambiguous, and picking a winner
-- arbitrarily would hand one user's number to someone else.
with parsed as (
  select
    id,
    case
      when regexp_replace(coalesce(phone, ''), '\D', '', 'g') ~ '^233[0-9]{9}$'
        then regexp_replace(phone, '\D', '', 'g')
      when regexp_replace(coalesce(phone, ''), '\D', '', 'g') ~ '^0[0-9]{9}$'
        then '233' || substring(regexp_replace(phone, '\D', '', 'g') from 2)
      when regexp_replace(coalesce(phone, ''), '\D', '', 'g') ~ '^[0-9]{9}$'
        then '233' || regexp_replace(phone, '\D', '', 'g')
      else null
    end as canonical
  from public.profiles
  where phone_login is null
),
unambiguous as (
  select canonical, min(id::text)::uuid as id
  from parsed
  where canonical is not null
  group by canonical
  having count(*) = 1
)
update public.profiles p
set phone_login = u.canonical
from unambiguous u
where p.id = u.id;
