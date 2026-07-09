-- Supabase's pg-safeupdate guard rejects UPDATE statements with no WHERE
-- clause (confirmed via a live "UPDATE requires a WHERE clause" error when
-- an admin tried to change the rate). Both updates here are intentionally
-- unconditional (every subscription moves to the new rate), so add an
-- always-true WHERE to satisfy the guard rather than narrowing the update.
create or replace function public.admin_set_subscription_rate(p_rate numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can update the subscription rate';
  end if;
  if p_rate is null or p_rate <= 0 then
    raise exception 'Rate must be a positive number';
  end if;

  update public.platform_settings set subscription_monthly_rate = p_rate, updated_at = now() where id = true;
  update public.subscriptions set amount = p_rate, updated_at = now() where true;
end;
$$;
