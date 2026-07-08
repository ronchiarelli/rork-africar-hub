-- KYC becomes mandatory before the two "produces a real-world transaction"
-- actions: creating a booking (customer) and listing a car for rent/sale
-- (fleet_owner/dealership). Browsing, dashboards, and profile stay open to
-- everyone regardless of KYC status — only booking/listing require it.
-- Submitting KYC (status moves to 'pending') is enough to unblock; admin
-- approval/rejection happens in the background and does not gate initial
-- access, per product decision.

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
  v_customer_kyc public.verification_status;
begin
  select verification_status into v_customer_kyc from public.profiles where id = auth.uid();
  if v_customer_kyc not in ('pending', 'approved') then
    raise exception 'Please complete KYC verification before booking a car';
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

  return v_booking;
end;
$$;

drop policy "cars_insert_owner" on public.cars;
create policy "cars_insert_owner" on public.cars for insert
  with check (
    public.is_admin() or (
      owner_id = auth.uid()
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'fleet_owner' and p.verification_status in ('pending', 'approved')
      )
    )
  );

drop policy "sale_cars_insert_owner" on public.sale_cars;
create policy "sale_cars_insert_owner" on public.sale_cars for insert
  with check (
    public.is_admin() or (
      dealer_id = auth.uid()
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'dealership' and p.verification_status in ('pending', 'approved')
      )
    )
  );
