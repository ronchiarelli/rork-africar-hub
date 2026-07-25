-- Self-service featured placements for fleet owners and dealers: the
-- owner pays in-app via Hubtel and the placement activates automatically
-- on payment success, instead of the admin-manual toggle added in
-- 20260725100000 (that migration's admin RPCs stay as-is — an admin can
-- still flip either flag directly, e.g. for goodwill/promo features).
-- Mirrors the booking_payments pattern exactly: a dedicated payments
-- table, a SECURITY DEFINER completion RPC row-locked by clientReference,
-- notify_user() on success.

-- Rental cars had no featured concept at all until now — sale_cars already
-- has is_featured (added in the initial schema) and is_home_featured
-- (added in 20260725100000).
alter table public.cars add column if not exists is_featured boolean not null default false;
alter table public.cars add column if not exists is_home_featured boolean not null default false;

create table public.featured_payments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('car', 'sale_car')),
  target_id uuid not null,
  placement text not null check (placement in ('marketplace', 'home')),
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  hubtel_reference text unique,
  hubtel_transaction_id text,
  created_at timestamptz not null default now()
);
create index idx_featured_payments_target on public.featured_payments (target_type, target_id);

alter table public.featured_payments enable row level security;

-- read: the target's owner, or admin. No client insert/update grant —
-- only the initiate-featured-payment Edge Function (service role) and the
-- RPCs below ever write this table.
grant select on public.featured_payments to authenticated;
create policy "featured_payments_select" on public.featured_payments for select
  using (
    public.is_admin() or
    (target_type = 'car' and exists (select 1 from public.cars c where c.id = target_id and c.owner_id = auth.uid())) or
    (target_type = 'sale_car' and exists (select 1 from public.sale_cars s where s.id = target_id and s.dealer_id = auth.uid()))
  );

create or replace function public.complete_featured_payment(
  p_client_reference text,
  p_amount numeric,
  p_hubtel_transaction_id text
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_payment public.featured_payments%rowtype;
  v_owner_id uuid;
  v_label text;
begin
  select * into v_payment from public.featured_payments
  where hubtel_reference = p_client_reference and status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  if abs(v_payment.amount - p_amount) > 0.01 then
    update public.featured_payments set status = 'failed' where id = v_payment.id;
    return false;
  end if;

  update public.featured_payments
  set status = 'completed', hubtel_transaction_id = p_hubtel_transaction_id
  where id = v_payment.id;

  if v_payment.target_type = 'car' then
    if v_payment.placement = 'marketplace' then
      update public.cars set is_featured = true where id = v_payment.target_id;
    else
      update public.cars set is_home_featured = true where id = v_payment.target_id;
    end if;
    select owner_id, brand || ' ' || model into v_owner_id, v_label from public.cars where id = v_payment.target_id;
  else
    if v_payment.placement = 'marketplace' then
      update public.sale_cars set is_featured = true where id = v_payment.target_id;
    else
      update public.sale_cars set is_home_featured = true where id = v_payment.target_id;
    end if;
    select dealer_id, brand || ' ' || model into v_owner_id, v_label from public.sale_cars where id = v_payment.target_id;
  end if;

  if v_owner_id is not null then
    perform public.notify_user(
      v_owner_id, 'payment', 'Listing Featured',
      v_label || ' is now featured on ' || (case when v_payment.placement = 'marketplace' then 'Search/Marketplace' else 'the Home screen' end) || '.',
      null, null
    );
  end if;

  return true;
end;
$$;

create or replace function public.fail_featured_payment(p_client_reference text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.featured_payments set status = 'failed'
  where hubtel_reference = p_client_reference and status = 'pending';
end;
$$;
