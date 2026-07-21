-- Fleet owners and dealerships handle most payments directly with
-- customers off-platform (only an admin-allowlisted subset use in-app
-- Hubtel payment). This lets them fill in Mobile Money / bank details on
-- their own profile so a customer arranging payment directly has real
-- account info to send to, instead of just a phone number and having to
-- ask separately "how do I pay you?".
alter table public.profiles add column if not exists momo_provider text;
alter table public.profiles add constraint profiles_momo_provider_check
  check (momo_provider is null or momo_provider in ('mtn', 'vodafone', 'airteltigo'));
alter table public.profiles add column if not exists momo_number text;
alter table public.profiles add column if not exists bank_name text;
alter table public.profiles add column if not exists bank_account_name text;
alter table public.profiles add column if not exists bank_account_number text;

grant update (name, phone, avatar, whatsapp, momo_provider, momo_number, bank_name, bank_account_name, bank_account_number)
  on public.profiles to authenticated;

-- Returns an owner's payment details, but only to the owner themselves, an
-- admin, or a customer who actually has a relationship with them (a booking
-- on one of their rental cars, or a lead on one of their sale listings) —
-- these are real financial contact details, not safe to expose to any
-- authenticated caller the way owner_subscription_active()'s plain boolean
-- is. Returns zero rows (not an error) when the caller isn't authorized, so
-- client code can just treat "no row" as "nothing to show".
create or replace function public.owner_payment_details(p_owner_id uuid)
returns table (
  momo_provider text,
  momo_number text,
  bank_name text,
  bank_account_name text,
  bank_account_number text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is distinct from p_owner_id
     and not public.is_admin()
     and not exists (
       select 1 from public.bookings b
       join public.cars c on c.id = b.car_id
       where c.owner_id = p_owner_id and b.customer_id = auth.uid()
     )
     and not exists (
       select 1 from public.leads l
       join public.dealer_listings dl on dl.id = l.dealer_listing_id
       where dl.dealer_id = p_owner_id and l.customer_id = auth.uid()
     )
  then
    return;
  end if;

  return query
  select p.momo_provider, p.momo_number, p.bank_name, p.bank_account_name, p.bank_account_number
  from public.profiles p
  where p.id = p_owner_id;
end;
$$;

grant execute on function public.owner_payment_details(uuid) to authenticated;
