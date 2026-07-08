-- Home-screen promo banner, editable by admins instead of hardcoded in the
-- client. Only one banner is typically shown (the home screen picks the
-- highest-priority active one), but the table supports several so an admin
-- can queue up the next promo before switching over.
create table public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  tag text not null,
  title text not null,
  subtitle text not null,
  image_url text not null,
  cta_label text not null,
  cta_route text not null,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.promo_banners enable row level security;

grant select on public.promo_banners to anon, authenticated;
grant insert, update, delete on public.promo_banners to authenticated;

create policy "promo_banners_select_visible" on public.promo_banners for select
  using (is_active or public.is_admin());

create policy "promo_banners_insert_admin" on public.promo_banners for insert
  with check (public.is_admin());

create policy "promo_banners_update_admin" on public.promo_banners for update
  using (public.is_admin());

create policy "promo_banners_delete_admin" on public.promo_banners for delete
  using (public.is_admin());

create trigger set_promo_banners_updated_at
  before update on public.promo_banners
  for each row execute function public.set_updated_at();

-- Seed with the banner that was previously hardcoded on the home screen, so
-- nothing changes visually until an admin edits it.
insert into public.promo_banners (tag, title, subtitle, image_url, cta_label, cta_route, is_active, display_order)
values (
  'WEEKEND SPECIAL',
  '20% Off SUV Rentals',
  'Book any SUV this weekend & save big',
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80',
  'Book Now',
  '/search',
  true,
  0
);

-- Storage bucket for banner images, admin-only write.
insert into storage.buckets (id, name, public)
values ('banner-images', 'banner-images', true)
on conflict (id) do nothing;

create policy "banner_images_select_public" on storage.objects for select
  using (bucket_id = 'banner-images');

create policy "banner_images_insert_admin" on storage.objects for insert
  with check (bucket_id = 'banner-images' and public.is_admin());

create policy "banner_images_update_admin" on storage.objects for update
  using (bucket_id = 'banner-images' and public.is_admin());

create policy "banner_images_delete_admin" on storage.objects for delete
  using (bucket_id = 'banner-images' and public.is_admin());
