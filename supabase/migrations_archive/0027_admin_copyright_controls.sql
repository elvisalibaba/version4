alter table public.books
  add column if not exists copyright_status text,
  add column if not exists copyright_note text,
  add column if not exists copyright_blocked_at timestamptz,
  add column if not exists copyright_blocked_by uuid;

update public.books
set copyright_status = 'clear'
where copyright_status is null
   or nullif(trim(copyright_status), '') is null;

alter table public.books
  alter column copyright_status set default 'clear';

alter table public.books
  alter column copyright_status set not null;

alter table public.books
  drop constraint if exists books_copyright_status_check;

alter table public.books
  add constraint books_copyright_status_check
  check (copyright_status in ('clear', 'review', 'blocked'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'books_copyright_blocked_by_fkey'
  ) then
    alter table public.books
      add constraint books_copyright_blocked_by_fkey
      foreign key (copyright_blocked_by)
      references public.profiles(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists books_copyright_status_idx on public.books(copyright_status);

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
    from public.books b
    join public.library l on l.book_id = b.id
    where b.id = p_book_id
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
      and l.user_id = p_user_id
      and l.access_type in ('purchase', 'free')
  )
  or exists (
    select 1
    from public.books b
    join public.subscription_plan_books spb on spb.book_id = b.id
    join public.user_subscriptions us on us.plan_id = spb.plan_id
    where b.id = p_book_id
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
      and us.user_id = p_user_id
      and us.status = 'active'
      and (us.expires_at is null or us.expires_at > now())
  )
  or exists (
    select 1
    from public.books b
    where b.id = p_book_id
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
      and b.is_single_sale_enabled = true
      and coalesce(
        (
          select bf.price
          from public.book_formats bf
          where bf.book_id = b.id
            and bf.is_published = true
            and bf.format in ('holistique_store', 'ebook')
          order by case bf.format
            when 'holistique_store' then 0
            when 'ebook' then 1
            else 99
          end
          limit 1
        ),
        b.price,
        0
      ) <= 0
  )
  into has_access;

  return coalesce(has_access, false);
end;
$$;

grant execute on function public.user_has_access_to_book(uuid, uuid) to authenticated;
grant execute on function public.user_has_access_to_book(uuid, uuid) to anon;
