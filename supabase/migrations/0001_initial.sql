create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'reader' check (role in ('reader', 'author', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  author_id uuid not null references public.profiles(id) on delete cascade,
  cover_url text,
  file_url text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_price numeric(10,2) not null check (total_price >= 0),
  payment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  price numeric(10,2) not null check (price >= 0)
);

create table if not exists public.library (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  unique(user_id, book_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data->>'name', ''), ''),
    coalesce(new.raw_user_meta_data->>'role', 'reader')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.library enable row level security;

create policy "Users can see own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Admin can view all profiles"
on public.profiles
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Anyone can view published books"
on public.books
for select
using (status = 'published');

create policy "Authors can view own books"
on public.books
for select
using (auth.uid() = author_id);

create policy "Authors can create books"
on public.books
for insert
with check (auth.uid() = author_id);

create policy "Authors can update own books"
on public.books
for update
using (auth.uid() = author_id);

create policy "Admin full books access"
on public.books
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

create policy "Reader sees own orders"
on public.orders
for select
using (auth.uid() = user_id);

create policy "Reader creates own orders"
on public.orders
for insert
with check (auth.uid() = user_id);

create policy "Admin sees all orders"
on public.orders
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Reader sees own order items"
on public.order_items
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "Reader inserts own order items"
on public.order_items
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "Author can view own sales items"
on public.order_items
for select
using (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.author_id = auth.uid()
  )
);

create policy "Admin sees all order items"
on public.order_items
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Reader sees own library"
on public.library
for select
using (auth.uid() = user_id);

create policy "Reader inserts own library items"
on public.library
for insert
with check (auth.uid() = user_id);

create policy "Admin sees all library rows"
on public.library
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do nothing;

create policy "Authors can upload covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'books'
  and (storage.foldername(name))[1] = 'covers'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('author', 'admin')
  )
);

create policy "Authors can upload files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'books'
  and (storage.foldername(name))[1] = 'files'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('author', 'admin')
  )
);

create policy "Authors can update own objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'books'
  and owner = auth.uid()
);

create policy "Purchased users can read ebook files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'books'
  and exists (
    select 1
    from public.library l
    join public.books b on b.id = l.book_id
    where l.user_id = auth.uid()
      and b.file_url = name
  )
);
