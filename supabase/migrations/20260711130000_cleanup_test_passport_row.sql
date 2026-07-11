-- One-off cleanup: removes a test "passport" KYC document row created
-- while verifying the portrait crop-frame fix (a synthetic test image was
-- uploaded to confirm the fix worked) against the sales@chiarelliconsult.com
-- test account. That account's other KYC uploads (Ghana Card front/back,
-- Driver's License, etc.) are genuine and untouched — this targets only
-- the passport/single row. Guarded so it errors out instead of silently
-- no-op'ing or matching the wrong account if the email doesn't match.
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
  where user_id = v_user_id and type = 'passport' and side = 'single';
  get diagnostics v_deleted = row_count;

  raise notice 'Deleted % passport row(s) for %', v_deleted, v_user_id;
end $$;
