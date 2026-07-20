-- leads_insert_open predates the customer_id column (added later in
-- 20260709220000_chat.sql) and was never tightened afterward — it still
-- allows any caller (including anon) to insert a lead row with an
-- arbitrary customer_id, impersonating any other user as a lead
-- requester. The app always sends customer_id: currentUser.id (see
-- marketplace.tsx / useCreateLead), so this was never needed by real
-- usage and only left a spoofing/spam gap open.
drop policy "leads_insert_open" on public.leads;
create policy "leads_insert_own" on public.leads for insert
  with check (customer_id = auth.uid());
