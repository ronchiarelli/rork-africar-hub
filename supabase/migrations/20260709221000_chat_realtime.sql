-- Enables Supabase Realtime (postgres_changes) for the chat tables so the
-- open thread and the inbox list can update live instead of relying on
-- polling. RLS still applies to what a given client actually receives.
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.conversations;
