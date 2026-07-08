-- Storage buckets for car listing photos (public, since browsed by anyone)
-- and KYC documents (private, owner + admin only).

insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

-- car-images: public read; write scoped to the car's owner via the leading
-- path segment convention {owner_id}/{car_id}/{n}.jpg.
create policy "car_images_select_public" on storage.objects for select
  using (bucket_id = 'car-images');

create policy "car_images_insert_owner" on storage.objects for insert
  with check (bucket_id = 'car-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "car_images_update_owner" on storage.objects for update
  using (bucket_id = 'car-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "car_images_delete_owner" on storage.objects for delete
  using (bucket_id = 'car-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- kyc-documents: private, path convention {user_id}/{doc_type}.jpg; owner
-- and admin only.
create policy "kyc_documents_select_own_or_admin" on storage.objects for select
  using (
    bucket_id = 'kyc-documents' and (
      (storage.foldername(name))[1] = auth.uid()::text or public.is_admin()
    )
  );

create policy "kyc_documents_insert_own" on storage.objects for insert
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "kyc_documents_update_own" on storage.objects for update
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
