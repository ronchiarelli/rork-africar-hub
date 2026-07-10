-- Ghana Card and Passport are now an interchangeable "Identity Document"
-- group in the UI (upload either one, not both) instead of two separate
-- hard requirements — so full verification is: (ghana_card OR passport)
-- verified, AND drivers_license verified, AND selfie verified. Previously
-- this required all 4 individual documents verified, which meant a user
-- who only had a passport (no Ghana Card) could never complete KYC.
create or replace function public.admin_review_kyc(
  p_doc_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_doc public.kyc_documents%rowtype;
  v_has_identity boolean;
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
  else
    select exists (
      select 1 from public.kyc_documents
      where user_id = v_doc.user_id and type in ('ghana_card', 'passport') and status = 'verified'
    ) into v_has_identity;
    select exists (
      select 1 from public.kyc_documents
      where user_id = v_doc.user_id and type = 'drivers_license' and status = 'verified'
    ) into v_has_license;
    select exists (
      select 1 from public.kyc_documents
      where user_id = v_doc.user_id and type = 'selfie' and status = 'verified'
    ) into v_has_selfie;

    if v_has_identity and v_has_license and v_has_selfie then
      update public.profiles set verification_status = 'approved', is_verified = true where id = v_doc.user_id;
    else
      update public.profiles set verification_status = 'pending' where id = v_doc.user_id;
    end if;
  end if;
end;
$$;
