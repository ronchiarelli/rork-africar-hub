-- Fixes "permission denied for table kyc_documents" on every KYC upload
-- (confirmed via a live error). useUploadKycDocument() upserts on conflict
-- (user_id, type) — PostgREST always issues this as a single
-- INSERT ... ON CONFLICT (user_id, type) DO UPDATE SET user_id=excluded...,
-- type=excluded..., label=..., status=..., storage_path=..., uploaded_at=...
-- statement regardless of whether a row actually exists yet, so Postgres
-- checks UPDATE privilege on every column in that SET clause up front —
-- including user_id/type, which the previous grant omitted. That made the
-- upsert fail even on a brand-new document with no prior row.
grant update (user_id, type, label, status, storage_path, uploaded_at) on public.kyc_documents to authenticated;
