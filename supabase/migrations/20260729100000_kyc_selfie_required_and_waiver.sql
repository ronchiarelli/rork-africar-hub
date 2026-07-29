-- Two KYC changes:
--
-- 1. Full verification now requires an identity document AND a selfie.
--    Previously any ONE of Ghana Card / Passport / Driver's License was
--    enough on its own and the selfie was collected but never required,
--    so nothing tied the document to the person holding the account. The
--    identity half stays an OR (any one of the three is fine); the selfie
--    is now an AND on top of it.
--
-- 2. Admins can waive KYC entirely for a specific user (profiles.kyc_exempt).
--    Some accounts are verified out-of-band (walk-in partners, staff, an
--    existing business relationship) and shouldn't be blocked waiting on
--    document review. A waived user transacts exactly like a fully verified
--    one without any documents on file.

alter table public.profiles add column if not exists kyc_exempt boolean not null default false;

-- Single source of truth for "this user may transact" — used by the booking
-- gate below and safe to call cross-user from RLS/other RPCs because it
-- returns only a boolean (same pattern as owner_subscription_active).
create or replace function public.kyc_cleared(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select verification_status = 'approved' or kyc_exempt
    from public.profiles where id = p_user_id
  ), false);
$$;

grant execute on function public.kyc_cleared(uuid) to authenticated;

-- Admin-only KYC waiver toggle. Mirrors admin_set_suspended /
-- admin_set_inapp_payment_enabled.
create or replace function public.admin_set_kyc_exempt(
  p_user_id uuid,
  p_exempt boolean
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.profiles set kyc_exempt = p_exempt where id = p_user_id;

  if p_exempt then
    perform public.notify_user(
      p_user_id, 'kyc', 'Verification Waived',
      'An administrator has verified your account manually. You can now book or list vehicles without uploading documents.',
      null, null
    );
  end if;
end;
$$;

grant execute on function public.admin_set_kyc_exempt(uuid, boolean) to authenticated;

-- Recompute rule: identity document AND selfie must both be verified.
create or replace function public.admin_review_kyc(
  p_doc_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_doc public.kyc_documents%rowtype;
  v_old_status public.verification_status;
  v_new_status public.verification_status;
  v_has_ghana_card boolean;
  v_has_passport boolean;
  v_has_license boolean;
  v_has_selfie boolean;
  v_has_identity boolean;
  v_has_rejected boolean;
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

  select verification_status into v_old_status from public.profiles where id = v_doc.user_id;

  update public.kyc_documents
  set status = p_decision::public.kyc_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = case when p_decision = 'rejected' then p_rejection_reason else null end
  where id = p_doc_id;

  select count(*) = 2 into v_has_ghana_card from public.kyc_documents
    where user_id = v_doc.user_id and type = 'ghana_card' and side in ('front', 'back') and status = 'verified';
  select exists (
    select 1 from public.kyc_documents
    where user_id = v_doc.user_id and type = 'passport' and status = 'verified'
  ) into v_has_passport;
  select count(*) = 2 into v_has_license from public.kyc_documents
    where user_id = v_doc.user_id and type = 'drivers_license' and side in ('front', 'back') and status = 'verified';
  select exists (
    select 1 from public.kyc_documents
    where user_id = v_doc.user_id and type = 'selfie' and status = 'verified'
  ) into v_has_selfie;
  select exists (
    select 1 from public.kyc_documents where user_id = v_doc.user_id and status = 'rejected'
  ) into v_has_rejected;

  v_has_identity := v_has_ghana_card or v_has_passport or v_has_license;

  if v_has_identity and v_has_selfie then
    v_new_status := 'approved';
  elsif v_has_rejected then
    v_new_status := 'rejected';
  else
    v_new_status := 'pending';
  end if;

  update public.profiles
  set verification_status = v_new_status, is_verified = (v_new_status = 'approved')
  where id = v_doc.user_id;

  if p_decision = 'rejected' then
    perform public.notify_user(
      v_doc.user_id, 'kyc', 'Verification Update',
      coalesce(v_doc.label, 'A document') || ' was not approved' || (case when p_rejection_reason is not null then ': ' || p_rejection_reason else '.' end),
      '/kyc-verification', null
    );
  end if;

  if v_new_status = 'approved' and v_old_status is distinct from 'approved' then
    perform public.notify_user(
      v_doc.user_id, 'kyc', 'Verification Complete',
      'Your identity is fully verified. You can now book or list vehicles.',
      null, null
    );
  elsif p_decision = 'verified' and v_new_status <> 'approved' then
    perform public.notify_user(
      v_doc.user_id, 'kyc', 'Document Verified',
      coalesce(v_doc.label, 'A document') || ' has been verified.'
        || (case when v_has_identity and not v_has_selfie then ' Add a selfie to finish verification.'
                 when v_has_selfie and not v_has_identity then ' Add an ID document to finish verification.'
                 else '' end),
      '/kyc-verification', null
    );
  end if;
end;
$$;

-- Booking approval gate now goes through kyc_cleared() so an admin-waived
-- user is treated exactly like a fully verified one. 'restricted' is no
-- longer accepted: that tier was already superseded (no code path produces
-- it) and letting it through would make the new selfie requirement
-- meaningless for booking.
create or replace function public.fleet_owner_review_booking(
  p_booking_id uuid,
  p_decision text
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
  v_is_owner boolean;
begin
  if p_decision not in ('approved', 'cancelled') then
    raise exception 'decision must be approved or cancelled';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking not found';
  end if;

  select exists (
    select 1 from public.cars c where c.id = v_booking.car_id and c.owner_id = auth.uid()
  ) into v_is_owner;

  if not (v_is_owner or public.is_admin()) then
    raise exception 'Not authorized to review this booking';
  end if;

  if v_booking.status != 'pending' then
    raise exception 'Only pending bookings can be reviewed';
  end if;

  if p_decision = 'approved' and not public.kyc_cleared(v_booking.customer_id) then
    raise exception 'This customer has not completed KYC verification yet';
  end if;

  update public.bookings set status = p_decision::public.booking_status
  where id = p_booking_id
  returning * into v_booking;

  perform public.notify_user(
    v_booking.customer_id,
    'booking',
    case when p_decision = 'approved' then 'Booking Approved' else 'Booking Declined' end,
    case when p_decision = 'approved'
      then 'Your booking request has been approved. The owner will share payment details with you directly.'
      else 'Your booking request was declined.'
    end,
    '/booking-detail',
    jsonb_build_object('id', v_booking.id)
  );

  return v_booking;
end;
$$;

-- Grandfather existing accounts: anyone already fully approved under the
-- old (identity-only) rule keeps their access via the waiver flag rather
-- than silently losing it the next time an admin touches one of their
-- documents and the stricter recompute runs. Admins can clear the flag
-- from the user detail screen once a selfie is on file.
update public.profiles p
set kyc_exempt = true
where p.verification_status = 'approved'
  and not p.kyc_exempt
  and not exists (
    select 1 from public.kyc_documents d
    where d.user_id = p.id and d.type = 'selfie' and d.status = 'verified'
  );
