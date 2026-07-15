-- Security Advisor flagged public.temp_doc as publicly readable/writable
-- (no RLS at all). It isn't referenced by any app code or prior migration
-- and is empty — likely a leftover ad-hoc table created outside this
-- schema's tracked history. Locking it down rather than dropping it,
-- since it's not ours to assume is disposable; no policies means only
-- service_role/admin can touch it going forward.
alter table public.temp_doc enable row level security;
