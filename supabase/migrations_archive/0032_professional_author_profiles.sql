alter table public.author_profiles
  add column if not exists favorite_book text,
  add column if not exists favorite_author text,
  add column if not exists favorite_character text,
  add column if not exists press_mentions jsonb not null default '[]'::jsonb;

alter table public.author_profiles
  drop constraint if exists author_profiles_press_mentions_array;

alter table public.author_profiles
  add constraint author_profiles_press_mentions_array
  check (jsonb_typeof(press_mentions) = 'array');

drop policy if exists "Anyone can read author portraits" on storage.objects;
create policy "Anyone can read author portraits"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'books'
  and (storage.foldername(name))[1] = 'author-avatars'
);

drop policy if exists "Authors can upload own portrait" on storage.objects;
create policy "Authors can upload own portrait"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'books'
  and (storage.foldername(name))[1] = 'author-avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Authors can update own portrait" on storage.objects;
create policy "Authors can update own portrait"
on storage.objects for update
to authenticated
using (
  bucket_id = 'books'
  and (storage.foldername(name))[1] = 'author-avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'books'
  and (storage.foldername(name))[1] = 'author-avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

comment on column public.author_profiles.press_mentions is
  'Liste JSON publique de références presse, sous la forme [{"title":"...","url":"..."}].';
