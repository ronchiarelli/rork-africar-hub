-- Bug found while testing chat: support conversations always showed "User"
-- as the counterpart's name instead of the support agent's actual name.
-- profiles_select only allows reading your own row (or admin reads anyone's)
-- — there was no policy letting a customer/fleet_owner/dealer read the
-- profile of the admin they're messaging, so counterpart:profiles!counterpart_id
-- always resolved to null for a non-admin viewer. Mirrors the existing
-- profiles_select_booking_customer pattern, scoped to actual conversation
-- participants (only exposes what's already implicit in an active chat).
create policy "profiles_select_conversation_participant" on public.profiles for select
  using (
    exists (
      select 1 from public.conversations c
      where (c.customer_id = auth.uid() and c.counterpart_id = profiles.id)
         or (c.counterpart_id = auth.uid() and c.customer_id = profiles.id)
    )
  );
