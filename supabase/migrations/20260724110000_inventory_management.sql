-- Inventory management for fleet owners, dealers, and admin: neither a car
-- nor a sale car listing could ever be deleted, and a car's is_available
-- flag was set to true at creation and then never exposed anywhere again —
-- there was no way to take a listing down short of emailing support.

-- Sale car listings have no equivalent to cars.is_available at all; add one
-- so a dealer can mark a unit sold without deleting its lead/inquiry history.
alter table public.sale_cars add column if not exists is_sold boolean not null default false;

-- Deletes a car the caller owns (or any car, for admins). Cars with booking
-- or review history are protected by existing FK constraints (bookings.car_id
-- and reviews.car_id have no ON DELETE CASCADE, deliberately — losing that
-- history isn't a side effect a "delete" click should silently cause); this
-- just turns the resulting raw FK violation into a clear, actionable message
-- instead of a generic Postgres error reaching the client.
create or replace function public.delete_car(p_car_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.cars where id = p_car_id;
  if not found then
    raise exception 'Car not found';
  end if;
  if not (public.is_admin() or v_owner_id = auth.uid()) then
    raise exception 'Not authorized to delete this car';
  end if;

  begin
    delete from public.cars where id = p_car_id;
  exception when foreign_key_violation then
    raise exception 'This vehicle has booking or review history and can''t be deleted. Mark it unavailable instead.';
  end;
end;
$$;

-- sale_cars deletion doesn't need an equivalent RPC: sale_cars_delete_owner
-- (owner-or-admin) already authorizes it via RLS, and unlike cars there's no
-- FK backstop to translate (dealer_listings/leads cascade-delete) — a plain
-- client-side .delete() is sufficient. The client warns the user first if
-- the listing has leads, since those go with it silently otherwise.

grant execute on function public.delete_car(uuid) to authenticated;
