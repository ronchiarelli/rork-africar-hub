-- Every banner so far has been the "template" layout (tag/title/subtitle
-- text overlaid next to a cropped side image). Admins want a second
-- option: upload a single, fully-designed graphic (made in Canva/Figma/
-- etc.) that fills the entire banner placeholder edge-to-edge, with no
-- text overlay rendered on top — the design already contains all of
-- that. The one thing still required in that mode is the CTA (label +
-- destination), since we still need to know what happens when it's
-- tapped.
alter table public.promo_banners add column if not exists layout text not null default 'template';
alter table public.promo_banners add constraint promo_banners_layout_check check (layout in ('template', 'full_image'));
