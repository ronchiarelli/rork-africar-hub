-- Brand logos were hotlinked directly from carlogos.org (a third-party site
-- with no uptime guarantee) — it already 404'd on 3 logos once before (see
-- 20260709210000_fix_broken_brand_logos.sql) and has since started
-- intermittently refusing/resetting connections on the rest, making them
-- disappear again. Re-hosting in our own Storage bucket removes that
-- external dependency for good; the brands.logo column is repointed to the
-- new public URLs in a follow-up step once the files are uploaded.

insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true)
on conflict (id) do nothing;

create policy "brand_logos_select_public" on storage.objects for select
  using (bucket_id = 'brand-logos');

create policy "brand_logos_insert_admin" on storage.objects for insert
  with check (bucket_id = 'brand-logos' and public.is_admin());

create policy "brand_logos_update_admin" on storage.objects for update
  using (bucket_id = 'brand-logos' and public.is_admin());

create policy "brand_logos_delete_admin" on storage.objects for delete
  using (bucket_id = 'brand-logos' and public.is_admin());
