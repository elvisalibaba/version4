drop policy if exists "Anyone can read book covers" on storage.objects;

create policy "Anyone can read book covers"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'books'
  and (storage.foldername(name))[1] = 'covers'
);
