-- Admin dashboard expansion: role revoke, subscription overrides, and
-- analytics trend data. KYC document viewing/revoke reuses the existing
-- admin_review_kyc RPC (calling it with 'rejected' on an already-verified
-- doc naturally revokes it and re-blocks booking/listing via the KYC gate).

-- Demote a fleet_owner/dealership back to customer. Independent of
-- role_applications (which only tracks pending upgrade requests) — this is
-- a direct admin override for support/moderation cases.
create or replace function public.admin_revoke_role(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can revoke roles';
  end if;
  update public.profiles set role = 'customer' where id = p_user_id and role in ('fleet_owner', 'dealership');
end;
$$;

grant execute on function public.admin_revoke_role(uuid) to authenticated;

-- Manually extend a subscription's current billing period (and trial end,
-- if still trialing) by N days. Support/goodwill override — normal renewal
-- runs automatically via attempt_subscription_renewal.
create or replace function public.admin_extend_subscription(p_user_id uuid, p_days int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can extend subscriptions';
  end if;
  if p_days <= 0 then
    raise exception 'p_days must be positive';
  end if;
  update public.subscriptions
  set current_period_end = coalesce(current_period_end, now()) + make_interval(days => p_days),
      trial_ends_at = case when status = 'trialing' then coalesce(trial_ends_at, now()) + make_interval(days => p_days) else trial_ends_at end,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

grant execute on function public.admin_extend_subscription(uuid, int) to authenticated;

-- Directly set a subscription's status (e.g. reactivate a cancelled one, or
-- manually cancel one for a support case).
create or replace function public.admin_set_subscription_status(p_user_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change subscription status';
  end if;
  if p_status not in ('trialing', 'active', 'past_due', 'cancelled') then
    raise exception 'invalid status';
  end if;
  update public.subscriptions
  set status = p_status::public.subscription_status, updated_at = now()
  where user_id = p_user_id;
end;
$$;

grant execute on function public.admin_set_subscription_status(uuid, text) to authenticated;

-- Monthly trend data for the last 6 months: new signups, bookings created,
-- and completed subscription revenue. One row per month, oldest first.
create or replace function public.admin_monthly_trends()
returns table (
  month_start date,
  new_users bigint,
  bookings bigint,
  revenue numeric
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can view analytics';
  end if;

  return query
  with months as (
    select date_trunc('month', now())::date - (n || ' months')::interval as month_start
    from generate_series(0, 5) as n
  )
  select
    m.month_start::date,
    (select count(*) from public.profiles p
       where p.created_at >= m.month_start and p.created_at < m.month_start + interval '1 month'),
    (select count(*) from public.bookings b
       where b.created_at >= m.month_start and b.created_at < m.month_start + interval '1 month'),
    (select coalesce(sum(sp.amount), 0) from public.subscription_payments sp
       where sp.status = 'completed' and sp.created_at >= m.month_start and sp.created_at < m.month_start + interval '1 month')
  from months m
  order by m.month_start asc;
end;
$$;

grant execute on function public.admin_monthly_trends() to authenticated;

-- Top 5 cars by booking count (all-time), for a quick "what's popular" view.
create or replace function public.admin_top_cars()
returns table (
  car_id uuid,
  brand text,
  model text,
  image text,
  booking_count bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can view analytics';
  end if;

  return query
  select c.id, c.brand, c.model, c.image, count(b.id) as booking_count
  from public.cars c
  join public.bookings b on b.car_id = c.id
  group by c.id, c.brand, c.model, c.image
  order by booking_count desc
  limit 5;
end;
$$;

grant execute on function public.admin_top_cars() to authenticated;
