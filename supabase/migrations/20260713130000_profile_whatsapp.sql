-- Lets any user store a WhatsApp number alongside their regular phone
-- number on their own profile (self-service via Edit Profile).
alter table public.profiles add column whatsapp text;

-- Re-grant the full self-service column list (not just the new column) —
-- PostgREST's update compiles a SET clause over every column in the payload,
-- so a narrower grant here would recreate the same "permission denied"
-- pattern already hit on kyc_documents.
grant update (name, phone, avatar, whatsapp) on public.profiles to authenticated;
