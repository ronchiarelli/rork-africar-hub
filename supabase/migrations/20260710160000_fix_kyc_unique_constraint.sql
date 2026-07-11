-- Fixes "no unique or exclusion constraint matching the ON CONFLICT
-- specification" on every KYC upload (confirmed via a live error). The
-- prior migration guessed the original unique(user_id, type) constraint's
-- auto-generated name to drop it before adding the new (user_id, type,
-- side) one — that guess apparently didn't match, so drop_constraint was a
-- silent no-op (IF EXISTS) and the 3-column constraint the upsert relies on
-- was never actually created. Drop every unique constraint on the table
-- dynamically (no name-guessing) and recreate exactly what's needed.
do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.kyc_documents'::regclass and contype = 'u'
  loop
    execute format('alter table public.kyc_documents drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.kyc_documents add constraint kyc_documents_user_id_type_side_key unique (user_id, type, side);
