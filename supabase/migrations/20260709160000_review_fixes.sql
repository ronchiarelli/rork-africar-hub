-- Fixes from the post-implementation review of the KYC gate, banners, and
-- admin expansion work.

-- 1. CRITICAL: uploading a KYC document never moved profiles.verification_status
--    out of 'none', so the mandatory KYC gate blocked every real user forever
--    (create_booking / cars & sale_cars insert all require 'pending' or
--    'approved'). Submission alone should unblock, per the original gate's
--    intent — admin review only refines pending -> approved/rejected later.
--    This trigger promotes 'none' or 'rejected' (re-submission after a
--    rejection) to 'pending' whenever a document is uploaded. It never fires
--    on admin_review_kyc's own updates, since those set status to 'verified'
--    or 'rejected', not 'uploaded'.
create or replace function public.sync_kyc_pending_on_upload()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'uploaded' then
    update public.profiles
    set verification_status = 'pending'
    where id = new.user_id and verification_status in ('none', 'rejected');
  end if;
  return new;
end;
$$;

create trigger kyc_documents_sync_pending
  after insert or update on public.kyc_documents
  for each row execute function public.sync_kyc_pending_on_upload();

-- 2. admin_review_kyc's rejected branch flipped verification_status but left
--    is_verified stranded at true if the user had been fully approved before
--    (e.g. an admin later revokes one previously-verified document).
create or replace function public.admin_review_kyc(
  p_doc_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_doc public.kyc_documents%rowtype;
  v_total int;
  v_verified int;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review KYC documents';
  end if;
  if p_decision not in ('verified', 'rejected') then
    raise exception 'decision must be verified or rejected';
  end if;

  select * into v_doc from public.kyc_documents where id = p_doc_id;
  if not found then
    raise exception 'Document not found';
  end if;

  update public.kyc_documents
  set status = p_decision::public.kyc_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = case when p_decision = 'rejected' then p_rejection_reason else null end
  where id = p_doc_id;

  if p_decision = 'rejected' then
    update public.profiles set verification_status = 'rejected', is_verified = false where id = v_doc.user_id;
  else
    select count(*) into v_total from public.kyc_documents where user_id = v_doc.user_id;
    select count(*) into v_verified from public.kyc_documents where user_id = v_doc.user_id and status = 'verified';
    if v_total >= 4 and v_verified >= 4 then
      update public.profiles set verification_status = 'approved', is_verified = true where id = v_doc.user_id;
    else
      update public.profiles set verification_status = 'pending' where id = v_doc.user_id;
    end if;
  end if;
end;
$$;

-- 3. Registration's role-application submission ran as a separate client-side
--    insert AFTER login, which (a) never ran at all if email confirmation was
--    required, since the flow returned before reaching it, and (b) silently
--    swallowed insert failures. Moving it into handle_new_user() makes it
--    atomic with account creation itself, server-side, regardless of the
--    client's post-signup flow or session state.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_requested_role text;
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    'customer'
  );
  insert into public.wallets (user_id) values (new.id);

  v_requested_role := new.raw_user_meta_data->>'requested_role';
  if v_requested_role in ('fleet_owner', 'dealership') then
    insert into public.role_applications (user_id, requested_role)
    values (new.id, v_requested_role::public.user_role);
  end if;

  return new;
end;
$$;

-- 4. admin_revoke_role only changed the profile's role; the demoted user's
--    existing cars/sale_cars stayed publicly visible and bookable as long as
--    their subscription was still active. Cancelling the subscription reuses
--    the existing owner_subscription_active() visibility gate instead of
--    adding a second, parallel "is this owner still allowed" check.
create or replace function public.admin_revoke_role(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can revoke roles';
  end if;
  update public.profiles set role = 'customer' where id = p_user_id and role in ('fleet_owner', 'dealership');
  update public.subscriptions set status = 'cancelled', updated_at = now() where user_id = p_user_id;
end;
$$;

-- 5. admin_set_subscription_status('active') didn't touch current_period_end,
--    so "Reactivate" on a subscription that lapsed long ago left it still
--    failing owner_subscription_active()'s current_period_end >= now() check.
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
  set status = p_status::public.subscription_status,
      current_period_end = case when p_status = 'active' then greatest(current_period_end, now()) + interval '30 days' else current_period_end end,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

-- 6. admin_extend_subscription anchored on coalesce(current_period_end, now()),
--    which only falls back to now() when the column is null — a long-lapsed
--    (but non-null) date just got N days added to itself and stayed in the
--    past. greatest() correctly resets the anchor to now() whenever the
--    existing period has already ended.
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
  set current_period_end = greatest(current_period_end, now()) + make_interval(days => p_days),
      trial_ends_at = case when status = 'trialing' then greatest(trial_ends_at, now()) + make_interval(days => p_days) else trial_ends_at end,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;
