-- Car/sale_car "location" has so far just been one of ten hardcoded city/
-- area labels (constants/locations.ts) with no real address or coordinates
-- behind it. Add an optional precise address + lat/lng captured via Google
-- Places Autocomplete, so listings can carry a real pickup/viewing address
-- and (later) be sorted by actual distance instead of a shared area label.
-- Nullable and additive: existing listings keep working with just their
-- current city label until an owner edits them and picks a real address.
alter table public.cars add column if not exists address text;
alter table public.cars add column if not exists latitude double precision;
alter table public.cars add column if not exists longitude double precision;

alter table public.sale_cars add column if not exists address text;
alter table public.sale_cars add column if not exists latitude double precision;
alter table public.sale_cars add column if not exists longitude double precision;
