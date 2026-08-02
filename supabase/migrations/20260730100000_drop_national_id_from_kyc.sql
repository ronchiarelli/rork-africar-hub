-- National ID (Ghana Card) is no longer an accepted KYC document — identity
-- is now Passport OR Driver's License, still plus a selfie.
--
-- The 'ghana_card' enum value stays in kyc_doc_type: historical
-- kyc_documents rows reference it and Postgres can't remove an enum value
-- that's in use. It is simply never offered by the app again, and no longer
-- counts towards verification below.

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
  -- A rejected ghana_card is legacy noise now that the document isn't
  -- accepted at all — it must not hold an otherwise-complete profile at
  -- 'rejected' forever.
  select exists (
    select 1 from public.kyc_documents
    where user_id = v_doc.user_id and status = 'rejected' and type <> 'ghana_card'
  ) into v_has_rejected;

  v_has_identity := v_has_passport or v_has_license;

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
                 when v_has_selfie and not v_has_identity then ' Add a Passport or Driver''s License to finish verification.'
                 else '' end),
      '/kyc-verification', null
    );
  end if;
end;
$$;

-- Anyone currently approved on the strength of a Ghana Card would silently
-- lose access the next time an admin touched one of their documents and the
-- recompute above ran without it. Grandfather them onto the existing waiver,
-- same approach used when the selfie requirement was introduced.
update public.profiles p
set kyc_exempt = true
where p.verification_status = 'approved'
  and not p.kyc_exempt
  and exists (
    select 1 from public.kyc_documents d
    where d.user_id = p.id and d.type = 'ghana_card' and d.status = 'verified'
  )
  and not exists (
    select 1 from public.kyc_documents d
    where d.user_id = p.id and d.status = 'verified'
      and (d.type = 'passport' or d.type = 'drivers_license')
  );

-- Stop offering the document: clear any Ghana Card rows that were never
-- actually submitted, so they don't linger as empty "Not Uploaded" slots.
delete from public.kyc_documents
where type = 'ghana_card' and status = 'not_uploaded';
