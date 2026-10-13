create table if not exists public.author_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  website text,
  location text,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists author_profiles_display_name_idx
  on public.author_profiles (display_name);

insert into public.author_profiles (id, display_name)
select p.id, coalesce(nullif(p.name, ''), 'Auteur inconnu')
from public.profiles p
left join public.author_profiles ap on ap.id = p.id
where ap.id is null
  and (
    p.role in ('author', 'admin')
    or exists (
      select 1
      from public.books b
      where b.author_id = p.id
    )
  );

create or replace function public.ensure_author_profile()
returns trigger
language plpgsql
as $$
begin
  if new.role in ('author', 'admin') then
    insert into public.author_profiles (id, display_name)
    values (new.id, coalesce(nullif(new.name, ''), 'Auteur inconnu'))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_ensure_author_profile on public.profiles;
create trigger trg_profiles_ensure_author_profile
after insert or update of role, name on public.profiles
for each row execute procedure public.ensure_author_profile();

drop trigger if exists trg_author_profiles_updated_at on public.author_profiles;
create trigger trg_author_profiles_updated_at
before update on public.author_profiles
for each row execute procedure public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'books_author_profile_id_fkey'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_author_profile_id_fkey
      foreign key (author_id) references public.author_profiles(id);
  end if;
end $$;

alter table public.author_profiles enable row level security;

create policy "Anyone can view author profiles"
on public.author_profiles
for select
using (true);

create policy "Authors can insert own author profile"
on public.author_profiles
for insert
with check (
  auth.uid() = id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('author', 'admin')
  )
);

create policy "Authors can update own author profile"
on public.author_profiles
for update
using (
  auth.uid() = id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('author', 'admin')
  )
)
with check (
  auth.uid() = id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('author', 'admin')
  )
);

create policy "Admin full author profiles access"
on public.author_profiles
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());
