-- Listings become a reviewed pipeline instead of going live instantly.
--
-- 1. Both fleet owners AND dealers can list either kind of vehicle. The
--    insert policies previously pinned cars->fleet_owner and
--    sale_cars->dealership, so a garage couldn't post a rental and a fleet
--    couldn't post a car for sale.
--
-- 2. Listing no longer requires KYC up front (reverting the hard block from
--    20260729110000 for listings only — booking still requires it). Anyone
--    with an owner role can create a listing; it simply doesn't go live.
--
-- 3. A listing is publicly visible only once BOTH are true: an admin has
--    approved it, and the owner's KYC is cleared. Admins and the owner
--    themselves always see their own listings regardless, so an owner can
--    watch their pending listing and an admin can review listings belonging
--    to owners whose KYC hasn't landed yet.

alter table public.cars add column if not exists approval_status text not null default 'pending';
alter table public.cars add column if not exists rejection_reason text;
alter table public.sale_cars add column if not exists approval_status text not null default 'pending';
alter table public.sale_cars add column if not exists rejection_reason text;

do $$ begin
  alter table public.cars add constraint cars_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.sale_cars add constraint sale_cars_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected'));
exception when duplicate_object then null; end $$;

-- Everything that already existed was live under the old rules — keep it
-- live rather than yanking the whole catalogue into review.
update public.cars set approval_status = 'approved' where approval_status = 'pending';
update public.sale_cars set approval_status = 'approved' where approval_status = 'pending';

-- Public visibility: approved by an admin AND the owner is KYC-cleared AND
-- the owner's subscription is current. Owner and admin bypass all three so
-- pending/rejected listings stay reviewable and editable.
drop policy if exists "cars_select_visible" on public.cars;
create policy "cars_select_visible" on public.cars for select
  using (
    public.is_admin()
    or owner_id = auth.uid()
    or (
      approval_status = 'approved'
      and public.kyc_cleared(owner_id)
      and public.owner_subscription_active(owner_id)
    )
  );

drop policy if exists "sale_cars_select_visible" on public.sale_cars;
create policy "sale_cars_select_visible" on public.sale_cars for select
  using (
    public.is_admin()
    or dealer_id = auth.uid()
    or (
      approval_status = 'approved'
      and public.kyc_cleared(dealer_id)
      and public.owner_subscription_active(dealer_id)
    )
  );

-- kyc_cleared() returns false for a null owner (admin/catalog inventory has
-- no owner_id), so seeded listings would vanish. Treat a null owner and an
-- admin owner as cleared, matching owner_subscription_active's own carve-out.
create or replace function public.kyc_cleared(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user_id is null or coalesce((
    select verification_status = 'approved' or kyc_exempt or role = 'admin'
    from public.profiles where id = p_user_id
  ), false);
$$;

-- Insert: either owner role may list either kind of vehicle, and KYC is no
-- longer a precondition (the approval + kyc_cleared visibility rule above is
-- what actually keeps an unverified owner's listing off the marketplace).
drop policy if exists "cars_insert_owner" on public.cars;
create policy "cars_insert_owner" on public.cars for insert
  with check (
    public.is_admin() or (
      owner_id = auth.uid()
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('fleet_owner', 'dealership')
      )
    )
  );

drop policy if exists "sale_cars_insert_owner" on public.sale_cars;
create policy "sale_cars_insert_owner" on public.sale_cars for insert
  with check (
    public.is_admin() or (
      dealer_id = auth.uid()
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('fleet_owner', 'dealership')
      )
    )
  );

-- An owner editing a listing sends it back for review, so an approved
-- listing can't be quietly swapped for different content after the fact.
create or replace function public.reset_listing_approval()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;
  end if;
  -- Only content changes re-trigger review; availability/sold/featured
  -- toggles and view counters shouldn't bounce a live listing.
  if (new.brand, new.model, new.year, new.image, new.images, new.description)
     is distinct from (old.brand, old.model, old.year, old.image, old.images, old.description) then
    new.approval_status := 'pending';
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists cars_reset_approval on public.cars;
create trigger cars_reset_approval before update on public.cars
  for each row execute function public.reset_listing_approval();

drop trigger if exists sale_cars_reset_approval on public.sale_cars;
create trigger sale_cars_reset_approval before update on public.sale_cars
  for each row execute function public.reset_listing_approval();

-- Admin review action for both listing kinds.
create or replace function public.admin_review_listing(
  p_target_type text,
  p_target_id uuid,
  p_decision text,
  p_reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_label text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;
  if p_target_type not in ('car', 'sale_car') then
    raise exception 'target_type must be car or sale_car';
  end if;

  if p_target_type = 'car' then
    update public.cars
    set approval_status = p_decision,
        rejection_reason = case when p_decision = 'rejected' then p_reason else null end
    where id = p_target_id
    returning owner_id, brand || ' ' || model into v_owner, v_label;
  else
    update public.sale_cars
    set approval_status = p_decision,
        rejection_reason = case when p_decision = 'rejected' then p_reason else null end
    where id = p_target_id
    returning dealer_id, brand || ' ' || model into v_owner, v_label;
  end if;

  if v_owner is null then
    return;
  end if;

  if p_decision = 'approved' then
    perform public.notify_user(
      v_owner, 'system', 'Listing Approved',
      coalesce(v_label, 'Your listing') || ' has been approved'
        || (case when public.kyc_cleared(v_owner) then ' and is now live.'
                 else '. It goes live once your identity verification is complete.' end),
      null, null
    );
  else
    perform public.notify_user(
      v_owner, 'system', 'Listing Needs Changes',
      coalesce(v_label, 'Your listing') || ' was not approved'
        || (case when p_reason is not null then ': ' || p_reason else '.' end),
      null, null
    );
  end if;
end;
$$;

grant execute on function public.admin_review_listing(text, uuid, text, text) to authenticated;
