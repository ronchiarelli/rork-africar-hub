-- In-app Hubtel payment for bookings, gated to an admin-managed allowlist of
-- fleet owners/dealers (not everyone yet). Mirrors the existing
-- subscription-payment pattern: a dedicated payments table, a
-- SECURITY DEFINER completion RPC, notify_user() on success/failure.

alter table public.profiles
  add column accepts_inapp_payment boolean not null default false;

alter table public.bookings
  add column payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'paid'));

create table public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  hubtel_reference text unique,
  hubtel_transaction_id text,
  created_at timestamptz not null default now()
);
create index idx_booking_payments_booking on public.booking_payments (booking_id);

alter table public.booking_payments enable row level security;

-- read: the booking's customer, the car's owner, or admin (mirrors
-- issue_reports_select's join-through-bookings shape). No client
-- insert/update grant — only the initiate-booking-payment Edge Function
-- (service role) and the RPCs below ever write this table.
grant select on public.booking_payments to authenticated;
create policy "booking_payments_select" on public.booking_payments for select
  using (
    public.is_admin() or exists (
      select 1 from public.bookings b
      join public.cars c on c.id = b.car_id
      where b.id = booking_id and (b.customer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Lets a customer viewing their own booking know whether "Pay Now" should
-- show, without needing read access to the car owner's profiles row
-- (profiles RLS otherwise blocks cross-user reads) — same shape as
-- owner_subscription_active(), which is likewise safe to expose since it
-- only returns a boolean.
create or replace function public.owner_accepts_inapp_payment(p_owner_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select accepts_inapp_payment from public.profiles where id = p_owner_id), false);
$$;
grant execute on function public.owner_accepts_inapp_payment(uuid) to authenticated;

-- Admin-only allowlist toggle, mirrors admin_set_suspended exactly.
create or replace function public.admin_set_inapp_payment_enabled(p_user_id uuid, p_enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change this setting';
  end if;
  update public.profiles set accepts_inapp_payment = p_enabled where id = p_user_id;
end;
$$;
grant execute on function public.admin_set_inapp_payment_enabled(uuid, boolean) to authenticated;

-- Notify both parties when a booking payment completes.
create or replace function public.complete_booking_payment(
  p_client_reference text,
  p_amount numeric,
  p_hubtel_transaction_id text
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_payment public.booking_payments%rowtype;
  v_booking public.bookings%rowtype;
  v_owner_id uuid;
begin
  select * into v_payment from public.booking_payments
  where hubtel_reference = p_client_reference and status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  if abs(v_payment.amount - p_amount) > 0.01 then
    update public.booking_payments set status = 'failed' where id = v_payment.id;
    return false;
  end if;

  update public.booking_payments
  set status = 'completed', hubtel_transaction_id = p_hubtel_transaction_id
  where id = v_payment.id;

  update public.bookings set payment_status = 'paid'
  where id = v_payment.booking_id
  returning * into v_booking;

  select c.owner_id into v_owner_id from public.cars c where c.id = v_booking.car_id;

  perform public.notify_user(
    v_booking.customer_id, 'payment', 'Payment Successful',
    'Your payment of GH₵' || p_amount || ' for booking #' || upper(v_booking.id::text) || ' was received.',
    '/booking-detail', jsonb_build_object('id', v_booking.id)
  );
  perform public.notify_user(
    v_owner_id, 'payment', 'Booking Paid',
    'The customer paid GH₵' || p_amount || ' for booking #' || upper(v_booking.id::text) || '.',
    '/booking-detail', jsonb_build_object('id', v_booking.id)
  );

  return true;
end;
$$;

create or replace function public.fail_booking_payment(p_client_reference text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.booking_payments set status = 'failed'
  where hubtel_reference = p_client_reference and status = 'pending';
end;
$$;
