-- The front/back rewrite of admin_review_kyc (20260710150000) dropped the
-- notify_user() calls that existed in the prior version — confirmed by
-- diffing migration history, no notify_user call remains in the live
-- function. This silently broke the "kyc" notification bubble added later
-- (nothing populates a type='kyc' notification anymore), and users stopped
-- being told when a document was rejected or verification completed.
create or replace function public.admin_review_kyc(
  p_doc_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_doc public.kyc_documents%rowtype;
  v_has_ghana_card boolean;
  v_has_passport boolean;
  v_has_license boolean;
  v_has_selfie boolean;
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
    perform public.notify_user(
      v_doc.user_id, 'kyc', 'Verification Update',
      coalesce(v_doc.label, 'A document') || ' was not approved' || (case when p_rejection_reason is not null then ': ' || p_rejection_reason else '.' end),
      '/kyc-verification', null
    );
  else
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

    if (v_has_ghana_card or v_has_passport) and v_has_license and v_has_selfie then
      update public.profiles set verification_status = 'approved', is_verified = true where id = v_doc.user_id;
      perform public.notify_user(
        v_doc.user_id, 'kyc', 'Verification Approved',
        'Your identity verification is complete. You can now book or list vehicles.',
        null, null
      );
    else
      update public.profiles set verification_status = 'pending' where id = v_doc.user_id;
      perform public.notify_user(
        v_doc.user_id, 'kyc', 'Document Verified',
        coalesce(v_doc.label, 'A document') || ' has been verified.',
        '/kyc-verification', null
      );
    end if;
  end if;
end;
$$;
