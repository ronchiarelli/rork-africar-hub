-- Clears a malformed avatar URL accidentally created on the QA test account
-- while verifying the edit-profile Save flow: the avatar upload path was
-- built from `uri.split('.').pop()`, which produced garbage for a blob: URL
-- (no literal dot), storing "avatar-<ts>.blob:http://localhost:8082/<uuid>"
-- as the file extension. Fixed going forward in edit-profile.tsx via the
-- shared extensionFromBlob() helper (lib/imageUpload.ts) — this just clears
-- the one bad value already written.
do $$
declare
  v_user_id uuid;
  v_updated int;
begin
  select id into v_user_id from public.profiles where email = 'sales@chiarelliconsult.com';
  if v_user_id is null then
    raise exception 'sales@chiarelliconsult.com not found — aborting cleanup';
  end if;

  update public.profiles
  set avatar = null
  where id = v_user_id and avatar like '%blob:%';
  get diagnostics v_updated = row_count;

  raise notice 'Cleared % malformed avatar value(s) for %', v_updated, v_user_id;
end $$;
