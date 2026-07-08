-- Review findings fixed here:
--
-- 1. cars/sale_cars insert policies only checked owner_id/dealer_id = auth.uid(),
--    not that the caller actually holds the fleet_owner/dealership role. A plain
--    'customer' account could insert a car directly via the REST API (bypassing
--    the app's own UI role-gating) and become a de facto unvetted fleet owner.
--
-- 2. role_applications.requested_role had no constraint — a client could submit
--    a request for 'admin' (the app's UI only ever offers fleet_owner/dealership,
--    but nothing stopped a direct API call), and admin_approve_role would have
--    happily granted whatever role was stored if an admin approved it without
--    scrutiny.
--
-- 3. create_booking() didn't check the car owner's subscription status, so a
--    customer holding a stale car_id (e.g. from before the owner's subscription
--    lapsed) could still create a real booking against a car that's supposed to
--    be fully hidden/inactive once its owner falls out of good standing.

-- Fix 1: require actual role membership, not just ownership-shaped input.
drop policy "cars_insert_owner" on public.cars;
create policy "cars_insert_owner" on public.cars for insert
  with check (
    public.is_admin() or (
      owner_id = auth.uid()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'fleet_owner')
    )
  );

drop policy "sale_cars_insert_owner" on public.sale_cars;
create policy "sale_cars_insert_owner" on public.sale_cars for insert
  with check (
    public.is_admin() or (
      dealer_id = auth.uid()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'dealership')
    )
  );

-- Fix 2: role_applications can never target anything but the two self-service
-- upgrade paths, at the schema level (holds regardless of which policy path
-- an insert comes through).
alter table public.role_applications
  add constraint role_applications_requested_role_check
  check (requested_role in ('fleet_owner', 'dealership'));

-- Defense in depth: admin_approve_role re-validates even though the constraint
-- above should already make this unreachable.
create or replace function public.admin_approve_role(
  p_user_id uuid,
  p_decision text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_app public.role_applications%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review role applications';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  select * into v_app from public.role_applications
  where user_id = p_user_id and status = 'pending'
  order by created_at desc limit 1;

  if not found then
    raise exception 'No pending role application for this user';
  end if;

  if v_app.requested_role not in ('fleet_owner', 'dealership') then
    raise exception 'Requested role is not eligible for self-service approval';
  end if;

  update public.role_applications
  set status = p_decision::public.role_app_status, reviewed_by = auth.uid(), reviewed_at = now()
  where id = v_app.id;

  if p_decision = 'approved' then
    update public.profiles set role = v_app.requested_role where id = p_user_id;
    perform public.start_trial_subscription(p_user_id);
  end if;
end;
$$;

-- Fix 3: a booking can only be created against a car whose owner is currently
-- in good standing (or has no owner at all — seed/admin inventory).
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

  return v_booking;
end;
$$;
