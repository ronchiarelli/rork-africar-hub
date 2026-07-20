-- Fix: rejecting a single KYC document (e.g. a blurry selfie) unconditionally
-- flipped the customer's whole profile to verification_status = 'rejected',
-- even when their Ghana Card/Passport was already verified — this is the
-- "KYC Rejected" badge fleet owners were seeing on customers who actually had
-- a verified ID, permanently blocking booking approval for them. The status
-- is now always recomputed from the full current state of the user's
-- documents instead of being set directly by this one decision, and a new
-- 'restricted' tier lets a renter with a verified ID (but no license/selfie
-- yet) proceed with booking while the rest of their KYC catches up.
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

  v_has_identity := v_has_ghana_card or v_has_passport;

  if v_has_identity and v_has_license and v_has_selfie then
    v_new_status := 'approved';
  elsif v_has_identity then
    v_new_status := 'restricted';
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
      v_doc.user_id, 'kyc', 'Verification Approved',
      'Your identity verification is complete. You can now book or list vehicles.',
      null, null
    );
  elsif v_new_status = 'restricted' and v_old_status not in ('restricted', 'approved') then
    perform public.notify_user(
      v_doc.user_id, 'kyc', 'ID Verified',
      'Your ID has been verified, so you can now book cars. Finish your driver''s license and selfie for full verification.',
      '/kyc-verification', null
    );
  elsif p_decision = 'verified' and v_new_status = 'pending' then
    perform public.notify_user(
      v_doc.user_id, 'kyc', 'Document Verified',
      coalesce(v_doc.label, 'A document') || ' has been verified.',
      '/kyc-verification', null
    );
  end if;
end;
$$;

-- Booking approval now also allows a 'restricted' customer (verified ID,
-- license/selfie still pending) through, not just fully 'approved' ones.
create or replace function public.fleet_owner_review_booking(
  p_booking_id uuid,
  p_decision text
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
  v_is_owner boolean;
  v_customer_kyc public.verification_status;
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

  if p_decision = 'approved' then
    select verification_status into v_customer_kyc from public.profiles where id = v_booking.customer_id;
    if v_customer_kyc not in ('approved', 'restricted') then
      raise exception 'This customer has not completed KYC verification yet';
    end if;
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

-- A fleet_owner/dealership with a verified ID (restricted) can list cars
-- just like a 'pending' one already could, consistent with the booking gate.
drop policy "cars_insert_owner" on public.cars;
create policy "cars_insert_owner" on public.cars for insert
  with check (
    public.is_admin() or (
      owner_id = auth.uid()
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'fleet_owner' and p.verification_status in ('pending', 'restricted', 'approved')
      )
    )
  );

drop policy "sale_cars_insert_owner" on public.sale_cars;
create policy "sale_cars_insert_owner" on public.sale_cars for insert
  with check (
    public.is_admin() or (
      dealer_id = auth.uid()
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'dealership' and p.verification_status in ('pending', 'restricted', 'approved')
      )
    )
  );

-- One-time backfill: recompute every existing profile's aggregate status
-- under the new rule, so customers already sitting at 'rejected' with a
-- verified ID (the exact bug this migration fixes) are unblocked immediately
-- rather than waiting for their next document review.
do $$
declare
  v_user record;
  v_has_ghana_card boolean;
  v_has_passport boolean;
  v_has_license boolean;
  v_has_selfie boolean;
  v_has_identity boolean;
  v_has_rejected boolean;
  v_new_status public.verification_status;
begin
  for v_user in select id, verification_status from public.profiles where verification_status <> 'none' loop
    select count(*) = 2 into v_has_ghana_card from public.kyc_documents
      where user_id = v_user.id and type = 'ghana_card' and side in ('front', 'back') and status = 'verified';
    select exists (
      select 1 from public.kyc_documents where user_id = v_user.id and type = 'passport' and status = 'verified'
    ) into v_has_passport;
    select count(*) = 2 into v_has_license from public.kyc_documents
      where user_id = v_user.id and type = 'drivers_license' and side in ('front', 'back') and status = 'verified';
    select exists (
      select 1 from public.kyc_documents where user_id = v_user.id and type = 'selfie' and status = 'verified'
    ) into v_has_selfie;
    select exists (
      select 1 from public.kyc_documents where user_id = v_user.id and status = 'rejected'
    ) into v_has_rejected;

    v_has_identity := v_has_ghana_card or v_has_passport;

    if v_has_identity and v_has_license and v_has_selfie then
      v_new_status := 'approved';
    elsif v_has_identity then
      v_new_status := 'restricted';
    elsif v_has_rejected then
      v_new_status := 'rejected';
    else
      v_new_status := 'pending';
    end if;

    if v_new_status is distinct from v_user.verification_status then
      update public.profiles
      set verification_status = v_new_status, is_verified = (v_new_status = 'approved')
      where id = v_user.id;
    end if;
  end loop;
end;
$$;
