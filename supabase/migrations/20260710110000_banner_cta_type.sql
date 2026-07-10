-- Banner CTAs were hardcoded to internal app routes. Let admins point a
-- banner's call-to-action at an external URL or a phone number too (e.g. a
-- promo landing page, or "Call Now" for a phone-based offer), not just
-- in-app navigation.
alter table public.promo_banners add column if not exists cta_type text not null default 'route';
alter table public.promo_banners add constraint promo_banners_cta_type_check check (cta_type in ('route', 'url', 'phone'));
