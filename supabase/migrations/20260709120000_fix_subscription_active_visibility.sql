-- owner_subscription_active() is called from the cars/sale_cars/dealer_listings
-- select policies to decide whether a listing is publicly visible. It was
-- declared without SECURITY DEFINER, so its internal query against
-- public.subscriptions ran with the CALLING role's privileges — and
-- subscriptions only grants select to the row's own owner or an admin.
-- Net effect: any real fleet_owner/dealer's listings were invisible to
-- every other user (customers included), even with a fully active
-- subscription, because the inner exists() query was silently blocked by
-- subscriptions' own RLS and always evaluated to zero rows. Only seed
-- inventory (owner_id/dealer_id null, short-circuited before ever touching
-- subscriptions) happened to render, which is why this went unnoticed.
-- Same class of bug as the earlier is_admin() recursion fix.
create or replace function public.owner_subscription_active(p_owner_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_owner_id is null or exists (
    select 1 from public.subscriptions s
    where s.user_id = p_owner_id
      and s.status in ('trialing', 'active')
      and s.current_period_end is not null
      and s.current_period_end >= now()
  );
$$;
