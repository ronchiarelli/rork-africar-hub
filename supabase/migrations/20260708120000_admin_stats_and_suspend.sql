-- Real platform-wide stats for the admin Overview tab, and a suspend/
-- reactivate action for the Users tab. Both were still mock data.

create or replace function public.admin_platform_stats()
returns table (
  total_users bigint,
  total_bookings bigint,
  total_subscription_revenue numeric,
  total_cars bigint,
  total_sale_cars bigint,
  pending_kyc bigint,
  new_users_this_month bigint,
  new_users_last_month bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can view platform stats';
  end if;

  return query select
    (select count(*) from public.profiles),
    (select count(*) from public.bookings),
    (select coalesce(sum(amount), 0) from public.subscription_payments where status = 'completed'),
    (select count(*) from public.cars),
    (select count(*) from public.sale_cars),
    (select count(*) from public.kyc_documents where status = 'uploaded'),
    (select count(*) from public.profiles where created_at >= date_trunc('month', now())),
    (select count(*) from public.profiles where created_at >= date_trunc('month', now()) - interval '1 month'
       and created_at < date_trunc('month', now()));
end;
$$;

grant execute on function public.admin_platform_stats() to authenticated;

create or replace function public.admin_set_suspended(p_user_id uuid, p_suspended boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can suspend or reactivate accounts';
  end if;
  update public.profiles set is_suspended = p_suspended where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;
