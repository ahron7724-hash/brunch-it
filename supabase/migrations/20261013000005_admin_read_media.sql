-- Admins need to read storage objects in order to delete them (storage.remove looks them up first).
create policy "admin read media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
