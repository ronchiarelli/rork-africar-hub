-- Relax full verification further: a verified Ghana Card, Passport, or
-- Driver's License is now each independently sufficient to fully verify a
-- user — no longer requiring all three (or a selfie) together. The
-- 'restricted' tier from the previous migration is superseded by this (any
-- one of these three now grants full 'approved' directly) but the enum
-- value stays in place for schema stability; it's simply not produced by
-- this function going forward.
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
    select 1 from public.kyc_documents where user_id = v_doc.user_id and status = 'rejected'
  ) into v_has_rejected;

  if v_has_ghana_card or v_has_passport or v_has_license then
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
      v_doc.user_id, 'kyc', 'Verification Approved',
      'Your identity verification is complete. You can now book or list vehicles.',
      null, null
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

-- One-time backfill: recompute every existing profile under the relaxed
-- rule, so anyone previously stuck at 'restricted' or 'pending' with a
-- single verified ID/license document is upgraded to full 'approved' now.
do $$
declare
  v_user record;
  v_has_ghana_card boolean;
  v_has_passport boolean;
  v_has_license boolean;
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
      select 1 from public.kyc_documents where user_id = v_user.id and status = 'rejected'
    ) into v_has_rejected;

    if v_has_ghana_card or v_has_passport or v_has_license then
      v_new_status := 'approved';
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
