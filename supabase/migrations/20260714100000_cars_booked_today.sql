-- Lets browse screens show a "Booked" badge on a car's image. Neither
-- cars.is_available nor fleet_vehicles.status reflects "has a confirmed
-- booking covering today" — both are manual, indefinite flags an owner
-- sets, and booking status never actually reaches 'active' through any
-- existing flow yet, so a car "booked today" is really: an approved (or,
-- once that lifecycle exists, active) booking whose date range covers
-- today. Bookings RLS restricts read access to the booking's own
-- customer/owner/admin, so a browsing customer can't query this directly —
-- this exposes just the car_id list via a SECURITY DEFINER function,
-- mirroring owner_subscription_active()'s "boolean/id-only, safe to expose
-- broadly" shape.
create or replace function public.cars_booked_today()
returns setof uuid
language sql security definer set search_path = public stable as $$
  select distinct car_id from public.bookings
  where status in ('approved', 'active')
    and pickup_date <= current_date
    and return_date >= current_date;
$$;

grant execute on function public.cars_booked_today() to anon, authenticated;
