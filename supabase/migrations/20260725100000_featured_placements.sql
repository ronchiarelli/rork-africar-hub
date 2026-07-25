-- Manual admin control over paid "featured" placements. is_featured has
-- existed since the initial schema but nothing ever set it to true —
-- useCreateSaleCar hardcodes it false and no UI ever exposed a toggle, so
-- it was dead weight. Two paid placements now exist, priced separately:
--   - Marketplace "Featured" badge (existing is_featured)  — GH₵300/month
--   - Home screen "Cars For Sale" carousel (is_home_featured) — GH₵250/month
-- Both are admin-only (the dealer negotiates payment with the admin
-- directly, off-platform, same as banner placements below) — never
-- self-service, so these are gated at the function level rather than via
-- a client-side update the owner's own RLS grant could otherwise permit.
alter table public.sale_cars add column if not exists is_home_featured boolean not null default false;

create or replace function public.admin_set_sale_car_featured(p_sale_car_id uuid, p_featured boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  update public.sale_cars set is_featured = p_featured where id = p_sale_car_id;
end;
$$;

create or replace function public.admin_set_sale_car_home_featured(p_sale_car_id uuid, p_featured boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  update public.sale_cars set is_home_featured = p_featured where id = p_sale_car_id;
end;
$$;

grant execute on function public.admin_set_sale_car_featured(uuid, boolean) to authenticated;
grant execute on function public.admin_set_sale_car_home_featured(uuid, boolean) to authenticated;
