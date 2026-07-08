-- Fleet owners need a customer's name/phone to reach out about a booking
-- (e.g. via WhatsApp), but profiles_select only allowed a user to see their
-- own row (or admin). Add a narrow policy: an owner can see the profile of a
-- customer who has an actual booking on one of their cars — nothing broader.
create policy "profiles_select_booking_customer" on public.profiles for select
  using (
    exists (
      select 1 from public.bookings b
      join public.cars c on c.id = b.car_id
      where b.customer_id = profiles.id and c.owner_id = auth.uid()
    )
  );
