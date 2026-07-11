-- End-to-end KYC review fixes.
--
-- 1. A re-upload after rejection now clears rejection_reason (previously
--    the old note stayed visible under a fresh "Under Review" submission,
--    misleading admins into thinking it was already reviewed/rejected
--    again). Extend the UPDATE grant to cover the full upsert column set
--    once more, including this new one — the same class of bug as the
--    prior two fixes (Postgres checks column-level UPDATE privilege on
--    every column in an upsert's DO UPDATE SET clause up front, regardless
--    of whether that row already exists).
grant update (user_id, type, side, label, status, storage_path, uploaded_at, rejection_reason)
  on public.kyc_documents to authenticated;
