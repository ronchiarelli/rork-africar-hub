-- Booking creation and fleet-owner review, now fully decoupled from payment.
-- Pricing is always server-computed from the car's current price_per_day so
-- a client can never submit a tampered total.

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

grant execute on function public.create_booking(uuid, date, date, text) to authenticated;

-- Fleet owner (or admin) approves/rejects a pending booking request. Payment
-- is arranged directly between the owner and customer off-platform; the app
-- only tracks the booking's approval state.
create or replace function public.fleet_owner_review_booking(
  p_booking_id uuid,
  p_decision text -- 'approved' or 'cancelled'
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
  v_is_owner boolean;
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

  update public.bookings set status = p_decision::public.booking_status
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.fleet_owner_review_booking(uuid, text) to authenticated;
