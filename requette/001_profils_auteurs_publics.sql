-- Profils auteurs publics Holistique Books
-- A executer seulement si votre base n'a pas encore la lecture publique des profils auteurs.

alter table public.author_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'author_profiles'
      and policyname = 'Anyone can view author profiles'
  ) then
    create policy "Anyone can view author profiles"
    on public.author_profiles
    for select
    using (true);
  end if;
end $$;

create index if not exists idx_author_profiles_display_name
on public.author_profiles (display_name);

create index if not exists idx_books_author_id_status
on public.books (author_id, status);
