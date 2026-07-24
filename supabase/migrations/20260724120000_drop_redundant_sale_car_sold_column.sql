-- Correcting course from the previous migration: dealer_listings.status
-- already has an 'active'/'sold'/'draft' enum with existing UI support
-- (LISTING_STATUS badge config in dealer-dashboard.tsx) — sale_cars.is_sold
-- would have been a second, redundant source of truth for the same concept.
alter table public.sale_cars drop column if exists is_sold;
