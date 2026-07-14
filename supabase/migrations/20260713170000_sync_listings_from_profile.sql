-- Fleet owners' and dealers' name/phone/avatar are denormalized onto their
-- car/sale_car listings (cars.owner_name/owner_phone,
-- sale_cars.dealer_name/dealer_phone/dealer_avatar) so customers can see
-- "Listed By" info without needing read access to another user's profiles
-- row. Previously nothing re-synced that copy after listing creation, so
-- editing a profile (Edit Profile screen) left every already-created
-- listing showing the old name/phone forever. Mirrors the existing
-- reviews_car_rating_trigger pattern already used in this schema for
-- keeping denormalized data current.
create or replace function public.sync_listings_from_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.cars
  set owner_name = new.name, owner_phone = new.phone
  where owner_id = new.id;

  update public.sale_cars
  set dealer_name = new.name, dealer_phone = new.phone, dealer_avatar = new.avatar
  where dealer_id = new.id;

  return new;
end;
$$;

create trigger trg_profile_update_sync_listings
  after update on public.profiles
  for each row
  when (
    old.name is distinct from new.name
    or old.phone is distinct from new.phone
    or old.avatar is distinct from new.avatar
  )
  execute function public.sync_listings_from_profile();

-- One-off backfill: sale_cars.dealer_avatar was never populated at
-- creation either (no write site set it), so existing dealer listings show
-- no avatar on the marketplace regardless of this trigger going forward.
update public.sale_cars sc
set dealer_avatar = p.avatar
from public.profiles p
where sc.dealer_id = p.id and sc.dealer_avatar is null and p.avatar is not null;
