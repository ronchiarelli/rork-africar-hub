-- Lets admins reposition where a banner image is cropped/focused within its
-- fixed display frame (expo-image's contentPosition is a percentage along
-- each axis, matching CSS object-position semantics: 50/50 is centered,
-- matching prior behavior for every existing banner).
alter table public.promo_banners add column if not exists focal_x numeric not null default 50;
alter table public.promo_banners add column if not exists focal_y numeric not null default 50;
alter table public.promo_banners add constraint promo_banners_focal_x_range check (focal_x >= 0 and focal_x <= 100);
alter table public.promo_banners add constraint promo_banners_focal_y_range check (focal_y >= 0 and focal_y <= 100);
