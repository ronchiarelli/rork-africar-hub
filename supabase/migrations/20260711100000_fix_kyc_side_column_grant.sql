-- Fixes "permission denied for table kyc_documents" recurring on every
-- upload (confirmed live) — the `side` column was added in
-- 20260710150000_kyc_front_back.sql, but the UPDATE column grant from
-- 20260710140000_fix_kyc_upsert_permission.sql was never extended to
-- include it. The upsert's ON CONFLICT (user_id, type, side) DO UPDATE SET
-- ..., side = excluded.side needs UPDATE privilege on every column it sets,
-- same root cause as the original bug, just recurring for the newest column.
grant update (user_id, type, side, label, status, storage_path, uploaded_at) on public.kyc_documents to authenticated;
