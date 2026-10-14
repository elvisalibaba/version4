alter table public.books
  add column if not exists subtitle text,
  add column if not exists co_authors text[] not null default '{}',
  add column if not exists isbn text,
  add column if not exists language text not null default 'fr',
  add column if not exists publisher text,
  add column if not exists publication_date date,
  add column if not exists page_count integer,
  add column if not exists categories text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists age_rating text,
  add column if not exists edition text,
  add column if not exists series_name text,
  add column if not exists series_position integer,
  add column if not exists file_format text,
  add column if not exists file_size integer,
  add column if not exists sample_url text,
  add column if not exists sample_pages integer,
  add column if not exists cover_thumbnail_url text,
  add column if not exists cover_alt_text text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists published_at timestamptz,
  add column if not exists views_count integer not null default 0,
  add column if not exists purchases_count integer not null default 0,
  add column if not exists rating_avg numeric(2,1),
  add column if not exists ratings_count integer not null default 0;

alter table public.books
  alter column status drop default;

alter table public.books
  alter column status type text;

alter table public.books
  alter column status set default 'draft';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'books_status_check'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
end $$;

create unique index if not exists books_isbn_unique_idx
  on public.books (isbn)
  where isbn is not null;

create table if not exists public.book_formats (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references public.books(id) on delete cascade,
  format text not null check (format in ('ebook', 'paperback', 'hardcover', 'audiobook')),
  price numeric(10,2) not null check (price >= 0),
  file_url text,
  stock_quantity integer,
  file_size_mb integer,
  downloadable boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(book_id, format)
);

create index if not exists book_formats_book_id_idx on public.book_formats(book_id);
create index if not exists book_formats_book_published_idx on public.book_formats(book_id, is_published);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at
before update on public.books
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_book_formats_updated_at on public.book_formats;
create trigger trg_book_formats_updated_at
before update on public.book_formats
for each row execute procedure public.set_updated_at();

alter table public.book_formats enable row level security;

create policy "Anyone can view published formats"
on public.book_formats
for select
using (
  is_published = true
  and exists (
    select 1 from public.books b
    where b.id = book_id and b.status = 'published'
  )
);

create policy "Authors can view own formats"
on public.book_formats
for select
using (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.author_id = auth.uid()
  )
);

create policy "Authors can insert own formats"
on public.book_formats
for insert
with check (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.author_id = auth.uid()
  )
);

create policy "Authors can update own formats"
on public.book_formats
for update
using (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.author_id = auth.uid()
  )
);

create policy "Authors can delete own formats"
on public.book_formats
for delete
using (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.author_id = auth.uid()
  )
);

create policy "Admin full formats access"
on public.book_formats
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Purchased users can read format ebook files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'books'
  and exists (
    select 1
    from public.library l
    join public.book_formats bf on bf.book_id = l.book_id
    where l.user_id = auth.uid()
      and bf.format = 'ebook'
      and bf.file_url = name
  )
);
