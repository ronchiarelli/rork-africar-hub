-- One-time backfill: the sync trigger added in
-- 20260713170000_sync_listings_from_profile.sql only refreshes
-- cars/sale_cars denormalized owner/dealer info on a future profile
-- update — it did nothing for rows that were already stale at the time it
-- was added. Bring every listing with a real owner/dealer in line with
-- their current profile right now. Catalog/seed listings (owner_id/
-- dealer_id null) are untouched — they have no profile to sync from.
update public.cars c
set owner_name = p.name,
    owner_phone = p.phone
from public.profiles p
where c.owner_id = p.id
  and (c.owner_name is distinct from p.name or c.owner_phone is distinct from p.phone);

update public.sale_cars sc
set dealer_name = p.name,
    dealer_phone = p.phone,
    dealer_avatar = p.avatar
from public.profiles p
where sc.dealer_id = p.id
  and (
    sc.dealer_name is distinct from p.name
    or sc.dealer_phone is distinct from p.phone
    or sc.dealer_avatar is distinct from p.avatar
  );
