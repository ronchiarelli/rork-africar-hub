-- Fleet-owner-scoped analytics: view tracking for rental cars (there was
-- previously no views column at all on public.cars — sale_cars/dealer_listings
-- have one but it's never incremented anywhere in the app, so this is new,
-- working tracking rather than wiring up an existing counter), plus owner-scoped
-- trend/top-car RPCs mirroring admin_monthly_trends()/admin_top_cars() but
-- restricted to the caller's own fleet.

alter table public.cars add column if not exists views int not null default 0;

-- Public, side-effect-only increment — safe for anon+authenticated since it
-- reveals nothing and only ever adds 1 to a single row's counter.
create or replace function public.increment_car_views(p_car_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.cars set views = views + 1 where id = p_car_id;
$$;

grant execute on function public.increment_car_views(uuid) to anon, authenticated;

-- Monthly trend data for the last 6 months, scoped to the caller's own cars
-- (no is_admin() gate needed — filtering by owner_id = auth.uid() means a
-- non-owner simply gets rows of zeroes for cars they don't own).
create or replace function public.fleet_owner_monthly_trends()
returns table (
  month_start date,
  bookings bigint,
  revenue numeric
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with months as (
    select date_trunc('month', now())::date - (n || ' months')::interval as month_start
    from generate_series(0, 5) as n
  )
  select
    m.month_start::date,
    (select count(*) from public.bookings b
       join public.cars c on c.id = b.car_id
       where c.owner_id = auth.uid()
         and b.created_at >= m.month_start and b.created_at < m.month_start + interval '1 month'),
    (select coalesce(sum(b.total_price), 0) from public.bookings b
       join public.cars c on c.id = b.car_id
       where c.owner_id = auth.uid()
         and b.status = 'completed'
         and b.created_at >= m.month_start and b.created_at < m.month_start + interval '1 month')
  from months m
  order by m.month_start asc;
end;
$$;

grant execute on function public.fleet_owner_monthly_trends() to authenticated;

-- Top 5 of the caller's own cars by booking count (all-time), including
-- current view count for context.
create or replace function public.fleet_owner_top_cars()
returns table (
  car_id uuid,
  brand text,
  model text,
  image text,
  views int,
  booking_count bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select c.id, c.brand, c.model, c.image, c.views, count(b.id) as booking_count
  from public.cars c
  left join public.bookings b on b.car_id = c.id
  where c.owner_id = auth.uid()
  group by c.id, c.brand, c.model, c.image, c.views
  order by booking_count desc, c.views desc
  limit 5;
end;
$$;

grant execute on function public.fleet_owner_top_cars() to authenticated;
