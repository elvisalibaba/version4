-- Add explicit format on order items so admin can track ebook vs paper orders.

alter table public.order_items
  add column if not exists book_format text;

update public.order_items
set book_format = 'ebook'
where book_format is null or btrim(book_format) = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_book_format_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_book_format_check
      check (book_format in ('ebook', 'paperback', 'hardcover', 'audiobook'));
  end if;
end $$;

alter table public.order_items
  alter column book_format set default 'ebook',
  alter column book_format set not null;

create index if not exists order_items_book_format_idx on public.order_items(book_format);

-- Paper orders should be visible in admin orders, but should not unlock digital library access.
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
    and coalesce(oi.book_format, 'ebook') = 'ebook'
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
