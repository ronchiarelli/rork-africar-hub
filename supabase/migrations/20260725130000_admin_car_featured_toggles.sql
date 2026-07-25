-- Admin-manual, no-payment featured toggles for rental cars — mirrors
-- admin_set_sale_car_featured/admin_set_sale_car_home_featured exactly
-- (20260725100000), just missing for the cars table until now. Lets an
-- admin feature a rental car for free (comps/promos/catalog cars with no
-- real owner to charge), independent of the self-service paid flow added
-- in 20260725120000.
create or replace function public.admin_set_car_featured(p_car_id uuid, p_featured boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  update public.cars set is_featured = p_featured where id = p_car_id;
end;
$$;

create or replace function public.admin_set_car_home_featured(p_car_id uuid, p_featured boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  update public.cars set is_home_featured = p_featured where id = p_car_id;
end;
$$;

grant execute on function public.admin_set_car_featured(uuid, boolean) to authenticated;
grant execute on function public.admin_set_car_home_featured(uuid, boolean) to authenticated;
