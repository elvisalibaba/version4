-- Keep paid order access and derived book stats synchronized from canonical tables.

create or replace function public.refresh_book_purchases_stats(p_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid_purchases integer := 0;
begin
  if p_book_id is null then
    return;
  end if;

  select count(*)::integer
  into v_paid_purchases
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.book_id = p_book_id
    and o.payment_status = 'paid';

  update public.books
  set purchases_count = coalesce(v_paid_purchases, 0)
  where id = p_book_id;
end;
$$;

create or replace function public.refresh_book_rating_stats(p_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ratings_count integer := 0;
  v_rating_avg numeric := null;
begin
  if p_book_id is null then
    return;
  end if;

  select
    count(*)::integer,
    case when count(*) > 0 then round(avg(r.rating)::numeric, 1) else null end
  into v_ratings_count, v_rating_avg
  from public.ratings r
  where r.book_id = p_book_id;

  update public.books
  set
    ratings_count = coalesce(v_ratings_count, 0),
    rating_avg = v_rating_avg
  where id = p_book_id;
end;
$$;

create or replace function public.refresh_book_views_stats(p_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_detail_views integer := 0;
begin
  if p_book_id is null then
    return;
  end if;

  select count(*)::integer
  into v_detail_views
  from public.book_engagement_events bee
  where bee.book_id = p_book_id
    and bee.event_type = 'detail_view';

  update public.books
  set views_count = coalesce(v_detail_views, 0)
  where id = p_book_id;
end;
$$;

create or replace function public.refresh_book_derived_stats(p_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_book_purchases_stats(p_book_id);
  perform public.refresh_book_rating_stats(p_book_id);
  perform public.refresh_book_views_stats(p_book_id);
end;
$$;

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

create or replace function public.sync_library_access_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and not public.is_current_user_admin() then
    raise exception 'Not authorized to synchronize library access for orders.';
  end if;

  perform public._sync_library_access_for_order(p_order_id);
end;
$$;

revoke all on function public.refresh_book_purchases_stats(uuid) from public;
revoke all on function public.refresh_book_rating_stats(uuid) from public;
revoke all on function public.refresh_book_views_stats(uuid) from public;
revoke all on function public.refresh_book_derived_stats(uuid) from public;
revoke all on function public._sync_library_access_for_order(uuid) from public;

grant execute on function public.sync_library_access_for_order(uuid) to authenticated;
grant execute on function public.sync_library_access_for_order(uuid) to service_role;

create or replace function public.handle_orders_payment_status_automation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_book_id uuid;
begin
  for v_book_id in
    select distinct oi.book_id
    from public.order_items oi
    where oi.order_id = new.id
  loop
    perform public.refresh_book_purchases_stats(v_book_id);
  end loop;

  if new.payment_status = 'paid' then
    perform public._sync_library_access_for_order(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_insert_paid_automation on public.orders;
create trigger trg_orders_insert_paid_automation
after insert on public.orders
for each row
when (new.payment_status = 'paid')
execute procedure public.handle_orders_payment_status_automation();

drop trigger if exists trg_orders_payment_status_automation on public.orders;
create trigger trg_orders_payment_status_automation
after update of payment_status on public.orders
for each row
when (old.payment_status is distinct from new.payment_status)
execute procedure public.handle_orders_payment_status_automation();

create or replace function public.handle_order_items_automation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_book_purchases_stats(new.book_id);
    perform public._sync_library_access_for_order(new.order_id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.book_id is distinct from new.book_id then
      perform public.refresh_book_purchases_stats(old.book_id);
    end if;

    perform public.refresh_book_purchases_stats(new.book_id);

    if old.order_id is distinct from new.order_id then
      perform public._sync_library_access_for_order(old.order_id);
    end if;

    perform public._sync_library_access_for_order(new.order_id);
    return new;
  end if;

  perform public.refresh_book_purchases_stats(old.book_id);
  return old;
end;
$$;

drop trigger if exists trg_order_items_automation on public.order_items;
create trigger trg_order_items_automation
after insert or update or delete on public.order_items
for each row
execute procedure public.handle_order_items_automation();

create or replace function public.handle_ratings_automation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_book_rating_stats(new.book_id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.book_id is distinct from new.book_id then
      perform public.refresh_book_rating_stats(old.book_id);
    end if;

    perform public.refresh_book_rating_stats(new.book_id);
    return new;
  end if;

  perform public.refresh_book_rating_stats(old.book_id);
  return old;
end;
$$;

drop trigger if exists trg_ratings_automation on public.ratings;
create trigger trg_ratings_automation
after insert or update or delete on public.ratings
for each row
execute procedure public.handle_ratings_automation();

create or replace function public.handle_book_engagement_views_automation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.event_type = 'detail_view' then
      perform public.refresh_book_views_stats(new.book_id);
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.book_id is distinct from new.book_id or old.event_type is distinct from new.event_type then
      if old.event_type = 'detail_view' then
        perform public.refresh_book_views_stats(old.book_id);
      end if;

      if new.event_type = 'detail_view' then
        perform public.refresh_book_views_stats(new.book_id);
      end if;
    end if;

    return new;
  end if;

  if old.event_type = 'detail_view' then
    perform public.refresh_book_views_stats(old.book_id);
  end if;

  return old;
end;
$$;

drop trigger if exists trg_book_engagement_views_automation on public.book_engagement_events;
create trigger trg_book_engagement_views_automation
after insert or update or delete on public.book_engagement_events
for each row
execute procedure public.handle_book_engagement_views_automation();

create or replace function public.track_book_engagement(
  p_book_id uuid,
  p_event_type text,
  p_source text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_user_role text;
begin
  if p_event_type not in ('detail_view', 'reader_open', 'file_access') then
    raise exception 'Unsupported book engagement event type: %', p_event_type;
  end if;

  current_user_id := auth.uid();

  if current_user_id is not null then
    select role
    into current_user_role
    from public.profiles
    where id = current_user_id;
  end if;

  insert into public.book_engagement_events (
    book_id,
    user_id,
    event_type,
    source,
    user_role,
    is_authenticated,
    metadata
  )
  values (
    p_book_id,
    current_user_id,
    p_event_type,
    p_source,
    current_user_role,
    current_user_id is not null,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.track_book_engagement(uuid, text, text, jsonb) to anon, authenticated;

do $$
declare
  v_book_id uuid;
  v_order_id uuid;
begin
  for v_book_id in
    select id from public.books
  loop
    perform public.refresh_book_derived_stats(v_book_id);
  end loop;

  for v_order_id in
    select id
    from public.orders
    where payment_status = 'paid'
  loop
    perform public._sync_library_access_for_order(v_order_id);
  end loop;
end;
$$;
