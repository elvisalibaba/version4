alter table public.books
  add column if not exists currency_code text not null default 'USD',
  add column if not exists is_single_sale_enabled boolean not null default true,
  add column if not exists is_subscription_available boolean not null default false;

alter table public.book_formats
  add column if not exists currency_code text not null default 'USD';

alter table public.orders
  add column if not exists currency_code text not null default 'USD';

alter table public.order_items
  add column if not exists currency_code text not null default 'USD';

create table if not exists public.subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  monthly_price numeric(10,2) not null check (monthly_price >= 0),
  currency_code text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plan_books (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (book_id, plan_id)
);

create table if not exists public.user_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null check (status in ('active', 'cancelled', 'expired', 'past_due')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.library
  add column if not exists access_type text default 'purchase',
  add column if not exists subscription_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'library_access_type_check'
      and conrelid = 'public.library'::regclass
  ) then
    alter table public.library
      add constraint library_access_type_check
      check (access_type in ('purchase', 'subscription', 'free'));
  end if;
end $$;

update public.library l
set access_type = 'free'
from public.books b
where l.book_id = b.id
  and coalesce(l.access_type, 'purchase') = 'purchase'
  and coalesce(b.price, 0) <= 0;

alter table public.library
  alter column access_type set default 'purchase';

alter table public.library
  alter column access_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'library_subscription_id_fkey'
      and conrelid = 'public.library'::regclass
  ) then
    alter table public.library
      add constraint library_subscription_id_fkey
      foreign key (subscription_id) references public.user_subscriptions(id) on delete set null;
  end if;
end $$;

create index if not exists subscription_plans_active_idx on public.subscription_plans(is_active);
create index if not exists subscription_plan_books_plan_id_idx on public.subscription_plan_books(plan_id);
create index if not exists subscription_plan_books_book_id_idx on public.subscription_plan_books(book_id);
create index if not exists user_subscriptions_user_id_idx on public.user_subscriptions(user_id);
create index if not exists user_subscriptions_plan_id_idx on public.user_subscriptions(plan_id);
create index if not exists user_subscriptions_user_status_idx on public.user_subscriptions(user_id, status);
create index if not exists library_subscription_id_idx on public.library(subscription_id);

drop trigger if exists trg_subscription_plans_updated_at on public.subscription_plans;
create trigger trg_subscription_plans_updated_at
before update on public.subscription_plans
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_user_subscriptions_updated_at on public.user_subscriptions;
create trigger trg_user_subscriptions_updated_at
before update on public.user_subscriptions
for each row execute procedure public.set_updated_at();

alter table public.subscription_plans enable row level security;
alter table public.subscription_plan_books enable row level security;
alter table public.user_subscriptions enable row level security;

create policy "Anyone can view active subscription plans"
on public.subscription_plans
for select
using (is_active = true);

create policy "Admin full subscription plans access"
on public.subscription_plans
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create policy "Anyone can view published subscription mappings"
on public.subscription_plan_books
for select
using (
  exists (
    select 1
    from public.subscription_plans sp
    join public.books b on b.id = book_id
    where sp.id = plan_id
      and sp.is_active = true
      and b.status in ('published', 'coming_soon')
  )
);

create policy "Authors can view own subscription mappings"
on public.subscription_plan_books
for select
using (
  exists (
    select 1
    from public.books b
    where b.id = book_id
      and b.author_id = auth.uid()
  )
);

create policy "Authors can insert own subscription mappings"
on public.subscription_plan_books
for insert
with check (
  exists (
    select 1
    from public.books b
    where b.id = book_id
      and b.author_id = auth.uid()
  )
);

create policy "Authors can update own subscription mappings"
on public.subscription_plan_books
for update
using (
  exists (
    select 1
    from public.books b
    where b.id = book_id
      and b.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.books b
    where b.id = book_id
      and b.author_id = auth.uid()
  )
);

create policy "Authors can delete own subscription mappings"
on public.subscription_plan_books
for delete
using (
  exists (
    select 1
    from public.books b
    where b.id = book_id
      and b.author_id = auth.uid()
  )
);

create policy "Admin full subscription mapping access"
on public.subscription_plan_books
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create policy "Readers can view own subscriptions"
on public.user_subscriptions
for select
using (auth.uid() = user_id);

create policy "Readers can insert own subscriptions"
on public.user_subscriptions
for insert
with check (auth.uid() = user_id);

create policy "Readers can update own subscriptions"
on public.user_subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admin full user subscriptions access"
on public.user_subscriptions
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create or replace function public.user_has_access_to_book(p_user_id uuid, p_book_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  has_access boolean;
begin
  if p_user_id is null or p_book_id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.library l
    where l.user_id = p_user_id
      and l.book_id = p_book_id
      and l.access_type in ('purchase', 'free')
  )
  or exists (
    select 1
    from public.user_subscriptions us
    join public.subscription_plan_books spb on spb.plan_id = us.plan_id
    where us.user_id = p_user_id
      and spb.book_id = p_book_id
      and us.status = 'active'
      and (us.expires_at is null or us.expires_at > now())
  )
  or exists (
    select 1
    from public.books b
    left join public.book_formats ebook_format
      on ebook_format.book_id = b.id
     and ebook_format.format = 'ebook'
     and ebook_format.is_published = true
    where b.id = p_book_id
      and b.status = 'published'
      and b.is_single_sale_enabled = true
      and coalesce(ebook_format.price, b.price, 0) <= 0
  )
  into has_access;

  return coalesce(has_access, false);
end;
$$;

grant execute on function public.user_has_access_to_book(uuid, uuid) to authenticated;
grant execute on function public.user_has_access_to_book(uuid, uuid) to anon;

drop policy if exists "Purchased users can read ebook files" on storage.objects;
drop policy if exists "Purchased users can read format ebook files" on storage.objects;

create policy "Accessible users can read base ebook files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'books'
  and exists (
    select 1
    from public.books b
    where b.file_url = name
      and public.user_has_access_to_book(auth.uid(), b.id)
  )
);

create policy "Accessible users can read format ebook files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'books'
  and exists (
    select 1
    from public.book_formats bf
    where bf.file_url = name
      and bf.format = 'ebook'
      and public.user_has_access_to_book(auth.uid(), bf.book_id)
  )
);
