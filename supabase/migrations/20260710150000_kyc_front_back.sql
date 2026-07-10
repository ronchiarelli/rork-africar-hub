-- Ghana Card and Driver's License are physical cards with data on both
-- sides — require front AND back uploads for each, instead of one photo.
-- Passport and Selfie stay single-image (a passport's photo page is
-- self-contained; a selfie has no "other side").
alter table public.kyc_documents add column if not exists side text not null default 'single';
alter table public.kyc_documents add constraint kyc_documents_side_check check (side in ('single', 'front', 'back'));

alter table public.kyc_documents drop constraint if exists kyc_documents_user_id_type_key;
alter table public.kyc_documents add constraint kyc_documents_user_id_type_side_key unique (user_id, type, side);

-- Full verification is now: (Ghana Card front+back verified) OR (Passport
-- verified), AND (Driver's License front+back verified), AND
-- (Selfie verified) — extends the earlier "either ID" grouping to also
-- require both sides of whichever card-type documents are used.
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
    else
      update public.profiles set verification_status = 'pending' where id = v_doc.user_id;
    end if;
  end if;
end;
$$;
