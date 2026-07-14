-- Booking requests no longer require KYC to be submitted at all up front —
-- anyone with an account can request a car, and the request sits in
-- 'pending' regardless of KYC state. The gate moves one step later: the
-- fleet owner can only move a request to 'approved' once the customer's
-- KYC has been fully verified by an admin (profiles.verification_status =
-- 'approved'). Declining a request is never gated. This lets a brand-new
-- guest submit a request immediately, then finish KYC while it's pending.

create or replace function public.create_booking(
  p_car_id uuid,
  p_pickup_date date,
  p_return_date date,
  p_pickup_location text
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_car public.cars%rowtype;
  v_days int;
  v_subtotal numeric;
  v_service_fee numeric;
  v_insurance_fee numeric;
  v_total numeric;
  v_booking public.bookings%rowtype;
  v_customer_name text;
begin
  if p_return_date < p_pickup_date then
    raise exception 'return_date must be on or after pickup_date';
  end if;

  select * into v_car from public.cars where id = p_car_id and is_available = true;
  if not found then
    raise exception 'Car not available';
  end if;

  if not public.owner_subscription_active(v_car.owner_id) then
    raise exception 'This car is not currently bookable';
  end if;

  if exists (
    select 1 from public.bookings b
    where b.car_id = p_car_id
      and b.status in ('pending', 'approved', 'active')
      and b.pickup_date <= p_return_date
      and b.return_date >= p_pickup_date
  ) then
    raise exception 'Car is already booked for those dates';
  end if;

  v_days := greatest(1, (p_return_date - p_pickup_date));
  v_subtotal := v_car.price_per_day * v_days;
  v_service_fee := round(v_subtotal * 0.10, 2);
  v_insurance_fee := round(v_subtotal * 0.05, 2);
  v_total := v_subtotal + v_service_fee + v_insurance_fee;

  insert into public.bookings (
    car_id, customer_id, pickup_date, return_date, pickup_location,
    total_days, subtotal, service_fee, insurance_fee, total_price, status
  ) values (
    p_car_id, auth.uid(), p_pickup_date, p_return_date, p_pickup_location,
    v_days, v_subtotal, v_service_fee, v_insurance_fee, v_total, 'pending'
  ) returning * into v_booking;

  select name into v_customer_name from public.profiles where id = auth.uid();
  perform public.notify_user(
    v_car.owner_id,
    'booking',
    'New Booking Request',
    coalesce(v_customer_name, 'A customer') || ' wants to book your ' || v_car.brand || ' ' || v_car.model,
    '/booking-detail',
    jsonb_build_object('id', v_booking.id)
  );

  return v_booking;
end;
$$;

-- Approval now additionally requires the customer's KYC to be fully
-- verified; decline is unaffected.
create or replace function public.fleet_owner_review_booking(
  p_booking_id uuid,
  p_decision text
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
  v_is_owner boolean;
  v_customer_kyc public.verification_status;
begin
  if p_decision not in ('approved', 'cancelled') then
    raise exception 'decision must be approved or cancelled';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking not found';
  end if;

  select exists (
    select 1 from public.cars c where c.id = v_booking.car_id and c.owner_id = auth.uid()
  ) into v_is_owner;

  if not (v_is_owner or public.is_admin()) then
    raise exception 'Not authorized to review this booking';
  end if;

  if v_booking.status != 'pending' then
    raise exception 'Only pending bookings can be reviewed';
  end if;

  if p_decision = 'approved' then
    select verification_status into v_customer_kyc from public.profiles where id = v_booking.customer_id;
    if v_customer_kyc is distinct from 'approved' then
      raise exception 'This customer has not completed KYC verification yet';
    end if;
  end if;

  update public.bookings set status = p_decision::public.booking_status
  where id = p_booking_id
  returning * into v_booking;

  perform public.notify_user(
    v_booking.customer_id,
    'booking',
    case when p_decision = 'approved' then 'Booking Approved' else 'Booking Declined' end,
    case when p_decision = 'approved'
      then 'Your booking request has been approved. The owner will share payment details with you directly.'
      else 'Your booking request was declined.'
    end,
    '/booking-detail',
    jsonb_build_object('id', v_booking.id)
  );

  return v_booking;
end;
$$;

-- Let a fleet owner read the KYC documents (rows + files) of a customer who
-- has requested/booked one of their cars, so they can judge whether to
-- approve a pending request while KYC is still in flight. Additive to the
-- existing "own or admin" policies (RLS OR's multiple permissive policies).
create policy "kyc_select_booking_owner" on public.kyc_documents for select
  using (
    exists (
      select 1 from public.bookings b
      join public.cars c on c.id = b.car_id
      where b.customer_id = kyc_documents.user_id and c.owner_id = auth.uid()
    )
  );

create policy "kyc_documents_select_booking_owner" on storage.objects for select
  using (
    bucket_id = 'kyc-documents' and exists (
      select 1 from public.bookings b
      join public.cars c on c.id = b.car_id
      where c.owner_id = auth.uid() and b.customer_id::text = (storage.foldername(name))[1]
    )
  );
