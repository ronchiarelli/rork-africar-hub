-- Allow users to upload their own KYC documents (insert/update), but never
-- self-approve: the with-check clause forces status to stay 'uploaded' on
-- any client-driven insert/update, regardless of which columns they touch.
-- Only an admin (via a future SECURITY DEFINER RPC bypassing RLS) can move
-- a document to 'verified'/'rejected'.

grant insert, update (label, status, storage_path, uploaded_at) on public.kyc_documents to authenticated;

create policy "kyc_insert_own" on public.kyc_documents for insert
  with check (user_id = auth.uid() and status = 'uploaded');

create policy "kyc_update_own" on public.kyc_documents for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'uploaded');
