alter table public.books
  add column if not exists author_display_name text;

update public.books b
set author_display_name = coalesce(
  nullif(trim(b.author_display_name), ''),
  (
    select nullif(trim(ap.display_name), '')
    from public.author_profiles ap
    where ap.id = b.author_id
    limit 1
  ),
  (
    select nullif(trim(p.name), '')
    from public.profiles p
    where p.id = b.author_id
    limit 1
  ),
  'Auteur inconnu'
)
where coalesce(nullif(trim(b.author_display_name), ''), '') = '';

create index if not exists books_author_display_name_idx on public.books(author_display_name);

alter table public.book_formats
  drop constraint if exists book_formats_format_check;

alter table public.order_items
  drop constraint if exists order_items_book_format_check;

alter table public.book_formats
  add constraint book_formats_format_check
  check (format in ('holistique_store', 'ebook', 'paperback', 'pocket', 'hardcover', 'audiobook'));

alter table public.order_items
  add constraint order_items_book_format_check
  check (book_format in ('holistique_store', 'ebook', 'paperback', 'pocket', 'hardcover', 'audiobook'));

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
    where b.id = p_book_id
      and b.status = 'published'
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

create or replace function public._sync_library_access_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_purchase_date timestamptz;
begin
  if p_order_id is null then
    return;
  end if;

  select *
  into v_order
  from public.orders o
  where o.id = p_order_id;

  if not found or v_order.payment_status <> 'paid' then
    return;
  end if;

  v_purchase_date := coalesce(v_order.payment_verified_at, v_order.created_at, now());

  insert into public.library as l (
    user_id,
    book_id,
    access_type,
    purchased_at,
    subscription_id
  )
  select
    v_order.user_id,
    oi.book_id,
    'purchase',
    v_purchase_date,
    null
  from public.order_items oi
  where oi.order_id = v_order.id
    and coalesce(oi.book_format, 'ebook') in ('holistique_store', 'ebook')
  on conflict (user_id, book_id) do update
    set
      access_type = 'purchase',
      subscription_id = null,
      purchased_at = case
        when l.purchased_at is null then excluded.purchased_at
        else least(l.purchased_at, excluded.purchased_at)
      end;
end;
$$;

drop policy if exists "Accessible users can read format ebook files" on storage.objects;
drop policy if exists "Accessible users can read digital format files" on storage.objects;

create policy "Accessible users can read digital format files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'books'
  and exists (
    select 1
    from public.book_formats bf
    where bf.file_url = name
      and bf.format in ('holistique_store', 'ebook')
      and public.user_has_access_to_book(auth.uid(), bf.book_id)
  )
);
