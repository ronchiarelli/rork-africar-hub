-- Move the KYC gate to the point of transacting.
--
-- Sign-up stays completely open — a new account lands on the home screen
-- with nothing to complete. The requirement kicks in the moment the user
-- tries to *book* or *list* a car, which is where identity actually
-- matters. Previously booking requests could be created with no KYC at all
-- (the check only happened later, when the owner tried to approve, which
-- left customers with dead requests sitting in 'pending'), and listing
-- accepted a merely 'pending' verification.
--
-- Both gates go through kyc_cleared(), so an admin waiver satisfies them
-- exactly like full verification does.

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
  if not public.kyc_cleared(auth.uid()) then
    raise exception 'Complete identity verification before booking a car';
  end if;

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

-- Listing a car now needs the same clearance a booking does. Admins keep
-- their existing bypass for platform/catalog inventory.
drop policy "cars_insert_owner" on public.cars;
create policy "cars_insert_owner" on public.cars for insert
  with check (
    public.is_admin() or (
      owner_id = auth.uid()
      and public.kyc_cleared(auth.uid())
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'fleet_owner'
      )
    )
  );

drop policy "sale_cars_insert_owner" on public.sale_cars;
create policy "sale_cars_insert_owner" on public.sale_cars for insert
  with check (
    public.is_admin() or (
      dealer_id = auth.uid()
      and public.kyc_cleared(auth.uid())
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'dealership'
      )
    )
  );
