-- Second cleanup of the same kind as 20260711130000: a test "Ghana Card —
-- Front" document (a synthetic gradient image, confirmed via its storage
-- path containing a stray blob: URL fragment from the file-extension bug
-- fixed alongside this migration) was uploaded to sales@chiarelliconsult.com
-- while verifying the KYC upload permission fix, and had even been marked
-- 'verified'. Removing it so a real front-of-card photo is required before
-- this account can actually complete identity verification.
do $$
declare
  v_user_id uuid;
  v_deleted int;
begin
  select id into v_user_id from public.profiles where email = 'sales@chiarelliconsult.com';
  if v_user_id is null then
    raise exception 'sales@chiarelliconsult.com not found — aborting cleanup';
  end if;

  delete from public.kyc_documents
  where user_id = v_user_id and type = 'ghana_card' and side = 'front';
  get diagnostics v_deleted = row_count;

  raise notice 'Deleted % ghana_card/front row(s) for %', v_deleted, v_user_id;

  -- That account's verification_status was likely 'pending' (not yet fully
  -- approved, since license/selfie were still awaiting review) rather than
  -- 'approved', so removing this row shouldn't have already granted booking/
  -- listing access based on a fake document — but re-run the same identity/
  -- license/selfie completion check admin_review_kyc uses, defensively, in
  -- case it had somehow reached 'approved'.
  if exists (select 1 from public.profiles where id = v_user_id and verification_status = 'approved') then
    update public.profiles set verification_status = 'pending' where id = v_user_id;
    raise notice 'Reset verification_status to pending for % (was approved on incomplete/fake documents)', v_user_id;
  end if;
end $$;
