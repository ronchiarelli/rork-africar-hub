-- Owners could write ANY column on their own listing row, because the RLS
-- update policy scopes by ownership but the table-level UPDATE grant covers
-- every column. Two concrete abuses, both reproduced against production:
--
--   1. approval_status -> 'approved'  — self-approve, skipping admin review
--      entirely (the whole point of the review pipeline).
--   2. is_featured / is_home_featured -> true — grant themselves the
--      GH₵300/mo search and GH₵250/mo home placements for free, bypassing
--      Hubtel checkout.
--
-- Also lockable while we're here: views/rating/review_count (trust signals
-- an owner shouldn't be able to inflate) and owner_id/dealer_id (reassigning
-- a listing to someone else).
--
-- Fix is the pattern already used on profiles, where a column-level grant is
-- why `role` can't be self-escalated: drop the blanket UPDATE grant and
-- re-grant only the columns an owner legitimately edits. The privileged
-- columns stay writable by the SECURITY DEFINER RPCs (admin_review_listing,
-- admin_set_*_featured, complete_featured_payment) and by service_role,
-- which is how they're supposed to change.

revoke update on public.cars from authenticated;
grant update (
  brand, model, year, category, image, images,
  price_per_day, price_per_week,
  location, address, latitude, longitude,
  seats, transmission, fuel_type, horsepower, has_ac,
  description, features,
  owner_name, owner_phone,
  is_available
) on public.cars to authenticated;

revoke update on public.sale_cars from authenticated;
grant update (
  brand, model, year, category, image, images,
  sale_price, mileage,
  location, address, latitude, longitude,
  fuel_type, transmission, condition,
  description, features,
  dealer_name, dealer_phone, dealer_avatar,
  is_sold
) on public.sale_cars to authenticated;
