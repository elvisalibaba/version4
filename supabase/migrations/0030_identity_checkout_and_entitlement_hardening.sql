-- Close the privilege-escalation and entitlement bypasses left by the initial
-- permissive reader policies. Payments continue to use the service-role
-- client, while admins retain their explicit FOR ALL policies from 0019.

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Direct database migrations do not carry an Auth JWT. Service-role calls
  -- and existing admins are the only application actors allowed to change
  -- identity and authorization fields.
  if auth.role() = 'service_role'
     or (auth.role() is null and auth.uid() is null)
     or public.is_current_user_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.role is distinct from old.role
     or new.created_at is distinct from old.created_at
     or new.referred_by_affiliate_user_id is distinct from old.referred_by_affiliate_user_id
     or new.referred_by_affiliate_code is distinct from old.referred_by_affiliate_code
     or new.affiliate_source_type is distinct from old.affiliate_source_type
     or new.affiliate_source_book_id is distinct from old.affiliate_source_book_id
     or new.affiliate_source_plan_id is distinct from old.affiliate_source_plan_id then
    raise exception 'Protected profile fields cannot be changed by this account.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_security_fields() from public;

drop trigger if exists trg_profiles_protect_security_fields on public.profiles;
create trigger trg_profiles_protect_security_fields
before update on public.profiles
for each row execute procedure public.protect_profile_security_fields();

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update safe own profile fields"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role in ('reader', 'author')
);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert safe own profile"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and role in ('reader', 'author')
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Orders and their prices/statuses are created by trusted server payment
-- code. A browser may read its own order, but may not manufacture one.
drop policy if exists "Reader creates own orders" on public.orders;
drop policy if exists "Reader inserts own order items" on public.order_items;

-- A library row is an entitlement, not a user-owned preference. Purchase
-- rows are written by the signed payment flow and subscription/free rows by
-- the constrained RPC below.
drop policy if exists "Reader inserts own library items" on public.library;

create or replace function public.claim_current_user_book_access(p_book_id uuid)
returns public.library
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  active_subscription_id uuid;
  is_free_book boolean := false;
  granted_entry public.library%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required to claim book access.'
      using errcode = '42501';
  end if;

  select exists (
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
  ) into is_free_book;

  if not is_free_book then
    select us.id
    into active_subscription_id
    from public.user_subscriptions us
    join public.subscription_plan_books spb on spb.plan_id = us.plan_id
    join public.books b on b.id = spb.book_id
    where us.user_id = current_user_id
      and spb.book_id = p_book_id
      and us.status = 'active'
      and (us.expires_at is null or us.expires_at > now())
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
    order by us.expires_at desc nulls first, us.started_at desc
    limit 1;

    if active_subscription_id is null then
      raise exception 'No free or active subscription access exists for this book.'
        using errcode = '42501';
    end if;
  end if;

  insert into public.library as existing (
    user_id,
    book_id,
    access_type,
    subscription_id,
    purchased_at
  )
  values (
    current_user_id,
    p_book_id,
    case when is_free_book then 'free' else 'subscription' end,
    case when is_free_book then null else active_subscription_id end,
    now()
  )
  on conflict (user_id, book_id) do update
  set
    access_type = case
      when existing.access_type = 'purchase' then existing.access_type
      else excluded.access_type
    end,
    subscription_id = case
      when existing.access_type = 'purchase' then null
      else excluded.subscription_id
    end,
    purchased_at = least(existing.purchased_at, excluded.purchased_at)
  returning * into granted_entry;

  return granted_entry;
end;
$$;

revoke all on function public.claim_current_user_book_access(uuid) from public;
grant execute on function public.claim_current_user_book_access(uuid) to authenticated;

-- Do not expose another account's entitlements as an oracle. Anonymous free
-- reading is handled by the server route after checking the published price.
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

  if auth.role() <> 'service_role'
     and (auth.uid() is null or (p_user_id <> auth.uid() and not public.is_current_user_admin())) then
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
  or exists (
    select 1
    from public.books b
    where b.id = p_book_id
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
      and exists (
        select 1
        from public.mobile_app_trial_grants matg
        where matg.user_id = p_user_id
          and matg.status = 'active'
          and matg.expires_at > now()
      )
      and exists (
        select 1
        from public.book_formats bf
        where bf.book_id = b.id
          and bf.is_published = true
          and bf.format in ('holistique_store', 'ebook')
      )
  ) into has_access;

  return coalesce(has_access, false);
end;
$$;

revoke all on function public.user_has_access_to_book(uuid, uuid) from public;
grant execute on function public.user_has_access_to_book(uuid, uuid) to authenticated;
grant execute on function public.user_has_access_to_book(uuid, uuid) to service_role;

-- Derive trial eligibility and duration from the protected global config;
-- callers can no longer grant themselves an arbitrary 30-day trial.
create or replace function public.claim_current_user_mobile_app_trial(
  p_trial_days integer default 7,
  p_source text default 'web_download'
)
returns public.mobile_app_trial_grants
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  configured_days integer;
  normalized_source text := left(coalesce(nullif(trim(p_source), ''), 'web_download'), 80);
  existing_grant public.mobile_app_trial_grants%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required to claim mobile app trial.'
      using errcode = '42501';
  end if;

  select trial_days
  into configured_days
  from public.mobile_app_configs
  where scope = 'global'
    and is_public = true
    and trial_enabled = true
    and apk_path is not null
    and nullif(trim(apk_path), '') is not null;

  if configured_days is null then
    raise exception 'The mobile application trial is not currently available.'
      using errcode = '42501';
  end if;

  select *
  into existing_grant
  from public.mobile_app_trial_grants
  where user_id = current_user_id;

  if not found then
    insert into public.mobile_app_trial_grants (
      user_id,
      source,
      granted_at,
      expires_at,
      status,
      claimed_download_count,
      last_downloaded_at
    )
    values (
      current_user_id,
      normalized_source,
      now(),
      now() + make_interval(days => configured_days),
      'active',
      1,
      now()
    )
    returning * into existing_grant;

    return existing_grant;
  end if;

  update public.mobile_app_trial_grants
  set
    source = normalized_source,
    status = case
      when status = 'revoked' then 'revoked'
      when expires_at <= now() then 'expired'
      else status
    end,
    claimed_download_count = greatest(claimed_download_count, 1) + 1,
    last_downloaded_at = now(),
    updated_at = now()
  where user_id = current_user_id
  returning * into existing_grant;

  return existing_grant;
end;
$$;

revoke all on function public.claim_current_user_mobile_app_trial(integer, text) from public;
grant execute on function public.claim_current_user_mobile_app_trial(integer, text) to authenticated;

-- Authors need commercial totals, not reader profiles or full payment
-- metadata. Expose a minimal derived dataset and remove the broad joins from
-- the historical acquisition policy.
create or replace function public.get_current_author_sales()
returns table (
  id uuid,
  order_id uuid,
  book_id uuid,
  price numeric,
  currency_code text,
  book_format text,
  title text,
  created_at timestamptz,
  payment_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    oi.id,
    oi.order_id,
    oi.book_id,
    oi.price,
    oi.currency_code,
    oi.book_format,
    b.title,
    o.created_at,
    o.payment_status
  from public.order_items oi
  join public.books b on b.id = oi.book_id
  join public.orders o on o.id = oi.order_id
  where auth.uid() is not null
    and b.author_id = auth.uid();
$$;

revoke all on function public.get_current_author_sales() from public;
grant execute on function public.get_current_author_sales() to authenticated;

drop policy if exists "Author can view own book orders" on public.orders;
drop policy if exists "Author can view readers of own books" on public.profiles;

-- `pocket` is a physical format just like paperback and hardcover. Keep its
-- printing cost and prevent an author from deleting an already published
-- edition through the REST API.
create or replace function public.enforce_author_book_format_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  owning_author_id uuid;
begin
  if public.is_current_user_admin() then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  select b.author_id
  into owning_author_id
  from public.books b
  where b.id = new.book_id;

  if owning_author_id is null or owning_author_id <> auth.uid() then
    raise exception 'Only the owning author can manage this format.';
  end if;

  new.is_published := false;

  if new.format in ('paperback', 'pocket', 'hardcover') then
    new.stock_quantity := null;
    new.downloadable := false;
  else
    new.printing_cost := null;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_author_book_format_delete_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return old;
  end if;

  if auth.uid() is null then
    return old;
  end if;

  if old.format in ('paperback', 'pocket', 'hardcover') and old.is_published = true then
    raise exception 'Published physical formats can only be removed by an admin.';
  end if;

  return old;
end;
$$;
