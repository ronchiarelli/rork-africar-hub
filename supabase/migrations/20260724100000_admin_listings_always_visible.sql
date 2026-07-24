-- Cars/sale_cars/dealer_listings visibility (cars_select_visible etc.) all
-- gate on owner_subscription_active(owner_id) — correct for regular
-- fleet_owner/dealership listings, but admin accounts never have a
-- subscription row at all (they aren't billed), so anything an admin lists
-- was invisible to every other user: the RLS check evaluated the OWNER's
-- (admin's) subscription state, not the viewer's, and came back false.
-- Only the admin who created it (or another admin) could see it, since
-- those cases are covered by the policy's separate is_admin()/owner_id
-- clauses. Admin-owned listings should simply never be subject to a
-- subscription requirement that doesn't apply to admins in the first place.
create or replace function public.owner_subscription_active(p_owner_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_owner_id is null or exists (
    select 1 from public.profiles p where p.id = p_owner_id and p.role = 'admin'
  ) or exists (
    select 1 from public.subscriptions s
    where s.user_id = p_owner_id
      and s.status in ('trialing', 'active')
      and s.current_period_end is not null
      and s.current_period_end >= now()
  );
$$;
