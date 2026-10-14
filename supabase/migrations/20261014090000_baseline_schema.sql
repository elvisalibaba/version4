-- =============================================================================
-- HolisticBooks — BASELINE du schéma réel de production (projet wgsvzhhzsmioihjwcwcs)
-- =============================================================================
-- Généré le 14/10/2026 par `supabase db dump --linked` (pg_dump --schema-only), en
-- lecture seule. Aucune donnée, aucun secret. Schémas gérés par Supabase exclus
-- (auth, storage, realtime, extensions…) : les policies storage.objects et les
-- buckets sont documentés dans docs/supabase-security-baseline.md.
--
-- NE PAS EXÉCUTER sur la production : tous ces objets y existent déjà.
-- Ce fichier décrit l'état réel au 14/10/2026 ; il n'est ni idempotent ni
-- transactionnel (exception assumée pour une baseline : CREATE POLICY et
-- ADD CONSTRAINT échoueraient sur une base existante).
--
-- Enregistrée comme appliquée le 14/10/2026 (`supabase migration repair --status applied
-- 20261014090000`) : jamais exécutée sur la production.
-- =============================================================================




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."_sync_library_access_for_order"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."_sync_library_access_for_order"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_import_published_book"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_confirm_rights" boolean, "p_title" "text", "p_description" "text", "p_author_id" "uuid", "p_author_display_name" "text", "p_language" "text", "p_category" "text", "p_price" numeric, "p_currency_code" "text", "p_file_path" "text", "p_cover_path" "text", "p_original_file_name" "text", "p_file_size" bigint, "p_page_count" integer) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $_$
declare
  v_admin_id uuid := auth.uid();
  v_book_id uuid;
  v_author_display_name text;
  v_now timestamptz := now();
  v_file_prefix text;
  v_expected_cover_path text;
  v_import_item public.admin_book_import_items%rowtype;
begin
  if v_admin_id is null or not public.is_current_user_admin() then
    raise exception 'Administrator authentication is required.'
      using errcode = '42501';
  end if;

  if not coalesce(p_confirm_rights, false) then
    raise exception 'Distribution rights must be confirmed before publication.'
      using errcode = '22023';
  end if;

  if p_batch_id is null or p_item_id is null then
    raise exception 'Import identifiers are required.'
      using errcode = '22023';
  end if;

  if nullif(trim(p_title), '') is null or char_length(trim(p_title)) > 240 then
    raise exception 'A valid title of at most 240 characters is required.'
      using errcode = '22023';
  end if;

  if p_checksum is null or p_checksum !~ '^[0-9a-f]{64}$' then
    raise exception 'A valid SHA-256 checksum is required.'
      using errcode = '22023';
  end if;

  if p_price is null or p_price < 0 or p_price > 1000000 then
    raise exception 'The public price is invalid.'
      using errcode = '22023';
  end if;

  if p_file_size is null or p_file_size <= 0 or p_file_size > 209715200 then
    raise exception 'The PDF size is invalid or exceeds 200 MB.'
      using errcode = '22023';
  end if;

  if p_page_count is not null and (p_page_count <= 0 or p_page_count > 100000) then
    raise exception 'The PDF page count is invalid.'
      using errcode = '22023';
  end if;

  if coalesce(p_language, '') !~ '^[a-z]{2,3}(-[a-z0-9]{2,8})?$'
     or coalesce(p_currency_code, '') !~ '^[A-Z]{3}$'
     or nullif(trim(p_category), '') is null then
    raise exception 'Language, category or currency is invalid.'
      using errcode = '22023';
  end if;

  select ap.display_name
  into v_author_display_name
  from public.author_profiles ap
  join public.profiles p on p.id = ap.id
  where ap.id = p_author_id
    and p.role in ('author', 'admin');

  if not found then
    raise exception 'The selected author profile does not exist.'
      using errcode = '23503';
  end if;

  v_file_prefix := format(
    'files/admin-imports/%s/%s/%s/%s-',
    v_admin_id,
    p_batch_id,
    p_item_id,
    p_checksum
  );
  v_expected_cover_path := format(
    'covers/admin-imports/%s/%s/%s/%s.webp',
    v_admin_id,
    p_batch_id,
    p_item_id,
    p_checksum
  );

  if left(p_file_path, char_length(v_file_prefix)) <> v_file_prefix
     or p_cover_path <> v_expected_cover_path
     or lower(right(coalesce(p_original_file_name, ''), 4)) <> '.pdf' then
    raise exception 'Storage paths do not belong to this import session.'
      using errcode = '42501';
  end if;

  select *
  into v_import_item
  from public.admin_book_import_items i
  where i.created_by = v_admin_id
    and i.item_id = p_item_id
  for update;

  if not found then
    raise exception 'This import item was not prepared.'
      using errcode = 'P0002';
  end if;

  if v_import_item.batch_id is distinct from p_batch_id
     or v_import_item.source_checksum_sha256 is distinct from p_checksum
     or v_import_item.source_file_name is distinct from trim(p_original_file_name)
     or v_import_item.source_file_size_bytes is distinct from p_file_size
     or v_import_item.source_storage_path is distinct from p_file_path
     or v_import_item.cover_storage_path is distinct from p_cover_path then
    raise exception 'The finalization payload does not match the prepared import item.'
      using errcode = '23505';
  end if;

  if v_import_item.status = 'completed' and v_import_item.book_id is not null then
    return v_import_item.book_id;
  end if;

  if exists (
    select 1
    from public.books b
    where b.admin_import_checksum = p_checksum
  ) then
    raise exception 'This PDF already exists in the catalog.'
      using errcode = '23505';
  end if;

  update public.admin_book_import_items
  set
    status = 'processing',
    rights_confirmed = true,
    error_message = null
  where id = v_import_item.id;

  insert into public.books (
    title,
    description,
    price,
    currency_code,
    author_id,
    author_display_name,
    cover_url,
    cover_thumbnail_url,
    cover_alt_text,
    file_url,
    file_format,
    file_size,
    page_count,
    language,
    categories,
    status,
    published_at,
    review_status,
    reviewed_at,
    reviewed_by,
    copyright_status,
    is_single_sale_enabled,
    is_subscription_available,
    admin_import_batch_id,
    admin_import_item_id,
    admin_import_checksum,
    admin_import_original_file_name,
    admin_imported_by,
    admin_imported_at
  )
  values (
    trim(p_title),
    nullif(trim(p_description), ''),
    round(p_price, 2),
    p_currency_code,
    p_author_id,
    coalesce(nullif(trim(p_author_display_name), ''), v_author_display_name),
    p_cover_path,
    p_cover_path,
    'Couverture de ' || trim(p_title),
    p_file_path,
    'pdf',
    p_file_size::integer,
    p_page_count,
    p_language,
    array[trim(p_category)],
    'published',
    v_now,
    'approved',
    v_now,
    v_admin_id,
    'clear',
    true,
    false,
    p_batch_id,
    p_item_id,
    p_checksum,
    left(trim(p_original_file_name), 255),
    v_admin_id,
    v_now
  )
  returning id into v_book_id;

  insert into public.book_formats (
    book_id,
    format,
    price,
    currency_code,
    file_url,
    stock_quantity,
    file_size_mb,
    downloadable,
    is_published
  )
  values (
    v_book_id,
    'ebook',
    round(p_price, 2),
    p_currency_code,
    p_file_path,
    null,
    greatest(1, ceil(p_file_size::numeric / 1048576)::integer),
    false,
    true
  );

  update public.admin_book_import_items
  set
    status = 'completed',
    rights_confirmed = true,
    book_id = v_book_id,
    error_message = null,
    completed_at = v_now
  where id = v_import_item.id;

  return v_book_id;
end;
$_$;


ALTER FUNCTION "public"."admin_import_published_book"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_confirm_rights" boolean, "p_title" "text", "p_description" "text", "p_author_id" "uuid", "p_author_display_name" "text", "p_language" "text", "p_category" "text", "p_price" numeric, "p_currency_code" "text", "p_file_path" "text", "p_cover_path" "text", "p_original_file_name" "text", "p_file_size" bigint, "p_page_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_import_published_book"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_confirm_rights" boolean, "p_title" "text", "p_description" "text", "p_author_id" "uuid", "p_author_display_name" "text", "p_language" "text", "p_category" "text", "p_price" numeric, "p_currency_code" "text", "p_file_path" "text", "p_cover_path" "text", "p_original_file_name" "text", "p_file_size" bigint, "p_page_count" integer) IS 'Atomically creates an approved, published PDF and its ebook format for an authenticated administrator.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."mobile_app_trial_grants" (
    "user_id" "uuid" NOT NULL,
    "source" "text" DEFAULT 'web_download'::"text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "claimed_download_count" integer DEFAULT 1 NOT NULL,
    "last_downloaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mobile_app_trial_grants_claimed_download_count_check" CHECK (("claimed_download_count" >= 1)),
    CONSTRAINT "mobile_app_trial_grants_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."mobile_app_trial_grants" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_current_user_mobile_app_trial"("p_trial_days" integer DEFAULT 7, "p_source" "text" DEFAULT 'web_download'::"text") RETURNS "public"."mobile_app_trial_grants"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  current_user_id uuid := auth.uid();
  normalized_days integer := greatest(1, least(30, coalesce(p_trial_days, 7)));
  existing_grant public.mobile_app_trial_grants%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required to claim mobile app trial.';
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
      coalesce(nullif(trim(p_source), ''), 'web_download'),
      now(),
      now() + make_interval(days => normalized_days),
      'active',
      1,
      now()
    )
    returning *
    into existing_grant;

    return existing_grant;
  end if;

  update public.mobile_app_trial_grants
  set
    source = coalesce(nullif(trim(p_source), ''), source),
    status = case
      when status = 'revoked' then 'revoked'
      when expires_at <= now() then 'expired'
      else status
    end,
    claimed_download_count = greatest(claimed_download_count, 1) + 1,
    last_downloaded_at = now(),
    updated_at = now()
  where user_id = current_user_id
  returning *
  into existing_grant;

  return existing_grant;
end;
$$;


ALTER FUNCTION "public"."claim_current_user_mobile_app_trial"("p_trial_days" integer, "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."credit_affiliate_paid_order_commission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  referral_user_id uuid;
  referral_code text;
  referral_source_type text;
  referral_source_book_id uuid;
  referral_source_plan_id uuid;
  resolved_affiliate_user_id uuid;
  affiliate_profile public.reader_affiliate_profiles%rowtype;
  purchased_book_id_value uuid;
  order_amount_value numeric(10,2) := 0;
  order_currency_code_value text := 'USD';
  commission_rate_value numeric(5,4) := 0.0200;
  commission_amount_value numeric(10,2) := 0;
  inserted_count integer := 0;
  effective_source_type text;
begin
  if new.payment_status <> 'paid' then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(old.payment_status, '') = 'paid' then
    return new;
  end if;

  select
    p.referred_by_affiliate_user_id,
    upper(nullif(trim(coalesce(p.referred_by_affiliate_code, '')), '')),
    public.normalize_affiliate_source_type(p.affiliate_source_type),
    p.affiliate_source_book_id,
    p.affiliate_source_plan_id
  into
    referral_user_id,
    referral_code,
    referral_source_type,
    referral_source_book_id,
    referral_source_plan_id
  from public.profiles p
  where p.id = new.user_id;

  if referral_user_id is null and referral_code is not null then
    select rap.user_id
    into resolved_affiliate_user_id
    from public.reader_affiliate_profiles rap
    where rap.affiliate_code = referral_code
      and rap.is_active = true
    limit 1;

    referral_user_id := resolved_affiliate_user_id;
  end if;

  if referral_user_id is null or referral_user_id = new.user_id then
    return new;
  end if;

  perform public.ensure_reader_affiliate_profile(referral_user_id);

  select *
  into affiliate_profile
  from public.reader_affiliate_profiles rap
  where rap.user_id = referral_user_id
    and rap.is_active = true
  limit 1;

  if not found then
    return new;
  end if;

  select
    oi.book_id,
    coalesce(new.total_price, oi.price, 0),
    coalesce(new.currency_code, oi.currency_code, 'USD')
  into
    purchased_book_id_value,
    order_amount_value,
    order_currency_code_value
  from public.order_items oi
  where oi.order_id = new.id
  order by oi.id
  limit 1;

  if purchased_book_id_value is null or order_amount_value <= 0 then
    return new;
  end if;

  commission_rate_value := coalesce(affiliate_profile.commission_rate, 0.0200);
  commission_amount_value := round(order_amount_value::numeric * commission_rate_value, 2);

  if commission_amount_value <= 0 then
    return new;
  end if;

  effective_source_type := case
    when public.normalize_affiliate_source_type(referral_source_type) is not null then public.normalize_affiliate_source_type(referral_source_type)
    when referral_source_book_id is not null then 'book'
    when referral_source_plan_id is not null then 'plan'
    else null
  end;

  insert into public.affiliate_order_transactions (
    affiliate_user_id,
    referred_user_id,
    order_id,
    purchased_book_id,
    referral_source_type,
    referral_source_book_id,
    referral_source_plan_id,
    commission_rate,
    order_amount,
    commission_amount,
    currency_code,
    status
  )
  values (
    referral_user_id,
    new.user_id,
    new.id,
    purchased_book_id_value,
    effective_source_type,
    case when effective_source_type = 'book' then referral_source_book_id else null end,
    case when effective_source_type = 'plan' then referral_source_plan_id else null end,
    commission_rate_value,
    order_amount_value,
    commission_amount_value,
    order_currency_code_value,
    'credited'
  )
  on conflict (order_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.reader_affiliate_profiles
    set
      wallet_balance = wallet_balance + commission_amount_value,
      lifetime_credited = lifetime_credited + commission_amount_value,
      currency_code = coalesce(order_currency_code_value, currency_code, 'USD'),
      updated_at = now()
    where user_id = referral_user_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."credit_affiliate_paid_order_commission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."credit_affiliate_subscription_commission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  plan_monthly_price numeric(10,2) := 0;
  plan_currency_code text := 'USD';
  inserted_count integer := 0;
  effective_source_type text;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(old.status, '') = 'active' then
    return new;
  end if;

  if new.affiliate_user_id is null or coalesce(new.affiliate_commission_amount, 0) <= 0 then
    return new;
  end if;

  perform public.ensure_reader_affiliate_profile(new.affiliate_user_id);

  select
    coalesce(monthly_price, 0),
    coalesce(currency_code, 'USD')
  into
    plan_monthly_price,
    plan_currency_code
  from public.subscription_plans
  where id = new.plan_id;

  if not found then
    plan_monthly_price := 0;
    plan_currency_code := 'USD';
  end if;

  effective_source_type := case
    when public.normalize_affiliate_source_type(new.affiliate_source_type) is not null then public.normalize_affiliate_source_type(new.affiliate_source_type)
    when new.affiliate_source_book_id is not null then 'book'
    else 'plan'
  end;

  insert into public.affiliate_wallet_transactions (
    affiliate_user_id,
    referred_user_id,
    subscription_id,
    plan_id,
    source_type,
    source_book_id,
    source_plan_id,
    commission_rate,
    subscription_amount,
    commission_amount,
    currency_code,
    status
  )
  values (
    new.affiliate_user_id,
    new.user_id,
    new.id,
    new.plan_id,
    effective_source_type,
    case when effective_source_type = 'book' then new.affiliate_source_book_id else null end,
    case when effective_source_type = 'plan' then new.affiliate_source_plan_id else null end,
    coalesce(new.affiliate_commission_rate, 0.0200),
    plan_monthly_price,
    coalesce(new.affiliate_commission_amount, round(plan_monthly_price::numeric * coalesce(new.affiliate_commission_rate, 0.0200), 2)),
    plan_currency_code,
    'credited'
  )
  on conflict (subscription_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.reader_affiliate_profiles
    set
      wallet_balance = wallet_balance + coalesce(new.affiliate_commission_amount, 0),
      lifetime_credited = lifetime_credited + coalesce(new.affiliate_commission_amount, 0),
      currency_code = coalesce(plan_currency_code, currency_code, 'USD'),
      updated_at = now()
    where user_id = new.affiliate_user_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."credit_affiliate_subscription_commission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_author_book_format_delete_workflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if public.is_current_user_admin() then
    return old;
  end if;

  if auth.uid() is null then
    return old;
  end if;

  if old.format in ('paperback', 'hardcover') and old.is_published = true then
    raise exception 'Published physical formats can only be removed by an admin.';
  end if;

  return old;
end;
$$;


ALTER FUNCTION "public"."enforce_author_book_format_delete_workflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_author_book_format_workflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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

  if new.format in ('paperback', 'hardcover') then
    new.stock_quantity := null;
    new.downloadable := false;
  else
    new.printing_cost := null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_author_book_format_workflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_author_book_submission_workflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'UPDATE'
     and current_setting('holistique.book_stats_refresh', true) = 'on' then
    if (to_jsonb(new) - array['views_count', 'purchases_count', 'rating_avg', 'ratings_count', 'updated_at']::text[])
       is distinct from
       (to_jsonb(old) - array['views_count', 'purchases_count', 'rating_avg', 'ratings_count', 'updated_at']::text[]) then
      raise exception 'A statistics refresh cannot change editorial fields.'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if public.is_current_user_admin() then
    if new.status = 'published' then
      new.review_status := 'approved';
      new.reviewed_at := coalesce(new.reviewed_at, now());
      new.reviewed_by := coalesce(new.reviewed_by, auth.uid());
      new.published_at := coalesce(new.published_at, now());
    end if;

    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if new.author_id <> auth.uid() then
    raise exception 'Only the owning author can manage this book.';
  end if;

  if tg_op = 'UPDATE' then
    if new.created_at is distinct from old.created_at
      or new.reviewed_at is distinct from old.reviewed_at
      or new.reviewed_by is distinct from old.reviewed_by
      or new.review_note is distinct from old.review_note then
      raise exception 'Admin review fields can only be changed by an admin.';
    end if;

    if new.copyright_status is distinct from old.copyright_status
      or new.copyright_note is distinct from old.copyright_note
      or new.copyright_blocked_at is distinct from old.copyright_blocked_at
      or new.copyright_blocked_by is distinct from old.copyright_blocked_by then
      raise exception 'Copyright control fields can only be changed by an admin.';
    end if;

    if new.admin_import_batch_id is distinct from old.admin_import_batch_id
      or new.admin_import_item_id is distinct from old.admin_import_item_id
      or new.admin_import_checksum is distinct from old.admin_import_checksum
      or new.admin_import_original_file_name is distinct from old.admin_import_original_file_name
      or new.admin_imported_by is distinct from old.admin_imported_by
      or new.admin_imported_at is distinct from old.admin_imported_at then
      raise exception 'Admin import audit fields cannot be changed by an author.';
    end if;

    if new.views_count is distinct from old.views_count
      or new.purchases_count is distinct from old.purchases_count
      or new.rating_avg is distinct from old.rating_avg
      or new.ratings_count is distinct from old.ratings_count then
      raise exception 'Derived book counters cannot be changed by an author.';
    end if;
  else
    new.created_at := now();
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.review_note := null;
    new.copyright_status := 'clear';
    new.copyright_note := null;
    new.copyright_blocked_at := null;
    new.copyright_blocked_by := null;
    new.admin_import_batch_id := null;
    new.admin_import_item_id := null;
    new.admin_import_checksum := null;
    new.admin_import_original_file_name := null;
    new.admin_imported_by := null;
    new.admin_imported_at := null;
    new.views_count := 0;
    new.purchases_count := 0;
    new.rating_avg := null;
    new.ratings_count := 0;
  end if;

  if new.review_status not in ('draft', 'submitted') then
    raise exception 'Authors can only save drafts or submit books for review.';
  end if;

  new.status := 'draft';
  new.published_at := null;

  if new.review_status = 'submitted' then
    new.submitted_at := coalesce(new.submitted_at, now());
  else
    new.submitted_at := null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_author_book_submission_workflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_book_publication_rights"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if new.status in ('published', 'coming_soon') and new.copyright_status <> 'clear' then
    raise exception 'Publication refusée : les droits de diffusion doivent être validés.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_book_publication_rights"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enforce_book_publication_rights"() IS 'Empêche la publication ou la prépublication sans validation explicite des droits.';



CREATE OR REPLACE FUNCTION "public"."ensure_author_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.role in ('author', 'admin') then
    insert into public.author_profiles (id, display_name)
    values (new.id, coalesce(nullif(new.name, ''), 'Auteur inconnu'))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."ensure_author_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_reader_affiliate_profile"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.reader_affiliate_profiles as rap (
    user_id,
    affiliate_code,
    commission_rate,
    currency_code,
    is_active
  )
  select
    p.id,
    public.generate_reader_affiliate_code(p.id),
    0.0200,
    'USD',
    true
  from public.profiles p
  where p.id = p_user_id
    and p.role = 'reader'
  on conflict (user_id) do update
    set
      affiliate_code = coalesce(nullif(rap.affiliate_code, ''), excluded.affiliate_code),
      updated_at = now();
end;
$$;


ALTER FUNCTION "public"."ensure_reader_affiliate_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_reader_affiliate_code"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  base_code text := upper('HBL' || substr(replace(coalesce(p_user_id::text, ''), '-', ''), 1, 9));
  candidate text := base_code;
  suffix integer := 0;
begin
  if p_user_id is null then
    return null;
  end if;

  while exists (
    select 1
    from public.reader_affiliate_profiles rap
    where rap.affiliate_code = candidate
      and rap.user_id <> p_user_id
  ) loop
    suffix := suffix + 1;
    candidate := upper(base_code || lpad(suffix::text, 2, '0'));
  end loop;

  return candidate;
end;
$$;


ALTER FUNCTION "public"."generate_reader_affiliate_code"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_affiliate_payout_account"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    v_privileged boolean;
BEGIN

    v_privileged :=
        current_user IN ('postgres', 'service_role', 'supabase_admin')
        OR COALESCE(auth.role(), '') = 'service_role'
        OR public.is_admin();


    IF v_privileged THEN
        RETURN NEW;
    END IF;


    IF TG_OP = 'INSERT' THEN

        NEW.is_verified := false;

        RETURN NEW;

    END IF;


    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN

        RAISE EXCEPTION
            'Changement du propriétaire interdit';

    END IF;


    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN

        RAISE EXCEPTION
            'La vérification du compte est réservée au serveur';

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."guard_affiliate_payout_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_book_admin_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    v_privileged boolean;
BEGIN

    v_privileged :=
        current_user IN ('postgres', 'service_role', 'supabase_admin')
        OR COALESCE(auth.role(), '') = 'service_role'
        OR public.is_admin();

    IF v_privileged THEN
        RETURN NEW;
    END IF;


    -- Auteur propriétaire immuable directement
    IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
        RAISE EXCEPTION
            'Modification de l’auteur principal interdite';
    END IF;


    -- Workflow de validation
    IF NEW.review_status IS DISTINCT FROM OLD.review_status
    OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
    OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
    OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
    OR NEW.review_note IS DISTINCT FROM OLD.review_note
    THEN

        RAISE EXCEPTION
            'Les champs de validation doivent être modifiés via le workflow sécurisé';

    END IF;


    -- Copyright
    IF NEW.copyright_status IS DISTINCT FROM OLD.copyright_status
    OR NEW.copyright_note IS DISTINCT FROM OLD.copyright_note
    OR NEW.copyright_blocked_at IS DISTINCT FROM OLD.copyright_blocked_at
    OR NEW.copyright_blocked_by IS DISTINCT FROM OLD.copyright_blocked_by
    THEN

        RAISE EXCEPTION
            'Modification des champs copyright interdite';

    END IF;


    -- Import administratif
    IF NEW.admin_import_batch_id
        IS DISTINCT FROM OLD.admin_import_batch_id

    OR NEW.admin_import_item_id
        IS DISTINCT FROM OLD.admin_import_item_id

    OR NEW.admin_import_checksum
        IS DISTINCT FROM OLD.admin_import_checksum

    OR NEW.admin_import_original_file_name
        IS DISTINCT FROM OLD.admin_import_original_file_name

    OR NEW.admin_imported_by
        IS DISTINCT FROM OLD.admin_imported_by

    OR NEW.admin_imported_at
        IS DISTINCT FROM OLD.admin_imported_at
    THEN

        RAISE EXCEPTION
            'Modification des données d’import interdite';

    END IF;


    -- Statistiques serveur
    IF NEW.views_count IS DISTINCT FROM OLD.views_count
    OR NEW.purchases_count IS DISTINCT FROM OLD.purchases_count
    OR NEW.rating_avg IS DISTINCT FROM OLD.rating_avg
    OR NEW.ratings_count IS DISTINCT FROM OLD.ratings_count
    THEN

        RAISE EXCEPTION
            'Modification directe des statistiques interdite';

    END IF;


    -- Publication uniquement après validation admin
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status = 'published'
    THEN

        RAISE EXCEPTION
            'Publication directe interdite';

    END IF;


    IF NEW.published_at IS DISTINCT FROM OLD.published_at THEN

        RAISE EXCEPTION
            'Modification de published_at interdite';

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."guard_book_admin_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_device_security"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    v_privileged boolean;
BEGIN

    v_privileged :=
        current_user IN ('postgres', 'service_role', 'supabase_admin')
        OR COALESCE(auth.role(), '') = 'service_role'
        OR public.is_admin();


    IF v_privileged THEN
        RETURN NEW;
    END IF;


    IF TG_OP = 'INSERT' THEN

        NEW.integrity_status := 'unknown';
        NEW.is_trusted := false;
        NEW.revoked_at := NULL;
        NEW.is_active := true;

        RETURN NEW;

    END IF;


    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION
            'Changement du propriétaire de l’appareil interdit';
    END IF;


    IF NEW.device_uuid IS DISTINCT FROM OLD.device_uuid THEN
        RAISE EXCEPTION
            'Modification device_uuid interdite';
    END IF;


    IF NEW.integrity_status
        IS DISTINCT FROM OLD.integrity_status

    OR NEW.is_trusted
        IS DISTINCT FROM OLD.is_trusted

    OR NEW.revoked_at
        IS DISTINCT FROM OLD.revoked_at
    THEN

        RAISE EXCEPTION
            'Modification des paramètres de confiance interdite';

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."guard_device_security"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_profile_sensitive_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    v_privileged boolean;
BEGIN

    v_privileged :=
        current_user IN ('postgres', 'service_role', 'supabase_admin')
        OR COALESCE(auth.role(), '') = 'service_role'
        OR public.is_admin();

    IF v_privileged THEN
        RETURN NEW;
    END IF;


    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION
            'Modification du rôle interdite';
    END IF;


    IF NEW.referred_by_affiliate_user_id
        IS DISTINCT FROM OLD.referred_by_affiliate_user_id
    OR NEW.referred_by_affiliate_code
        IS DISTINCT FROM OLD.referred_by_affiliate_code
    OR NEW.affiliate_source_type
        IS DISTINCT FROM OLD.affiliate_source_type
    OR NEW.affiliate_source_book_id
        IS DISTINCT FROM OLD.affiliate_source_book_id
    OR NEW.affiliate_source_plan_id
        IS DISTINCT FROM OLD.affiliate_source_plan_id
    THEN

        RAISE EXCEPTION
            'Modification des données d’affiliation interdite';

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."guard_profile_sensitive_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_book_engagement_views_automation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."handle_book_engagement_views_automation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  safe_role text;
  first_name_value text;
  last_name_value text;
  fallback_name text;
  full_name text;
  favorite_categories_value text[] := '{}'::text[];
  marketing_opt_in_value boolean := false;
  author_profile_payload jsonb := '{}'::jsonb;
  author_genres_value text[] := '{}'::text[];
  referred_by_affiliate_code_value text;
  affiliate_source_type_value text;
  affiliate_source_book_id_value uuid;
  affiliate_source_plan_id_value uuid;
begin
  safe_role := case
    when coalesce(new.raw_user_meta_data->>'role', 'reader') = 'author' then 'author'
    else 'reader'
  end;

  first_name_value := nullif(coalesce(new.raw_user_meta_data->>'first_name', ''), '');
  last_name_value := nullif(coalesce(new.raw_user_meta_data->>'last_name', ''), '');
  fallback_name := nullif(coalesce(new.raw_user_meta_data->>'name', ''), '');
  full_name := nullif(trim(concat_ws(' ', first_name_value, last_name_value)), '');

  if jsonb_typeof(new.raw_user_meta_data->'favorite_categories') = 'array' then
    favorite_categories_value := array(
      select jsonb_array_elements_text(new.raw_user_meta_data->'favorite_categories')
    );
  end if;

  marketing_opt_in_value := coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false);
  author_profile_payload := coalesce(new.raw_user_meta_data->'author_profile', '{}'::jsonb);
  referred_by_affiliate_code_value := upper(nullif(coalesce(new.raw_user_meta_data->>'referred_by_affiliate_code', ''), ''));
  affiliate_source_type_value := public.normalize_affiliate_source_type(new.raw_user_meta_data->>'affiliate_source_type');
  affiliate_source_book_id_value := case
    when affiliate_source_type_value = 'book' then public.safe_uuid(new.raw_user_meta_data->>'affiliate_source_book_id')
    else null
  end;
  affiliate_source_plan_id_value := case
    when affiliate_source_type_value = 'plan' then coalesce(
      public.safe_uuid(new.raw_user_meta_data->>'affiliate_source_plan_id'),
      public.safe_uuid(new.raw_user_meta_data->>'affiliate_source_pack_id')
    )
    else null
  end;

  if jsonb_typeof(author_profile_payload->'genres') = 'array' then
    author_genres_value := array(
      select jsonb_array_elements_text(author_profile_payload->'genres')
    );
  end if;

  insert into public.profiles (
    id,
    email,
    name,
    role,
    first_name,
    last_name,
    phone,
    country,
    city,
    preferred_language,
    favorite_categories,
    marketing_opt_in,
    referred_by_affiliate_code,
    affiliate_source_type,
    affiliate_source_book_id,
    affiliate_source_plan_id
  )
  values (
    new.id,
    new.email,
    coalesce(full_name, fallback_name),
    safe_role,
    first_name_value,
    last_name_value,
    nullif(coalesce(new.raw_user_meta_data->>'phone', ''), ''),
    nullif(coalesce(new.raw_user_meta_data->>'country', ''), ''),
    nullif(coalesce(new.raw_user_meta_data->>'city', ''), ''),
    coalesce(nullif(coalesce(new.raw_user_meta_data->>'preferred_language', ''), ''), 'fr'),
    favorite_categories_value,
    marketing_opt_in_value,
    referred_by_affiliate_code_value,
    affiliate_source_type_value,
    affiliate_source_book_id_value,
    affiliate_source_plan_id_value
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    country = excluded.country,
    city = excluded.city,
    preferred_language = excluded.preferred_language,
    favorite_categories = excluded.favorite_categories,
    marketing_opt_in = excluded.marketing_opt_in,
    referred_by_affiliate_code = coalesce(excluded.referred_by_affiliate_code, public.profiles.referred_by_affiliate_code),
    affiliate_source_type = coalesce(excluded.affiliate_source_type, public.profiles.affiliate_source_type),
    affiliate_source_book_id = coalesce(excluded.affiliate_source_book_id, public.profiles.affiliate_source_book_id),
    affiliate_source_plan_id = coalesce(excluded.affiliate_source_plan_id, public.profiles.affiliate_source_plan_id);

  if safe_role = 'author' then
    insert into public.author_profiles (
      id,
      display_name,
      bio,
      website,
      location,
      professional_headline,
      phone,
      genres,
      publishing_goals,
      social_links
    )
    values (
      new.id,
      coalesce(
        nullif(coalesce(author_profile_payload->>'display_name', ''), ''),
        coalesce(full_name, fallback_name, 'Auteur')
      ),
      nullif(coalesce(author_profile_payload->>'bio', ''), ''),
      nullif(coalesce(author_profile_payload->>'website', ''), ''),
      nullif(
        coalesce(
          author_profile_payload->>'location',
          trim(concat_ws(', ', nullif(coalesce(new.raw_user_meta_data->>'city', ''), ''), nullif(coalesce(new.raw_user_meta_data->>'country', ''), '')))
        ),
        ''
      ),
      nullif(coalesce(author_profile_payload->>'professional_headline', ''), ''),
      nullif(coalesce(author_profile_payload->>'phone', new.raw_user_meta_data->>'phone', ''), ''),
      author_genres_value,
      nullif(coalesce(author_profile_payload->>'publishing_goals', ''), ''),
      case
        when jsonb_typeof(author_profile_payload->'social_links') = 'object' then author_profile_payload->'social_links'
        else '{}'::jsonb
      end
    )
    on conflict (id) do update set
      display_name = excluded.display_name,
      bio = excluded.bio,
      website = excluded.website,
      location = excluded.location,
      professional_headline = excluded.professional_headline,
      phone = excluded.phone,
      genres = excluded.genres,
      publishing_goals = excluded.publishing_goals,
      social_links = excluded.social_links,
      updated_at = now();
  end if;

  if safe_role = 'reader' then
    perform public.ensure_reader_affiliate_profile(new.id);
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_order_items_automation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."handle_order_items_automation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_orders_payment_status_automation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."handle_orders_payment_status_automation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_ratings_automation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."handle_ratings_automation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_reader_affiliate_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.role = 'reader' then
    perform public.ensure_reader_affiliate_profile(new.id);
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_reader_affiliate_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_book_access"("p_book_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT

    public.is_admin()

    OR EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = p_book_id
        AND b.author_id = auth.uid()
    )

    OR EXISTS (
      SELECT 1
      FROM public.library l
      WHERE l.user_id = auth.uid()
        AND l.book_id = p_book_id
        AND l.status = 'active'
        AND (
          l.expires_at IS NULL
          OR l.expires_at > now()
        )
    )

    OR EXISTS (
      SELECT 1
      FROM public.user_subscriptions us
      JOIN public.subscription_plan_books spb
        ON spb.plan_id = us.plan_id
      WHERE us.user_id = auth.uid()
        AND spb.book_id = p_book_id
        AND us.status = 'active'
        AND (
          us.expires_at IS NULL
          OR us.expires_at > now()
        )
    );
$$;


ALTER FUNCTION "public"."has_book_access"("p_book_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hb_admin_transition_book"("p_book_id" "uuid", "p_action" "text", "p_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  previous public.books%ROWTYPE;
  current_book public.books%ROWTYPE;
  note_text text := nullif(btrim(coalesce(p_note, '')), '');
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Accès administrateur requis' USING ERRCODE = '42501';
  END IF;
  IF p_book_id IS NULL THEN
    RAISE EXCEPTION 'Livre invalide' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(p_note, '')) > 2000 THEN
    RAISE EXCEPTION 'Commentaire trop long (maximum 2000 caractères)' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO previous
  FROM public.books
  WHERE id = p_book_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Livre introuvable' USING ERRCODE = 'P0002';
  END IF;

  CASE p_action
    WHEN 'approve' THEN
      IF previous.review_status <> 'submitted' THEN
        RAISE EXCEPTION 'Seul un livre soumis peut être validé' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET review_status='approved',
        reviewed_by=auth.uid(), reviewed_at=now(), review_note=note_text
      WHERE id=p_book_id;

    WHEN 'request_changes' THEN
      IF previous.review_status <> 'submitted' OR note_text IS NULL THEN
        RAISE EXCEPTION 'Livre soumis et motif requis pour demander des corrections' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET status='draft', review_status='changes_requested',
        reviewed_by=auth.uid(), reviewed_at=now(), review_note=note_text, published_at=NULL
      WHERE id=p_book_id;

    WHEN 'reject' THEN
      IF previous.review_status <> 'submitted' OR note_text IS NULL THEN
        RAISE EXCEPTION 'Livre soumis et motif requis pour refuser' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET status='draft', review_status='rejected',
        reviewed_by=auth.uid(), reviewed_at=now(), review_note=note_text, published_at=NULL
      WHERE id=p_book_id;

    WHEN 'publish' THEN
      IF previous.review_status <> 'approved' OR previous.copyright_status <> 'clear' THEN
        RAISE EXCEPTION 'Validation éditoriale et droits de diffusion confirmés requis' USING ERRCODE = '22023';
      END IF;
      IF nullif(btrim(coalesce(previous.cover_url, '')), '') IS NULL
        OR nullif(btrim(coalesce(previous.file_url, '')), '') IS NULL THEN
        RAISE EXCEPTION 'La couverture et le fichier du livre sont requis pour publier' USING ERRCODE = '22023';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM storage.objects o
                     WHERE o.bucket_id = 'books' AND o.name=previous.cover_url)
        OR NOT EXISTS (SELECT 1 FROM storage.objects o
                       WHERE o.bucket_id = 'books' AND o.name=previous.file_url) THEN
        RAISE EXCEPTION 'Le fichier ou la couverture est absent du stockage privé' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET status='published', published_at=coalesce(published_at,now())
      WHERE id=p_book_id;

    WHEN 'coming_soon' THEN
      IF previous.review_status <> 'approved' OR previous.copyright_status <> 'clear'
        OR nullif(btrim(coalesce(previous.cover_url, '')), '') IS NULL THEN
        RAISE EXCEPTION 'Validation, droits confirmés et couverture requis' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET status='coming_soon' WHERE id=p_book_id;

    WHEN 'unpublish' THEN
      IF previous.status NOT IN ('published','coming_soon') THEN
        RAISE EXCEPTION 'Ce livre n’est pas publié' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET status='draft', published_at=NULL WHERE id=p_book_id;

    WHEN 'archive' THEN
      IF previous.status='archived' THEN
        RAISE EXCEPTION 'Ce livre est déjà archivé' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET status='archived' WHERE id=p_book_id;

    WHEN 'reset_draft' THEN
      IF previous.status='published' THEN
        RAISE EXCEPTION 'Dépubliez le livre avant de revenir au brouillon' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET status='draft', review_status='draft',
        reviewed_by=NULL,reviewed_at=NULL,review_note=NULL,published_at=NULL
      WHERE id=p_book_id;

    WHEN 'rights_clear' THEN
      IF note_text IS NULL THEN
        RAISE EXCEPTION 'Indiquez une référence ou justification des droits' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET copyright_status='clear', copyright_note=note_text,
        copyright_blocked_at=NULL,copyright_blocked_by=NULL WHERE id=p_book_id;

    WHEN 'rights_review' THEN
      UPDATE public.books SET status=CASE WHEN status IN ('published','coming_soon') THEN 'draft' ELSE status END,
        copyright_status='review', copyright_note=note_text,
        published_at=CASE WHEN status IN ('published','coming_soon') THEN NULL ELSE published_at END
      WHERE id=p_book_id;

    WHEN 'rights_block' THEN
      IF note_text IS NULL THEN
        RAISE EXCEPTION 'Le motif du blocage des droits est obligatoire' USING ERRCODE = '22023';
      END IF;
      UPDATE public.books SET status='draft',copyright_status='blocked',copyright_note=note_text,
        copyright_blocked_at=now(),copyright_blocked_by=auth.uid(),published_at=NULL
      WHERE id=p_book_id;

    ELSE
      RAISE EXCEPTION 'Action éditoriale inconnue' USING ERRCODE = '22023';
  END CASE;

  SELECT * INTO current_book FROM public.books WHERE id=p_book_id;
  INSERT INTO public.book_editorial_events
    (book_id,actor_id,event_type,from_stage,to_stage,notes,payload)
  VALUES (p_book_id,auth.uid(),p_action,
    previous.status||'/'||previous.review_status,
    current_book.status||'/'||current_book.review_status,
    note_text,
    pg_catalog.jsonb_build_object(
      'previous_copyright_status',previous.copyright_status,
      'copyright_status',current_book.copyright_status
    ));

  RETURN pg_catalog.jsonb_build_object(
    'id',current_book.id,
    'status',current_book.status,
    'review_status',current_book.review_status,
    'copyright_status',current_book.copyright_status
  );
END
$$;


ALTER FUNCTION "public"."hb_admin_transition_book"("p_book_id" "uuid", "p_action" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hb_book_workflow_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
 IF current_user NOT IN ('postgres','service_role') AND NOT public.is_current_user_admin() THEN
   IF TG_OP='INSERT' THEN
     NEW.status:='draft';
     NEW.review_status:='draft';
     NEW.copyright_status:='review';
     NEW.published_at:=NULL;
     NEW.reviewed_at:=NULL;
     NEW.reviewed_by:=NULL;
     NEW.views_count:=0;
     NEW.purchases_count:=0;
     NEW.rating_avg:=NULL;
     NEW.ratings_count:=0;
     NEW.bat_status:='pending';
     NEW.bat_approved_at:=NULL;
     NEW.bat_approved_by:=NULL;
     NEW.allow_download:=false;
     NEW.allow_print:=false;
     NEW.allow_copy:=false;
   ELSE
     NEW.author_id:=OLD.author_id;
     NEW.status:=OLD.status;
     NEW.review_status:=OLD.review_status;
     NEW.reviewed_at:=OLD.reviewed_at;
     NEW.reviewed_by:=OLD.reviewed_by;
     NEW.published_at:=OLD.published_at;
     NEW.copyright_status:=OLD.copyright_status;
     NEW.copyright_blocked_at:=OLD.copyright_blocked_at;
     NEW.copyright_blocked_by:=OLD.copyright_blocked_by;
     NEW.bat_status:=OLD.bat_status;
     NEW.bat_approved_at:=OLD.bat_approved_at;
     NEW.bat_approved_by:=OLD.bat_approved_by;
     NEW.views_count:=OLD.views_count;
     NEW.purchases_count:=OLD.purchases_count;
     NEW.ratings_count:=OLD.ratings_count;
     NEW.rating_avg:=OLD.rating_avg;
     NEW.admin_import_batch_id:=OLD.admin_import_batch_id;
     NEW.admin_import_item_id:=OLD.admin_import_item_id;
     NEW.admin_imported_by:=OLD.admin_imported_by;
     NEW.allow_download:=false;
     NEW.allow_print:=false;
     NEW.allow_copy:=false;
   END IF;
 END IF;
 RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."hb_book_workflow_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hb_guard_reader_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
 IF NOT public.is_current_user_admin() THEN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id <> (SELECT auth.uid()) THEN RAISE EXCEPTION 'Utilisateur invalide' USING ERRCODE='42501'; END IF;
    NEW.helpful_count := 0; NEW.is_hidden := false; NEW.hidden_at := NULL;
    NEW.hidden_by := NULL; NEW.moderation_note := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id <> (SELECT auth.uid()) OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.book_id IS DISTINCT FROM OLD.book_id
       OR NEW.helpful_count IS DISTINCT FROM OLD.helpful_count
       OR NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
       OR NEW.hidden_at IS DISTINCT FROM OLD.hidden_at
       OR NEW.hidden_by IS DISTINCT FROM OLD.hidden_by
       OR NEW.moderation_note IS DISTINCT FROM OLD.moderation_note THEN
      RAISE EXCEPTION 'Modification de modération interdite' USING ERRCODE='42501';
    END IF;
  END IF;
 END IF;
 IF NEW.review_text IS NOT NULL AND length(NEW.review_text)>5000 THEN
   RAISE EXCEPTION 'Commentaire trop long' USING ERRCODE='22023';
 END IF;
 NEW.updated_at := now();
 RETURN NEW;
END $$;


ALTER FUNCTION "public"."hb_guard_reader_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_current_user_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_current_user_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_affiliate_source_type"("p_value" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
declare
  normalized_value text := lower(trim(coalesce(p_value, '')));
begin
  if normalized_value = 'book' then
    return 'book';
  end if;

  if normalized_value in ('plan', 'pack', 'paquet', 'bundle') then
    return 'plan';
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."normalize_affiliate_source_type"("p_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owns_book"("p_book_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.books
    WHERE id = p_book_id
      AND author_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."owns_book"("p_book_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owns_order"("p_order_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = p_order_id
      AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."owns_order"("p_order_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_book_import_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "batch_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "source_checksum_sha256" "text" NOT NULL,
    "source_file_name" "text" NOT NULL,
    "source_file_size_bytes" bigint NOT NULL,
    "source_storage_path" "text" NOT NULL,
    "cover_storage_path" "text" NOT NULL,
    "status" "text" DEFAULT 'prepared'::"text" NOT NULL,
    "attempt_count" integer DEFAULT 1 NOT NULL,
    "rights_confirmed" boolean DEFAULT false NOT NULL,
    "book_id" "uuid",
    "error_message" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_book_import_items_attempt_count_check" CHECK (("attempt_count" >= 1)),
    CONSTRAINT "admin_book_import_items_source_checksum_sha256_check" CHECK (("source_checksum_sha256" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "admin_book_import_items_source_file_size_bytes_check" CHECK ((("source_file_size_bytes" > 0) AND ("source_file_size_bytes" <= 209715200))),
    CONSTRAINT "admin_book_import_items_status_check" CHECK (("status" = ANY (ARRAY['prepared'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."admin_book_import_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prepare_admin_book_import_item"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_source_file_name" "text", "p_source_file_size_bytes" bigint, "p_file_path" "text", "p_cover_path" "text") RETURNS "public"."admin_book_import_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $_$
declare
  v_admin_id uuid := auth.uid();
  v_existing public.admin_book_import_items%rowtype;
  v_batch_count integer;
  v_file_prefix text;
  v_expected_cover_path text;
begin
  if v_admin_id is null or not public.is_current_user_admin() then
    raise exception 'Administrator authentication is required.'
      using errcode = '42501';
  end if;

  if p_batch_id is null
     or p_item_id is null
     or p_checksum is null
     or p_checksum !~ '^[0-9a-f]{64}$'
     or nullif(trim(p_source_file_name), '') is null
     or lower(right(trim(p_source_file_name), 4)) <> '.pdf'
     or p_source_file_size_bytes is null
     or p_source_file_size_bytes <= 0
     or p_source_file_size_bytes > 209715200 then
    raise exception 'Invalid import item metadata.'
      using errcode = '22023';
  end if;

  v_file_prefix := format(
    'files/admin-imports/%s/%s/%s/%s-',
    v_admin_id,
    p_batch_id,
    p_item_id,
    p_checksum
  );
  v_expected_cover_path := format(
    'covers/admin-imports/%s/%s/%s/%s.webp',
    v_admin_id,
    p_batch_id,
    p_item_id,
    p_checksum
  );

  if left(p_file_path, char_length(v_file_prefix)) <> v_file_prefix
     or p_cover_path <> v_expected_cover_path then
    raise exception 'Storage paths do not belong to this import item.'
      using errcode = '42501';
  end if;

  select *
  into v_existing
  from public.admin_book_import_items i
  where i.created_by = v_admin_id
    and i.item_id = p_item_id
  for update;

  if found then
    if v_existing.batch_id is distinct from p_batch_id
       or v_existing.source_checksum_sha256 is distinct from p_checksum
       or v_existing.source_file_name is distinct from trim(p_source_file_name)
       or v_existing.source_file_size_bytes is distinct from p_source_file_size_bytes
       or v_existing.source_storage_path is distinct from p_file_path
       or v_existing.cover_storage_path is distinct from p_cover_path then
      raise exception 'This import item identifier is already bound to another PDF.'
        using errcode = '23505';
    end if;

    if v_existing.status <> 'completed' then
      update public.admin_book_import_items
      set
        status = 'prepared',
        attempt_count = attempt_count + 1,
        error_message = null
      where id = v_existing.id
      returning * into v_existing;
    end if;

    return v_existing;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_admin_id::text || ':' || p_batch_id::text, 0)
  );

  select count(*)::integer
  into v_batch_count
  from public.admin_book_import_items i
  where i.created_by = v_admin_id
    and i.batch_id = p_batch_id;

  if v_batch_count >= 20 then
    raise exception 'An import batch cannot contain more than 20 books.'
      using errcode = '22023';
  end if;

  insert into public.admin_book_import_items (
    batch_id,
    item_id,
    created_by,
    source_checksum_sha256,
    source_file_name,
    source_file_size_bytes,
    source_storage_path,
    cover_storage_path
  )
  values (
    p_batch_id,
    p_item_id,
    v_admin_id,
    p_checksum,
    trim(p_source_file_name),
    p_source_file_size_bytes,
    p_file_path,
    p_cover_path
  )
  returning * into v_existing;

  return v_existing;
end;
$_$;


ALTER FUNCTION "public"."prepare_admin_book_import_item"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_source_file_name" "text", "p_source_file_size_bytes" bigint, "p_file_path" "text", "p_cover_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prepare_user_subscription_affiliate_commission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  referral_user_id uuid;
  referral_code text;
  referral_source_type text;
  referral_source_book_id uuid;
  referral_source_plan_id uuid;
  resolved_affiliate_user_id uuid;
  affiliate_profile record;
  plan_monthly_price numeric(10,2) := 0;
begin
  new.affiliate_commission_rate := coalesce(new.affiliate_commission_rate, 0.0200);

  select
    p.referred_by_affiliate_user_id,
    upper(nullif(trim(coalesce(p.referred_by_affiliate_code, '')), '')),
    public.normalize_affiliate_source_type(p.affiliate_source_type),
    p.affiliate_source_book_id,
    p.affiliate_source_plan_id
  into
    referral_user_id,
    referral_code,
    referral_source_type,
    referral_source_book_id,
    referral_source_plan_id
  from public.profiles p
  where p.id = new.user_id;

  if referral_user_id is null and referral_code is not null then
    select rap.user_id
    into resolved_affiliate_user_id
    from public.reader_affiliate_profiles rap
    where rap.affiliate_code = referral_code
      and rap.is_active = true
    limit 1;

    referral_user_id := resolved_affiliate_user_id;
  end if;

  if referral_user_id is null or referral_user_id = new.user_id then
    new.affiliate_user_id := null;
    new.affiliate_code_used := null;
    new.affiliate_source_type := null;
    new.affiliate_source_book_id := null;
    new.affiliate_source_plan_id := null;
    new.affiliate_commission_amount := null;
    return new;
  end if;

  perform public.ensure_reader_affiliate_profile(referral_user_id);

  select *
  into affiliate_profile
  from public.reader_affiliate_profiles rap
  where rap.user_id = referral_user_id
    and rap.is_active = true
  limit 1;

  if not found then
    new.affiliate_user_id := null;
    new.affiliate_code_used := null;
    new.affiliate_source_type := null;
    new.affiliate_source_book_id := null;
    new.affiliate_source_plan_id := null;
    new.affiliate_commission_amount := null;
    return new;
  end if;

  select coalesce(monthly_price, 0)
  into plan_monthly_price
  from public.subscription_plans
  where id = new.plan_id;

  if not found then
    plan_monthly_price := 0;
  end if;

  new.affiliate_user_id := referral_user_id;
  new.affiliate_code_used := referral_code;
  new.affiliate_source_type := referral_source_type;
  new.affiliate_source_book_id := case when referral_source_type = 'book' then referral_source_book_id else null end;
  new.affiliate_source_plan_id := case when referral_source_type = 'plan' then referral_source_plan_id else null end;
  new.affiliate_commission_rate := coalesce(affiliate_profile.commission_rate, new.affiliate_commission_rate, 0.0200);
  new.affiliate_commission_amount := round(plan_monthly_price::numeric * new.affiliate_commission_rate, 2);

  return new;
end;
$$;


ALTER FUNCTION "public"."prepare_user_subscription_affiliate_commission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_admin_book_import_item_identity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if new.id is distinct from old.id
     or new.batch_id is distinct from old.batch_id
     or new.item_id is distinct from old.item_id
     or new.created_by is distinct from old.created_by
     or new.source_checksum_sha256 is distinct from old.source_checksum_sha256
     or new.source_file_name is distinct from old.source_file_name
     or new.source_file_size_bytes is distinct from old.source_file_size_bytes
     or new.source_storage_path is distinct from old.source_storage_path
     or new.cover_storage_path is distinct from old.cover_storage_path
     or new.created_at is distinct from old.created_at then
    raise exception 'Import item identity fields are immutable.'
      using errcode = '42501';
  end if;

  if old.book_id is not null
     and new.book_id is not null
     and new.book_id is distinct from old.book_id then
    raise exception 'An import item cannot be attached to another book.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_admin_book_import_item_identity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_book_derived_stats"("p_book_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.refresh_book_purchases_stats(p_book_id);
  perform public.refresh_book_rating_stats(p_book_id);
  perform public.refresh_book_views_stats(p_book_id);
end;
$$;


ALTER FUNCTION "public"."refresh_book_derived_stats"("p_book_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_book_purchases_stats"("p_book_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

  perform set_config('holistique.book_stats_refresh', 'on', true);
  update public.books
  set purchases_count = coalesce(v_paid_purchases, 0)
  where id = p_book_id;
  perform set_config('holistique.book_stats_refresh', 'off', true);
end;
$$;


ALTER FUNCTION "public"."refresh_book_purchases_stats"("p_book_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_book_rating_stats"("p_book_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

  perform set_config('holistique.book_stats_refresh', 'on', true);
  update public.books
  set
    ratings_count = coalesce(v_ratings_count, 0),
    rating_avg = v_rating_avg
  where id = p_book_id;
  perform set_config('holistique.book_stats_refresh', 'off', true);
end;
$$;


ALTER FUNCTION "public"."refresh_book_rating_stats"("p_book_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_book_views_stats"("p_book_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

  perform set_config('holistique.book_stats_refresh', 'on', true);
  update public.books
  set views_count = coalesce(v_detail_views, 0)
  where id = p_book_id;
  perform set_config('holistique.book_stats_refresh', 'off', true);
end;
$$;


ALTER FUNCTION "public"."refresh_book_views_stats"("p_book_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_profile_affiliate_referral"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  normalized_code text;
  resolved_affiliate_user_id uuid;
  normalized_source_type text;
begin
  normalized_code := upper(nullif(trim(coalesce(new.referred_by_affiliate_code, '')), ''));
  normalized_source_type := public.normalize_affiliate_source_type(new.affiliate_source_type);

  new.referred_by_affiliate_code := normalized_code;
  new.affiliate_source_type := normalized_source_type;

  if normalized_source_type = 'book' then
    new.affiliate_source_plan_id := null;
  elsif normalized_source_type = 'plan' then
    new.affiliate_source_book_id := null;
  else
    new.affiliate_source_book_id := null;
    new.affiliate_source_plan_id := null;
  end if;

  if normalized_code is not null then
    select rap.user_id
    into resolved_affiliate_user_id
    from public.reader_affiliate_profiles rap
    where rap.affiliate_code = normalized_code
      and rap.is_active = true
    limit 1;
  end if;

  if resolved_affiliate_user_id is not null and resolved_affiliate_user_id <> new.id then
    new.referred_by_affiliate_user_id := resolved_affiliate_user_id;
  else
    new.referred_by_affiliate_user_id := null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."resolve_profile_affiliate_referral"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_uuid"("p_value" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
begin
  if p_value is null or btrim(p_value) = '' then
    return null;
  end if;

  return btrim(p_value)::uuid;
exception
  when others then
    return null;
end;
$$;


ALTER FUNCTION "public"."safe_uuid"("p_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_book_for_review"("p_book_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN

    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentification requise';
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM public.books
        WHERE id = p_book_id
          AND author_id = auth.uid()
    ) THEN

        RAISE EXCEPTION
            'Vous n’êtes pas propriétaire de ce livre';

    END IF;


    UPDATE public.books

    SET
        review_status = 'submitted',
        submitted_at = now(),
        updated_at = now()

    WHERE id = p_book_id
      AND review_status IN (
          'draft',
          'changes_requested',
          'rejected'
      );


    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Le livre ne peut pas être soumis dans son état actuel';
    END IF;

END;
$$;


ALTER FUNCTION "public"."submit_book_for_review"("p_book_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_library_access_for_order"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.role() <> 'service_role' and not public.is_current_user_admin() then
    raise exception 'Not authorized to synchronize library access for orders.';
  end if;

  perform public._sync_library_access_for_order(p_order_id);
end;
$$;


ALTER FUNCTION "public"."sync_library_access_for_order"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_book_engagement"("p_book_id" "uuid", "p_event_type" "text", "p_source" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."track_book_engagement"("p_book_id" "uuid", "p_event_type" "text", "p_source" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_book_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.books
  set rating_avg = (select avg(rating) from public.ratings where book_id = new.book_id),
      ratings_count = (select count(*) from public.ratings where book_id = new.book_id)
  where id = new.book_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."update_book_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_access_to_book"("p_user_id" "uuid", "p_book_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
  )
  into has_access;

  return coalesce(has_access, false);
end;
$$;


ALTER FUNCTION "public"."user_has_access_to_book"("p_user_id" "uuid", "p_book_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_asset_relation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN

    IF NEW.asset_id IS NULL THEN
        RETURN NEW;
    END IF;


    IF NOT EXISTS (

        SELECT 1

        FROM public.book_assets ba

        WHERE ba.id = NEW.asset_id
          AND ba.book_id = NEW.book_id

          AND (
              NEW.format_id IS NULL
              OR ba.format_id IS NULL
              OR ba.format_id = NEW.format_id
          )

    ) THEN

        RAISE EXCEPTION
            'Asset incompatible avec le livre ou le format';

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."validate_asset_relation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_book_format_relation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN

    IF NEW.format_id IS NULL THEN
        RETURN NEW;
    END IF;


    IF NOT EXISTS (

        SELECT 1

        FROM public.book_formats bf

        WHERE bf.id = NEW.format_id
          AND bf.book_id = NEW.book_id

    ) THEN

        RAISE EXCEPTION
            'Le format % ne correspond pas au livre %',
            NEW.format_id,
            NEW.book_id;

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."validate_book_format_relation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_download_license"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN

    IF NEW.license_id IS NULL THEN
        RETURN NEW;
    END IF;


    IF NOT EXISTS (

        SELECT 1

        FROM public.offline_reading_licenses l

        WHERE l.id = NEW.license_id
          AND l.user_id = NEW.user_id
          AND l.device_id = NEW.device_id
          AND l.book_id = NEW.book_id
          AND l.status = 'active'
          AND l.valid_until > now()

    ) THEN

        RAISE EXCEPTION
            'Licence offline invalide ou expirée';

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."validate_download_license"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_order_item_format"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_format text;
BEGIN

  IF NEW.format_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT format
  INTO v_format
  FROM public.book_formats
  WHERE id = NEW.format_id
    AND book_id = NEW.book_id;

  IF v_format IS NULL THEN
    RAISE EXCEPTION
      'Le format % ne correspond pas au livre %',
      NEW.format_id,
      NEW.book_id;
  END IF;

  NEW.book_format := v_format;

  RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."validate_order_item_format"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_payment_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE

    v_user_id uuid;
    v_total numeric;
    v_currency text;

BEGIN

    IF NEW.order_id IS NULL THEN
        RETURN NEW;
    END IF;


    SELECT
        user_id,
        total_price,
        currency_code

    INTO
        v_user_id,
        v_total,
        v_currency

    FROM public.orders

    WHERE id = NEW.order_id;


    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Commande inexistante';
    END IF;


    IF NEW.user_id <> v_user_id THEN

        RAISE EXCEPTION
            'Utilisateur du paiement différent du propriétaire de la commande';

    END IF;


    IF NEW.currency_code <> v_currency THEN

        RAISE EXCEPTION
            'Devise du paiement incompatible avec la commande';

    END IF;


    IF NEW.amount <> v_total THEN

        RAISE EXCEPTION
            'Montant du paiement incompatible avec le total de la commande';

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."validate_payment_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_withdrawal_account"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN

    IF NEW.payout_account_id IS NULL THEN
        RETURN NEW;
    END IF;


    IF NOT EXISTS (

        SELECT 1

        FROM public.affiliate_payout_accounts a

        WHERE a.id = NEW.payout_account_id
          AND a.user_id = NEW.user_id
          AND a.is_verified = true

    ) THEN

        RAISE EXCEPTION
            'Compte de paiement non vérifié ou incompatible';

    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION "public"."validate_withdrawal_account"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."academic_taxonomies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "audience" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "code" "text",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_official" boolean DEFAULT false NOT NULL,
    "source_url" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "academic_taxonomies_audience_check" CHECK (("audience" = ANY (ARRAY['school'::"text", 'university'::"text"])))
);


ALTER TABLE "public"."academic_taxonomies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "creative_id" "uuid" NOT NULL,
    "placement_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "weight" integer DEFAULT 1 NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ad_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "advertiser_name" "text" NOT NULL,
    "advertiser_email" "text",
    "name" "text" NOT NULL,
    "objective" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "channels" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "budget" numeric(12,2) DEFAULT 0 NOT NULL,
    "spent" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "targeting" "jsonb",
    "frequency_cap" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ad_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_creatives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "creative_type" "text",
    "headline" "text",
    "body" "text",
    "asset_url" "text",
    "click_url" "text",
    "cta_label" "text",
    "alt_text" "text",
    "metadata" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ad_creatives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid",
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "session_hash" "text",
    "context" "jsonb",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ad_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_placements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "channel" "text",
    "surface" "text",
    "position" "text",
    "allowed_creative_types" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "width" integer,
    "height" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ad_placements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_book_import_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'prepared'::"text" NOT NULL,
    "total_items" integer DEFAULT 0 NOT NULL,
    "completed_items" integer DEFAULT 0 NOT NULL,
    "failed_items" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "admin_book_import_batches_completed_items_check" CHECK (("completed_items" >= 0)),
    CONSTRAINT "admin_book_import_batches_failed_items_check" CHECK (("failed_items" >= 0)),
    CONSTRAINT "admin_book_import_batches_status_check" CHECK (("status" = ANY (ARRAY['prepared'::"text", 'processing'::"text", 'completed'::"text", 'partial'::"text", 'failed'::"text"]))),
    CONSTRAINT "admin_book_import_batches_total_items_check" CHECK (("total_items" >= 0))
);


ALTER TABLE "public"."admin_book_import_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliate_order_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "affiliate_user_id" "uuid" NOT NULL,
    "referred_user_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "purchased_book_id" "uuid" NOT NULL,
    "referral_source_type" "text",
    "referral_source_book_id" "uuid",
    "referral_source_plan_id" "uuid",
    "commission_rate" numeric(5,4) DEFAULT 0.0200 NOT NULL,
    "order_amount" numeric(10,2) NOT NULL,
    "commission_amount" numeric(10,2) NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'credited'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "affiliate_order_transactions_commission_amount_check" CHECK (("commission_amount" >= (0)::numeric)),
    CONSTRAINT "affiliate_order_transactions_commission_rate_check" CHECK ((("commission_rate" >= (0)::numeric) AND ("commission_rate" <= (1)::numeric))),
    CONSTRAINT "affiliate_order_transactions_order_amount_check" CHECK (("order_amount" >= (0)::numeric)),
    CONSTRAINT "affiliate_order_transactions_referral_source_type_check" CHECK ((("referral_source_type" = ANY (ARRAY['book'::"text", 'plan'::"text"])) OR ("referral_source_type" IS NULL))),
    CONSTRAINT "affiliate_order_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'credited'::"text", 'reversed'::"text"])))
);


ALTER TABLE "public"."affiliate_order_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliate_payout_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "account_name" "text",
    "account_number" "text" NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."affiliate_payout_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliate_wallet_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "affiliate_user_id" "uuid" NOT NULL,
    "referred_user_id" "uuid" NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_book_id" "uuid",
    "source_plan_id" "uuid",
    "commission_rate" numeric(5,4) DEFAULT 0.0200 NOT NULL,
    "subscription_amount" numeric(10,2) NOT NULL,
    "commission_amount" numeric(10,2) NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'credited'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "affiliate_wallet_transactions_commission_amount_check" CHECK (("commission_amount" >= (0)::numeric)),
    CONSTRAINT "affiliate_wallet_transactions_commission_rate_check" CHECK ((("commission_rate" >= (0)::numeric) AND ("commission_rate" <= (1)::numeric))),
    CONSTRAINT "affiliate_wallet_transactions_source_type_check" CHECK (("source_type" = ANY (ARRAY['book'::"text", 'plan'::"text"]))),
    CONSTRAINT "affiliate_wallet_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'credited'::"text", 'reversed'::"text"]))),
    CONSTRAINT "affiliate_wallet_transactions_subscription_amount_check" CHECK (("subscription_amount" >= (0)::numeric))
);


ALTER TABLE "public"."affiliate_wallet_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliate_withdrawals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payout_account_id" "uuid",
    "amount" numeric(14,2) NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "provider_reference" "text",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approved_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "affiliate_withdrawals_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "affiliate_withdrawals_dates_check" CHECK (((("approved_at" IS NULL) OR ("approved_at" >= "requested_at")) AND (("paid_at" IS NULL) OR (("approved_at" IS NOT NULL) AND ("paid_at" >= "approved_at"))))),
    CONSTRAINT "affiliate_withdrawals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'processing'::"text", 'paid'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."affiliate_withdrawals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."author_payout_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "method" "text" NOT NULL,
    "provider" "text",
    "country_code" "text" DEFAULT 'CD'::"text" NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "account_name" "text" NOT NULL,
    "account_identifier" "text",
    "is_default" boolean DEFAULT false NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."author_payout_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."author_payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payout_account_id" "uuid",
    "amount" numeric(14,2) NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "provider_reference" "text",
    "notes" "text",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "author_payouts_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."author_payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."author_profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "avatar_url" "text",
    "bio" "text",
    "website" "text",
    "location" "text",
    "social_links" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "professional_headline" "text",
    "phone" "text",
    "genres" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "publishing_goals" "text",
    "favorite_book" "text",
    "favorite_author" "text",
    "favorite_character" "text",
    "press_mentions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "country_code" "text",
    "catalog_origin" "text" DEFAULT 'platform'::"text" NOT NULL,
    "rights_status" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "is_reference_profile" boolean DEFAULT false NOT NULL,
    "reference_source_url" "text",
    "rights_notes" "text",
    CONSTRAINT "author_profiles_press_mentions_array" CHECK (("jsonb_typeof"("press_mentions") = 'array'::"text"))
);


ALTER TABLE "public"."author_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."author_profiles"."press_mentions" IS 'Liste JSON publique de références presse, sous la forme [{"title":"...","url":"..."}].';



CREATE TABLE IF NOT EXISTS "public"."author_royalty_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "pending_balance" numeric(14,2) DEFAULT 0 NOT NULL,
    "available_balance" numeric(14,2) DEFAULT 0 NOT NULL,
    "lifetime_earnings" numeric(14,2) DEFAULT 0 NOT NULL,
    "lifetime_paid" numeric(14,2) DEFAULT 0 NOT NULL,
    "minimum_payout" numeric(14,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."author_royalty_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."author_royalty_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid",
    "order_id" "uuid",
    "order_item_id" "uuid",
    "source" "text",
    "gross_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "printing_cost" numeric(14,2) DEFAULT 0 NOT NULL,
    "platform_fee" numeric(14,2) DEFAULT 0 NOT NULL,
    "tax_withholding" numeric(14,2) DEFAULT 0 NOT NULL,
    "royalty_rate" numeric(5,2),
    "net_royalty" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payable_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."author_royalty_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text" NOT NULL,
    "tag" "text" NOT NULL,
    "author" "text" NOT NULL,
    "read_time" "text" NOT NULL,
    "cover_label" "text" DEFAULT 'Magazine editorial'::"text" NOT NULL,
    "cover_image_url" "text",
    "cover_image_alt" "text",
    "published_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "content_blocks" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blog_posts_content_blocks_is_array" CHECK (("jsonb_typeof"("content_blocks") = 'array'::"text"))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_academic_taxonomy" (
    "book_id" "uuid" NOT NULL,
    "academic_taxonomy_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_academic_taxonomy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_assets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "format_id" "uuid",
    "asset_type" "text" NOT NULL,
    "delivery_format" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "mime_type" "text",
    "file_size_bytes" bigint,
    "checksum" "text",
    "is_encrypted" boolean DEFAULT false NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "encryption_scheme" "text" DEFAULT 'none'::"text" NOT NULL,
    "encryption_key_version" integer,
    CONSTRAINT "book_assets_asset_type_check" CHECK (("asset_type" = ANY (ARRAY['full_book'::"text", 'sample'::"text", 'cover'::"text", 'thumbnail'::"text"]))),
    CONSTRAINT "book_assets_delivery_format_check" CHECK (("delivery_format" = ANY (ARRAY['epub'::"text", 'pdf'::"text", 'mp3'::"text", 'm4b'::"text", 'jpg'::"text", 'png'::"text", 'webp'::"text"]))),
    CONSTRAINT "book_assets_encryption_scheme_check" CHECK (("encryption_scheme" = ANY (ARRAY['none'::"text", 'aes_256_gcm'::"text"]))),
    CONSTRAINT "book_assets_file_size_bytes_check" CHECK ((("file_size_bytes" IS NULL) OR ("file_size_bytes" >= 0)))
);


ALTER TABLE "public"."book_assets" OWNER TO "postgres";


COMMENT ON TABLE "public"."book_assets" IS 'Assets techniques livres/extraits/couvertures distribues au web reader et au mobile.';



CREATE TABLE IF NOT EXISTS "public"."book_authors" (
    "book_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "author_role" "text" DEFAULT 'author'::"text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "book_authors_author_role_check" CHECK (("author_role" = ANY (ARRAY['author'::"text", 'co_author'::"text", 'editor'::"text", 'translator'::"text", 'preface'::"text"])))
);


ALTER TABLE "public"."book_authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_categories" (
    "book_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_distribution_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "primary_market" "text" DEFAULT 'CD'::"text" NOT NULL,
    "territory_mode" "text" DEFAULT 'worldwide'::"text" NOT NULL,
    "territories" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "sales_channels" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "local_currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "royalty_rate" numeric(5,2),
    "preorder_enabled" boolean DEFAULT false NOT NULL,
    "launch_date" "date",
    "print_on_demand_enabled" boolean DEFAULT false NOT NULL,
    "local_print_enabled" boolean DEFAULT false NOT NULL,
    "institutional_sales_enabled" boolean DEFAULT false NOT NULL,
    "bookstore_distribution_enabled" boolean DEFAULT false NOT NULL,
    "distribution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_distribution_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_downloads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "format_id" "uuid",
    "asset_id" "uuid",
    "license_id" "uuid",
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "bytes_downloaded" bigint DEFAULT 0 NOT NULL,
    "file_size_bytes" bigint,
    "checksum_verified" boolean DEFAULT false NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "last_synced_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "book_downloads_bytes_check" CHECK ((("file_size_bytes" IS NULL) OR ("bytes_downloaded" <= "file_size_bytes"))),
    CONSTRAINT "book_downloads_bytes_downloaded_check" CHECK (("bytes_downloaded" >= 0)),
    CONSTRAINT "book_downloads_file_size_bytes_check" CHECK ((("file_size_bytes" IS NULL) OR ("file_size_bytes" >= 0))),
    CONSTRAINT "book_downloads_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "book_downloads_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'downloading'::"text", 'paused'::"text", 'completed'::"text", 'failed'::"text", 'deleted'::"text"])))
);


ALTER TABLE "public"."book_downloads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_editorial_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "event_type" "text" NOT NULL,
    "from_stage" "text",
    "to_stage" "text",
    "notes" "text",
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_editorial_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_engagement_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "source" "text",
    "user_role" "text",
    "is_authenticated" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "book_engagement_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['detail_view'::"text", 'reader_open'::"text", 'file_access'::"text"]))),
    CONSTRAINT "book_engagement_events_user_role_check" CHECK (("user_role" = ANY (ARRAY['reader'::"text", 'author'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."book_engagement_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_favorites" (
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_formats" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "format" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "file_url" "text",
    "stock_quantity" integer,
    "file_size_mb" integer,
    "downloadable" boolean DEFAULT false NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "printing_cost" numeric(10,2),
    CONSTRAINT "book_formats_file_size_check" CHECK ((("file_size_mb" IS NULL) OR ("file_size_mb" >= 0))),
    CONSTRAINT "book_formats_format_check" CHECK (("format" = ANY (ARRAY['holistique_store'::"text", 'ebook'::"text", 'paperback'::"text", 'pocket'::"text", 'hardcover'::"text", 'audiobook'::"text"]))),
    CONSTRAINT "book_formats_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "book_formats_printing_cost_check" CHECK ((("printing_cost" IS NULL) OR ("printing_cost" >= (0)::numeric))),
    CONSTRAINT "book_formats_stock_check" CHECK ((("stock_quantity" IS NULL) OR ("stock_quantity" >= 0)))
);


ALTER TABLE "public"."book_formats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_manuscript_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "version_number" integer DEFAULT 1 NOT NULL,
    "file_path" "text" NOT NULL,
    "file_format" "text",
    "file_size" bigint,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "change_summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_manuscript_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_market_prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "country_code" "text" NOT NULL,
    "currency_code" "text" NOT NULL,
    "list_price" numeric(14,2) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "book_market_prices_list_price_check" CHECK (("list_price" >= (0)::numeric))
);


ALTER TABLE "public"."book_market_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_reader_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "device_fingerprint" "text",
    "client_type" "text" DEFAULT 'web'::"text" NOT NULL,
    "ip_hash" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "last_used_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."book_reader_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "author_id" "uuid",
    "cover_url" "text",
    "file_url" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subtitle" "text",
    "co_authors" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "isbn" "text",
    "language" "text" DEFAULT 'fr'::"text" NOT NULL,
    "publisher" "text",
    "publication_date" "date",
    "page_count" integer,
    "categories" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "age_rating" "text",
    "edition" "text",
    "series_name" "text",
    "series_position" integer,
    "file_format" "text",
    "file_size" integer,
    "sample_url" "text",
    "sample_pages" integer,
    "cover_thumbnail_url" "text",
    "cover_alt_text" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    "views_count" integer DEFAULT 0 NOT NULL,
    "purchases_count" integer DEFAULT 0 NOT NULL,
    "rating_avg" numeric(2,1),
    "ratings_count" integer DEFAULT 0 NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "is_single_sale_enabled" boolean DEFAULT true NOT NULL,
    "is_subscription_available" boolean DEFAULT false NOT NULL,
    "review_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "submitted_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "review_note" "text",
    "author_display_name" "text",
    "copyright_status" "text" DEFAULT 'review'::"text" NOT NULL,
    "copyright_note" "text",
    "copyright_blocked_at" timestamp with time zone,
    "copyright_blocked_by" "uuid",
    "admin_import_batch_id" "uuid",
    "admin_import_item_id" "uuid",
    "admin_import_checksum" "text",
    "admin_import_original_file_name" "text",
    "admin_imported_by" "uuid",
    "admin_imported_at" timestamp with time zone,
    "authorship_type" "text" DEFAULT 'named'::"text" NOT NULL,
    "author_credit" "text",
    "editorial_pole" "text" DEFAULT 'general'::"text" NOT NULL,
    "work_type" "text" DEFAULT 'book'::"text" NOT NULL,
    "editorial_stage" "text" DEFAULT 'intake'::"text" NOT NULL,
    "spiritual_metadata" "jsonb",
    "ingestion_metadata" "jsonb",
    "cover_source" "text",
    "bat_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "bat_approved_at" timestamp with time zone,
    "bat_approved_by" "uuid",
    "publishing_house_id" "uuid",
    "imprint_id" "uuid",
    "reading_access_mode" "text" DEFAULT 'platform_only'::"text" NOT NULL,
    "can_read_on_platform" boolean DEFAULT true NOT NULL,
    "allow_download" boolean DEFAULT false NOT NULL,
    "allow_print" boolean DEFAULT false NOT NULL,
    "allow_copy" boolean DEFAULT false NOT NULL,
    "reader_watermark_enabled" boolean DEFAULT true NOT NULL,
    "rights_agreement_reference" "text",
    "reader_rights_note" "text",
    "writing_status" "text",
    "target_word_count" integer,
    "current_word_count" integer,
    "next_author_action" "text",
    "editorial_deadline" "date",
    "clicks_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "books_admin_import_checksum_check" CHECK ((("admin_import_checksum" IS NULL) OR ("admin_import_checksum" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "books_admin_import_metadata_check" CHECK (((("admin_import_batch_id" IS NULL) AND ("admin_import_item_id" IS NULL) AND ("admin_import_checksum" IS NULL) AND ("admin_import_original_file_name" IS NULL) AND ("admin_imported_by" IS NULL) AND ("admin_imported_at" IS NULL)) OR (("admin_import_batch_id" IS NOT NULL) AND ("admin_import_item_id" IS NOT NULL) AND ("admin_import_checksum" IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM "admin_import_original_file_name"), ''::"text") IS NOT NULL) AND ("admin_imported_by" IS NOT NULL) AND ("admin_imported_at" IS NOT NULL)))),
    CONSTRAINT "books_copyright_status_check" CHECK (("copyright_status" = ANY (ARRAY['clear'::"text", 'review'::"text", 'blocked'::"text"]))),
    CONSTRAINT "books_page_count_check" CHECK ((("page_count" IS NULL) OR ("page_count" > 0))),
    CONSTRAINT "books_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "books_purchases_count_check" CHECK (("purchases_count" >= 0)),
    CONSTRAINT "books_rating_avg_check" CHECK ((("rating_avg" IS NULL) OR (("rating_avg" >= (1)::numeric) AND ("rating_avg" <= (5)::numeric)))),
    CONSTRAINT "books_ratings_count_check" CHECK (("ratings_count" >= 0)),
    CONSTRAINT "books_review_status_check" CHECK (("review_status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'approved'::"text", 'rejected'::"text", 'changes_requested'::"text"]))),
    CONSTRAINT "books_sample_pages_check" CHECK ((("sample_pages" IS NULL) OR ("sample_pages" >= 0))),
    CONSTRAINT "books_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text", 'coming_soon'::"text"]))),
    CONSTRAINT "books_views_count_check" CHECK (("views_count" >= 0))
);


ALTER TABLE "public"."books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "public"."citext" NOT NULL,
    "slug" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_id" "uuid",
    "description" "text",
    "icon" "text",
    "color" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "content_types" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."editorial_training_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "country" "text",
    "city" "text",
    "organization_name" "text",
    "profile_type" "text" NOT NULL,
    "experience_level" "text" NOT NULL,
    "project_stage" "text" NOT NULL,
    "preferred_format" "text" NOT NULL,
    "objectives" "text" NOT NULL,
    "message" "text",
    "consent_to_contact" boolean DEFAULT true NOT NULL,
    "source" "text" DEFAULT 'formation-editoriale'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "editorial_training_requests_experience_level_check" CHECK (("experience_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "editorial_training_requests_preferred_format_check" CHECK (("preferred_format" = ANY (ARRAY['online'::"text", 'onsite'::"text", 'hybrid'::"text"]))),
    CONSTRAINT "editorial_training_requests_profile_type_check" CHECK (("profile_type" = ANY (ARRAY['author'::"text", 'aspiring_editor'::"text", 'publisher'::"text", 'entrepreneur'::"text", 'student'::"text", 'other'::"text"]))),
    CONSTRAINT "editorial_training_requests_project_stage_check" CHECK (("project_stage" = ANY (ARRAY['idea'::"text", 'drafting'::"text", 'manuscript_ready'::"text", 'existing_catalog'::"text"])))
);


ALTER TABLE "public"."editorial_training_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flash_sale_configs" (
    "scope" "text" DEFAULT 'global'::"text" NOT NULL,
    "selected_book_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "discount_percentage" integer DEFAULT 20 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "flash_sale_configs_discount_percentage_check" CHECK ((("discount_percentage" >= 0) AND ("discount_percentage" <= 90))),
    CONSTRAINT "flash_sale_configs_scope_check" CHECK (("scope" = 'global'::"text"))
);


ALTER TABLE "public"."flash_sale_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."highlights" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "page" integer,
    "text" "text",
    "note" "text",
    "color" "text" DEFAULT 'yellow'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locator" "text",
    "locator_type" "text",
    "selected_text" "text",
    "chapter_label" "text",
    "progress_percent" numeric(5,2),
    "device_record_id" "uuid",
    "client_highlight_id" "text",
    CONSTRAINT "highlights_locator_type_check" CHECK (("locator_type" = ANY (ARRAY['epub_cfi'::"text", 'pdf_page'::"text", 'pdf_locator'::"text", 'custom'::"text"]))),
    CONSTRAINT "highlights_page_check" CHECK ((("page" IS NULL) OR ("page" > 0))),
    CONSTRAINT "highlights_progress_percent_check" CHECK ((("progress_percent" IS NULL) OR (("progress_percent" >= (0)::numeric) AND ("progress_percent" <= (100)::numeric))))
);


ALTER TABLE "public"."highlights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."home_featured_configs" (
    "scope" "text" DEFAULT 'global'::"text" NOT NULL,
    "selected_book_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "home_featured_configs_scope_check" CHECK (("scope" = 'global'::"text"))
);


ALTER TABLE "public"."home_featured_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."library" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "purchased_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "access_type" "text" DEFAULT 'purchase'::"text",
    "subscription_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "granted_by_order_id" "uuid",
    "granted_by_plan_id" "uuid",
    "granted_by_format_id" "uuid",
    "expires_at" timestamp with time zone,
    "last_opened_at" timestamp with time zone,
    "last_synced_at" timestamp with time zone,
    CONSTRAINT "library_access_type_check" CHECK (("access_type" = ANY (ARRAY['purchase'::"text", 'subscription'::"text", 'free'::"text"]))),
    CONSTRAINT "library_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."library" OWNER TO "postgres";


COMMENT ON TABLE "public"."library" IS 'Entitlements utilisateur pour la lecture dans le web reader et l app mobile.';



CREATE TABLE IF NOT EXISTS "public"."media_chapters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "media_edition_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "title" "text" NOT NULL,
    "starts_at_second" integer,
    "ends_at_second" integer,
    "storage_path" "text",
    "streaming_url" "text",
    "is_preview" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."media_chapters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_editions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "media_type" "text" NOT NULL,
    "title" "text",
    "language" "text" DEFAULT 'fr'::"text" NOT NULL,
    "duration_seconds" integer,
    "narrator" "text",
    "presenter" "text",
    "provider" "text",
    "storage_path" "text",
    "streaming_url" "text",
    "preview_url" "text",
    "mime_type" "text",
    "file_size_bytes" bigint,
    "drm_scheme" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."media_editions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mobile_app_configs" (
    "scope" "text" DEFAULT 'global'::"text" NOT NULL,
    "app_name" "text" DEFAULT 'Holistique Stores'::"text" NOT NULL,
    "hero_title" "text" DEFAULT 'Telecharger Holistique Stores'::"text" NOT NULL,
    "hero_description" "text" DEFAULT 'Installez l application Android et activez 7 jours offerts sur tous les contenus numeriques, sans engagement.'::"text" NOT NULL,
    "android_cta_label" "text" DEFAULT 'Telecharger l APK'::"text" NOT NULL,
    "apk_path" "text",
    "apk_file_name" "text",
    "version_label" "text",
    "release_notes" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "trial_enabled" boolean DEFAULT true NOT NULL,
    "trial_days" integer DEFAULT 7 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "current_android_version_id" "uuid",
    CONSTRAINT "mobile_app_configs_scope_check" CHECK (("scope" = 'global'::"text")),
    CONSTRAINT "mobile_app_configs_trial_days_check" CHECK ((("trial_days" >= 1) AND ("trial_days" <= 30)))
);


ALTER TABLE "public"."mobile_app_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mobile_app_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform" "text" DEFAULT 'android'::"text" NOT NULL,
    "version_name" "text" NOT NULL,
    "version_code" integer NOT NULL,
    "minimum_supported_version_code" integer DEFAULT 1 NOT NULL,
    "package_name" "text",
    "storage_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text" DEFAULT 'application/vnd.android.package-archive'::"text" NOT NULL,
    "file_size_bytes" bigint,
    "checksum_sha256" "text",
    "release_notes" "text",
    "is_mandatory" boolean DEFAULT false NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "download_count" bigint DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mobile_app_versions_download_count_check" CHECK (("download_count" >= 0)),
    CONSTRAINT "mobile_app_versions_file_size_bytes_check" CHECK ((("file_size_bytes" IS NULL) OR ("file_size_bytes" >= 0))),
    CONSTRAINT "mobile_app_versions_minimum_check" CHECK (("minimum_supported_version_code" <= "version_code")),
    CONSTRAINT "mobile_app_versions_minimum_supported_version_code_check" CHECK (("minimum_supported_version_code" > 0)),
    CONSTRAINT "mobile_app_versions_platform_check" CHECK (("platform" = ANY (ARRAY['android'::"text", 'ios'::"text"]))),
    CONSTRAINT "mobile_app_versions_version_code_check" CHECK (("version_code" > 0))
);


ALTER TABLE "public"."mobile_app_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offline_reading_licenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "format_id" "uuid",
    "asset_id" "uuid",
    "license_token_hash" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valid_until" timestamp with time zone NOT NULL,
    "last_verified_at" timestamp with time zone,
    "max_offline_days" smallint DEFAULT 7 NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoke_reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "offline_license_validity_check" CHECK (("valid_until" > "issued_at")),
    CONSTRAINT "offline_reading_licenses_dates_check" CHECK (("valid_until" > "issued_at")),
    CONSTRAINT "offline_reading_licenses_max_offline_days_check" CHECK ((("max_offline_days" >= 1) AND ("max_offline_days" <= 30))),
    CONSTRAINT "offline_reading_licenses_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "offline_reading_licenses_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."offline_reading_licenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "book_format" "text" DEFAULT 'ebook'::"text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "format_id" "uuid",
    "original_price" numeric(12,2),
    "promotion_campaign_id" "uuid",
    CONSTRAINT "order_items_book_format_check" CHECK (("book_format" = ANY (ARRAY['holistique_store'::"text", 'ebook'::"text", 'paperback'::"text", 'pocket'::"text", 'hardcover'::"text", 'audiobook'::"text"]))),
    CONSTRAINT "order_items_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "payment_provider" "text",
    "payment_transaction_id" "text",
    "payment_channel" "text",
    "payment_provider_status" "text",
    "payment_verified_at" timestamp with time zone,
    "payment_metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "orders_total_price_check" CHECK (("total_price" >= (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "provider" "text" NOT NULL,
    "payment_channel" "text",
    "provider_reference" "text",
    "idempotency_key" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'created'::"text" NOT NULL,
    "request_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "response_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "verified_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_attempts_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "payment_attempts_request_payload_check" CHECK (("jsonb_typeof"("request_payload") = 'object'::"text")),
    CONSTRAINT "payment_attempts_response_payload_check" CHECK (("jsonb_typeof"("response_payload") = 'object'::"text")),
    CONSTRAINT "payment_attempts_status_check" CHECK (("status" = ANY (ARRAY['created'::"text", 'pending'::"text", 'processing'::"text", 'paid'::"text", 'failed'::"text", 'cancelled'::"text", 'expired'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payment_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "summary" "text",
    "before_state" "jsonb",
    "after_state" "jsonb",
    "context" "jsonb",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."platform_audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "role" "text" DEFAULT 'reader'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "country" "text",
    "city" "text",
    "preferred_language" "text" DEFAULT 'fr'::"text" NOT NULL,
    "favorite_categories" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "marketing_opt_in" boolean DEFAULT false NOT NULL,
    "referred_by_affiliate_user_id" "uuid",
    "referred_by_affiliate_code" "text",
    "affiliate_source_type" "text",
    "affiliate_source_book_id" "uuid",
    "affiliate_source_plan_id" "uuid",
    "staff_role" "text",
    "staff_permissions" "jsonb",
    "avatar_url" "text",
    CONSTRAINT "profiles_affiliate_source_type_check" CHECK ((("affiliate_source_type" = ANY (ARRAY['book'::"text", 'plan'::"text"])) OR ("affiliate_source_type" IS NULL))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['reader'::"text", 'author'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotion_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "internal_code" "text",
    "headline" "text",
    "description" "text",
    "discount_type" "text" DEFAULT 'percentage'::"text" NOT NULL,
    "discount_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "selected_book_ids" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "channels" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."promotion_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotion_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promotion_campaign_id" "uuid",
    "book_id" "uuid",
    "user_id" "uuid",
    "order_id" "uuid",
    "event_type" "text" NOT NULL,
    "channel" "text",
    "revenue_amount" numeric(14,2),
    "currency_code" "text",
    "metadata" "jsonb",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."promotion_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publishing_house_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "publishing_house_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "title" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."publishing_house_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publishing_houses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "legal_name" "text",
    "slug" "text",
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "email" "text",
    "phone" "text",
    "website" "text",
    "country_code" "text",
    "city" "text",
    "address" "text",
    "logo_url" "text",
    "primary_currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "brand_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."publishing_houses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publishing_imprints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "publishing_house_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "description" "text",
    "logo_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."publishing_imprints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publishing_review_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid",
    "author_id" "uuid",
    "opened_by" "uuid",
    "assigned_to" "uuid",
    "case_number" "text",
    "case_type" "text" DEFAULT 'metadata'::"text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "reason_code" "text",
    "title" "text" NOT NULL,
    "explanation" "text",
    "required_action" "text",
    "author_response" "text",
    "resolution_note" "text",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."publishing_review_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_notification_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'fcm'::"text" NOT NULL,
    "token" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "push_notification_tokens_provider_check" CHECK (("provider" = ANY (ARRAY['fcm'::"text", 'apns'::"text"])))
);


ALTER TABLE "public"."push_notification_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "rating" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "review_text" "text",
    "helpful_count" integer DEFAULT 0 NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "hidden_at" timestamp with time zone,
    "hidden_by" "uuid",
    "moderation_note" "text",
    CONSTRAINT "ratings_rating_check" CHECK ((("rating" >= (1)::numeric) AND ("rating" <= (5)::numeric)))
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reader_affiliate_profiles" (
    "user_id" "uuid" NOT NULL,
    "affiliate_code" "text" NOT NULL,
    "commission_rate" numeric(5,4) DEFAULT 0.0200 NOT NULL,
    "wallet_balance" numeric(12,2) DEFAULT 0 NOT NULL,
    "lifetime_credited" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reader_affiliate_profiles_commission_rate_check" CHECK ((("commission_rate" >= (0)::numeric) AND ("commission_rate" <= (1)::numeric))),
    CONSTRAINT "reader_affiliate_profiles_lifetime_credited_check" CHECK (("lifetime_credited" >= (0)::numeric)),
    CONSTRAINT "reader_affiliate_profiles_wallet_balance_check" CHECK (("wallet_balance" >= (0)::numeric))
);


ALTER TABLE "public"."reader_affiliate_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "format_id" "uuid",
    "locator" "text" NOT NULL,
    "locator_type" "text" DEFAULT 'epub_cfi'::"text" NOT NULL,
    "progress_percent" numeric(5,2) DEFAULT 0 NOT NULL,
    "device_id" "text",
    "device_name" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "device_record_id" "uuid",
    "sync_revision" bigint DEFAULT 1 NOT NULL,
    CONSTRAINT "reading_progress_locator_type_check" CHECK (("locator_type" = ANY (ARRAY['epub_cfi'::"text", 'pdf_page'::"text", 'pdf_locator'::"text", 'audio_position'::"text", 'custom'::"text"]))),
    CONSTRAINT "reading_progress_progress_percent_check" CHECK ((("progress_percent" >= (0)::numeric) AND ("progress_percent" <= (100)::numeric)))
);


ALTER TABLE "public"."reading_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."reading_progress" IS 'Position de lecture synchronisee entre appareils.';



CREATE TABLE IF NOT EXISTS "public"."reading_sync_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "format_id" "uuid",
    "client_event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "device_created_at" timestamp with time zone NOT NULL,
    "processed_at" timestamp with time zone,
    "processing_error" "text",
    "retry_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reading_sync_queue_event_type_check" CHECK (("event_type" = ANY (ARRAY['progress_upsert'::"text", 'highlight_upsert'::"text", 'highlight_delete'::"text", 'bookmark_upsert'::"text", 'bookmark_delete'::"text", 'reader_settings'::"text"]))),
    CONSTRAINT "reading_sync_queue_payload_check" CHECK (("jsonb_typeof"("payload") = 'object'::"text")),
    CONSTRAINT "reading_sync_queue_retry_count_check" CHECK (("retry_count" >= 0)),
    CONSTRAINT "reading_sync_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'processed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."reading_sync_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rights_acquisition_targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_profile_id" "uuid",
    "title" "text" NOT NULL,
    "original_publisher" "text",
    "isbn" "text",
    "status" "text" DEFAULT 'prospect'::"text" NOT NULL,
    "territories" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "languages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "desired_media" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "estimated_budget" numeric(12,2),
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "contact_name" "text",
    "contact_email" "text",
    "source_url" "text",
    "next_action_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rights_acquisition_targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rights_contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid",
    "publishing_house_id" "uuid",
    "contract_number" "text",
    "rights_holder_name" "text",
    "licensor_name" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "territories" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "languages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "permitted_media" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "exclusive" boolean DEFAULT false NOT NULL,
    "starts_at" "date",
    "ends_at" "date",
    "royalty_terms" "jsonb",
    "proof_path" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rights_contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plan_books" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscription_plan_books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "monthly_price" numeric NOT NULL,
    "currency_code" "text" DEFAULT 'USD'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "max_devices" smallint DEFAULT 2 NOT NULL,
    "offline_days" smallint DEFAULT 7 NOT NULL,
    "downloads_enabled" boolean DEFAULT true NOT NULL,
    CONSTRAINT "subscription_plans_max_devices_check" CHECK ((("max_devices" >= 1) AND ("max_devices" <= 10))),
    CONSTRAINT "subscription_plans_monthly_price_check" CHECK (("monthly_price" >= (0)::numeric)),
    CONSTRAINT "subscription_plans_offline_days_check" CHECK ((("offline_days" >= 0) AND ("offline_days" <= 30)))
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_uuid" "text" NOT NULL,
    "platform" "text" DEFAULT 'android'::"text" NOT NULL,
    "device_name" "text",
    "manufacturer" "text",
    "model" "text",
    "os_version" "text",
    "app_version_name" "text",
    "app_version_code" integer,
    "public_key" "text",
    "integrity_status" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_trusted" boolean DEFAULT false NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_devices_app_version_code_check" CHECK ((("app_version_code" IS NULL) OR ("app_version_code" > 0))),
    CONSTRAINT "user_devices_integrity_status_check" CHECK (("integrity_status" = ANY (ARRAY['unknown'::"text", 'trusted'::"text", 'suspicious'::"text", 'blocked'::"text"]))),
    CONSTRAINT "user_devices_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "user_devices_platform_check" CHECK (("platform" = ANY (ARRAY['android'::"text", 'ios'::"text", 'web'::"text"])))
);


ALTER TABLE "public"."user_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "affiliate_user_id" "uuid",
    "affiliate_code_used" "text",
    "affiliate_source_type" "text",
    "affiliate_source_book_id" "uuid",
    "affiliate_source_plan_id" "uuid",
    "affiliate_commission_rate" numeric(5,4) DEFAULT 0.0200 NOT NULL,
    "affiliate_commission_amount" numeric(10,2),
    CONSTRAINT "user_subscriptions_affiliate_commission_amount_check" CHECK ((("affiliate_commission_amount" IS NULL) OR ("affiliate_commission_amount" >= (0)::numeric))),
    CONSTRAINT "user_subscriptions_affiliate_commission_rate_check" CHECK ((("affiliate_commission_rate" >= (0)::numeric) AND ("affiliate_commission_rate" <= (1)::numeric))),
    CONSTRAINT "user_subscriptions_affiliate_source_type_check" CHECK ((("affiliate_source_type" = ANY (ARRAY['book'::"text", 'plan'::"text"])) OR ("affiliate_source_type" IS NULL))),
    CONSTRAINT "user_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'past_due'::"text"])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."academic_taxonomies"
    ADD CONSTRAINT "academic_taxonomies_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."academic_taxonomies"
    ADD CONSTRAINT "academic_taxonomies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."academic_taxonomies"
    ADD CONSTRAINT "academic_taxonomies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."ad_assignments"
    ADD CONSTRAINT "ad_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_campaigns"
    ADD CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_creatives"
    ADD CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_events"
    ADD CONSTRAINT "ad_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_placements"
    ADD CONSTRAINT "ad_placements_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ad_placements"
    ADD CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_book_import_batches"
    ADD CONSTRAINT "admin_book_import_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_book_import_items"
    ADD CONSTRAINT "admin_book_import_items_created_by_batch_id_item_id_key" UNIQUE ("created_by", "batch_id", "item_id");



ALTER TABLE ONLY "public"."admin_book_import_items"
    ADD CONSTRAINT "admin_book_import_items_created_by_item_id_key" UNIQUE ("created_by", "item_id");



ALTER TABLE ONLY "public"."admin_book_import_items"
    ADD CONSTRAINT "admin_book_import_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_order_transactions"
    ADD CONSTRAINT "affiliate_order_transactions_order_id_key" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."affiliate_order_transactions"
    ADD CONSTRAINT "affiliate_order_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_payout_accounts"
    ADD CONSTRAINT "affiliate_payout_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_payout_accounts"
    ADD CONSTRAINT "affiliate_payout_accounts_user_id_provider_account_number_key" UNIQUE ("user_id", "provider", "account_number");



ALTER TABLE ONLY "public"."affiliate_wallet_transactions"
    ADD CONSTRAINT "affiliate_wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_wallet_transactions"
    ADD CONSTRAINT "affiliate_wallet_transactions_subscription_id_key" UNIQUE ("subscription_id");



ALTER TABLE ONLY "public"."affiliate_withdrawals"
    ADD CONSTRAINT "affiliate_withdrawals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."author_payout_accounts"
    ADD CONSTRAINT "author_payout_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."author_payouts"
    ADD CONSTRAINT "author_payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."author_profiles"
    ADD CONSTRAINT "author_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."author_royalty_accounts"
    ADD CONSTRAINT "author_royalty_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."author_royalty_accounts"
    ADD CONSTRAINT "author_royalty_accounts_user_id_currency_code_key" UNIQUE ("user_id", "currency_code");



ALTER TABLE ONLY "public"."author_royalty_transactions"
    ADD CONSTRAINT "author_royalty_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."book_academic_taxonomy"
    ADD CONSTRAINT "book_academic_taxonomy_pkey" PRIMARY KEY ("book_id", "academic_taxonomy_id");



ALTER TABLE ONLY "public"."book_assets"
    ADD CONSTRAINT "book_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_pkey" PRIMARY KEY ("book_id", "author_id");



ALTER TABLE ONLY "public"."book_categories"
    ADD CONSTRAINT "book_categories_pkey" PRIMARY KEY ("book_id", "category_id");



ALTER TABLE ONLY "public"."book_distribution_settings"
    ADD CONSTRAINT "book_distribution_settings_book_id_key" UNIQUE ("book_id");



ALTER TABLE ONLY "public"."book_distribution_settings"
    ADD CONSTRAINT "book_distribution_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_downloads"
    ADD CONSTRAINT "book_downloads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_editorial_events"
    ADD CONSTRAINT "book_editorial_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_engagement_events"
    ADD CONSTRAINT "book_engagement_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_favorites"
    ADD CONSTRAINT "book_favorites_pkey" PRIMARY KEY ("user_id", "book_id");



ALTER TABLE ONLY "public"."book_formats"
    ADD CONSTRAINT "book_formats_book_id_format_key" UNIQUE ("book_id", "format");



ALTER TABLE ONLY "public"."book_formats"
    ADD CONSTRAINT "book_formats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_manuscript_versions"
    ADD CONSTRAINT "book_manuscript_versions_book_id_version_number_key" UNIQUE ("book_id", "version_number");



ALTER TABLE ONLY "public"."book_manuscript_versions"
    ADD CONSTRAINT "book_manuscript_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_market_prices"
    ADD CONSTRAINT "book_market_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_reader_sessions"
    ADD CONSTRAINT "book_reader_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."editorial_training_requests"
    ADD CONSTRAINT "editorial_training_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flash_sale_configs"
    ADD CONSTRAINT "flash_sale_configs_pkey" PRIMARY KEY ("scope");



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_featured_configs"
    ADD CONSTRAINT "home_featured_configs_pkey" PRIMARY KEY ("scope");



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_user_book_unique" UNIQUE ("user_id", "book_id");



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_user_id_book_id_key" UNIQUE ("user_id", "book_id");



ALTER TABLE ONLY "public"."media_chapters"
    ADD CONSTRAINT "media_chapters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_editions"
    ADD CONSTRAINT "media_editions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_app_configs"
    ADD CONSTRAINT "mobile_app_configs_pkey" PRIMARY KEY ("scope");



ALTER TABLE ONLY "public"."mobile_app_trial_grants"
    ADD CONSTRAINT "mobile_app_trial_grants_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."mobile_app_versions"
    ADD CONSTRAINT "mobile_app_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_app_versions"
    ADD CONSTRAINT "mobile_app_versions_platform_code_key" UNIQUE ("platform", "version_code");



ALTER TABLE ONLY "public"."mobile_app_versions"
    ADD CONSTRAINT "mobile_app_versions_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."offline_reading_licenses"
    ADD CONSTRAINT "offline_reading_licenses_license_token_hash_key" UNIQUE ("license_token_hash");



ALTER TABLE ONLY "public"."offline_reading_licenses"
    ADD CONSTRAINT "offline_reading_licenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_audit_events"
    ADD CONSTRAINT "platform_audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotion_campaigns"
    ADD CONSTRAINT "promotion_campaigns_internal_code_key" UNIQUE ("internal_code");



ALTER TABLE ONLY "public"."promotion_campaigns"
    ADD CONSTRAINT "promotion_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotion_events"
    ADD CONSTRAINT "promotion_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publishing_house_members"
    ADD CONSTRAINT "publishing_house_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publishing_house_members"
    ADD CONSTRAINT "publishing_house_members_publishing_house_id_profile_id_key" UNIQUE ("publishing_house_id", "profile_id");



ALTER TABLE ONLY "public"."publishing_houses"
    ADD CONSTRAINT "publishing_houses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publishing_houses"
    ADD CONSTRAINT "publishing_houses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."publishing_imprints"
    ADD CONSTRAINT "publishing_imprints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publishing_imprints"
    ADD CONSTRAINT "publishing_imprints_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."publishing_review_cases"
    ADD CONSTRAINT "publishing_review_cases_case_number_key" UNIQUE ("case_number");



ALTER TABLE ONLY "public"."publishing_review_cases"
    ADD CONSTRAINT "publishing_review_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_notification_tokens"
    ADD CONSTRAINT "push_notification_tokens_device_provider_key" UNIQUE ("device_id", "provider");



ALTER TABLE ONLY "public"."push_notification_tokens"
    ADD CONSTRAINT "push_notification_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_notification_tokens"
    ADD CONSTRAINT "push_notification_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_user_id_book_id_key" UNIQUE ("user_id", "book_id");



ALTER TABLE ONLY "public"."reader_affiliate_profiles"
    ADD CONSTRAINT "reader_affiliate_profiles_affiliate_code_key" UNIQUE ("affiliate_code");



ALTER TABLE ONLY "public"."reader_affiliate_profiles"
    ADD CONSTRAINT "reader_affiliate_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_user_id_book_id_key" UNIQUE ("user_id", "book_id");



ALTER TABLE ONLY "public"."reading_sync_queue"
    ADD CONSTRAINT "reading_sync_queue_client_event_key" UNIQUE ("user_id", "device_id", "client_event_id");



ALTER TABLE ONLY "public"."reading_sync_queue"
    ADD CONSTRAINT "reading_sync_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rights_acquisition_targets"
    ADD CONSTRAINT "rights_acquisition_targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rights_contracts"
    ADD CONSTRAINT "rights_contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plan_books"
    ADD CONSTRAINT "subscription_plan_books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plan_books"
    ADD CONSTRAINT "subscription_plan_books_plan_id_book_id_key" UNIQUE ("plan_id", "book_id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_user_device_key" UNIQUE ("user_id", "device_uuid");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



CREATE INDEX "academic_taxonomy_audience_idx" ON "public"."academic_taxonomies" USING "btree" ("audience", "kind", "is_active");



CREATE INDEX "admin_book_import_items_batch_idx" ON "public"."admin_book_import_items" USING "btree" ("created_by", "batch_id", "created_at");



CREATE INDEX "admin_book_import_items_book_idx" ON "public"."admin_book_import_items" USING "btree" ("book_id");



CREATE INDEX "admin_book_import_items_checksum_idx" ON "public"."admin_book_import_items" USING "btree" ("source_checksum_sha256");



CREATE INDEX "admin_book_import_items_status_idx" ON "public"."admin_book_import_items" USING "btree" ("status", "updated_at" DESC);



CREATE INDEX "affiliate_order_transactions_affiliate_user_id_idx" ON "public"."affiliate_order_transactions" USING "btree" ("affiliate_user_id");



CREATE INDEX "affiliate_order_transactions_purchased_book_id_idx" ON "public"."affiliate_order_transactions" USING "btree" ("purchased_book_id");



CREATE INDEX "affiliate_order_transactions_referred_user_id_idx" ON "public"."affiliate_order_transactions" USING "btree" ("referred_user_id");



CREATE UNIQUE INDEX "affiliate_payout_account_unique_idx" ON "public"."affiliate_payout_accounts" USING "btree" ("user_id", "provider", "account_number");



CREATE UNIQUE INDEX "affiliate_payout_accounts_unique_idx" ON "public"."affiliate_payout_accounts" USING "btree" ("user_id", "provider", "account_number");



CREATE INDEX "affiliate_payout_accounts_user_idx" ON "public"."affiliate_payout_accounts" USING "btree" ("user_id");



CREATE INDEX "affiliate_wallet_transactions_affiliate_user_id_idx" ON "public"."affiliate_wallet_transactions" USING "btree" ("affiliate_user_id");



CREATE INDEX "affiliate_wallet_transactions_plan_id_idx" ON "public"."affiliate_wallet_transactions" USING "btree" ("plan_id");



CREATE INDEX "affiliate_wallet_transactions_referred_user_id_idx" ON "public"."affiliate_wallet_transactions" USING "btree" ("referred_user_id");



CREATE UNIQUE INDEX "affiliate_withdrawals_provider_ref_unique_idx" ON "public"."affiliate_withdrawals" USING "btree" ("provider_reference") WHERE ("provider_reference" IS NOT NULL);



CREATE UNIQUE INDEX "affiliate_withdrawals_provider_reference_unique_idx" ON "public"."affiliate_withdrawals" USING "btree" ("provider_reference") WHERE ("provider_reference" IS NOT NULL);



CREATE INDEX "affiliate_withdrawals_user_idx" ON "public"."affiliate_withdrawals" USING "btree" ("user_id");



CREATE INDEX "affiliate_withdrawals_user_status_idx" ON "public"."affiliate_withdrawals" USING "btree" ("user_id", "status");



CREATE INDEX "author_profiles_display_name_idx" ON "public"."author_profiles" USING "btree" ("display_name");



CREATE INDEX "blog_posts_published_at_idx" ON "public"."blog_posts" USING "btree" ("published_at" DESC, "created_at" DESC);



CREATE INDEX "book_assets_book_idx" ON "public"."book_assets" USING "btree" ("book_id");



CREATE INDEX "book_assets_book_type_idx" ON "public"."book_assets" USING "btree" ("book_id", "asset_type", "is_published");



CREATE INDEX "book_assets_format_idx" ON "public"."book_assets" USING "btree" ("format_id");



CREATE UNIQUE INDEX "book_assets_storage_path_uidx" ON "public"."book_assets" USING "btree" ("storage_path");



CREATE INDEX "book_authors_author_idx" ON "public"."book_authors" USING "btree" ("author_id");



CREATE INDEX "book_categories_category_idx" ON "public"."book_categories" USING "btree" ("category_id");



CREATE INDEX "book_downloads_book_status_idx" ON "public"."book_downloads" USING "btree" ("book_id", "status", "updated_at" DESC);



CREATE INDEX "book_downloads_user_device_idx" ON "public"."book_downloads" USING "btree" ("user_id", "device_id", "created_at" DESC);



CREATE INDEX "book_editorial_events_book_idx" ON "public"."book_editorial_events" USING "btree" ("book_id", "created_at");



CREATE INDEX "book_engagement_events_book_id_idx" ON "public"."book_engagement_events" USING "btree" ("book_id");



CREATE INDEX "book_engagement_events_created_at_idx" ON "public"."book_engagement_events" USING "btree" ("created_at" DESC);



CREATE INDEX "book_engagement_events_event_type_idx" ON "public"."book_engagement_events" USING "btree" ("event_type");



CREATE INDEX "book_engagement_events_user_id_idx" ON "public"."book_engagement_events" USING "btree" ("user_id");



CREATE INDEX "book_favorites_book_id_idx" ON "public"."book_favorites" USING "btree" ("book_id");



CREATE UNIQUE INDEX "book_formats_book_format_uidx" ON "public"."book_formats" USING "btree" ("book_id", "format");



CREATE UNIQUE INDEX "book_formats_book_format_unique_idx" ON "public"."book_formats" USING "btree" ("book_id", "format");



CREATE INDEX "book_formats_book_id_idx" ON "public"."book_formats" USING "btree" ("book_id");



CREATE INDEX "book_formats_book_idx" ON "public"."book_formats" USING "btree" ("book_id");



CREATE INDEX "book_formats_book_published_idx" ON "public"."book_formats" USING "btree" ("book_id", "is_published");



CREATE INDEX "books_admin_import_batch_idx" ON "public"."books" USING "btree" ("admin_imported_by", "admin_import_batch_id", "admin_imported_at" DESC) WHERE ("admin_import_batch_id" IS NOT NULL);



CREATE UNIQUE INDEX "books_admin_import_checksum_unique_idx" ON "public"."books" USING "btree" ("admin_import_checksum") WHERE ("admin_import_checksum" IS NOT NULL);



CREATE INDEX "books_admin_import_item_idx" ON "public"."books" USING "btree" ("admin_import_item_id");



CREATE UNIQUE INDEX "books_admin_import_item_unique_idx" ON "public"."books" USING "btree" ("admin_imported_by", "admin_import_item_id") WHERE ("admin_import_item_id" IS NOT NULL);



CREATE INDEX "books_author_display_name_idx" ON "public"."books" USING "btree" ("author_display_name");



CREATE INDEX "books_author_idx" ON "public"."books" USING "btree" ("author_id");



CREATE INDEX "books_author_status_idx" ON "public"."books" USING "btree" ("author_id", "status");



CREATE INDEX "books_copyright_status_idx" ON "public"."books" USING "btree" ("copyright_status");



CREATE INDEX "books_created_at_idx" ON "public"."books" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "books_isbn_unique_idx" ON "public"."books" USING "btree" ("isbn") WHERE ("isbn" IS NOT NULL);



CREATE INDEX "books_mobile_catalog_idx" ON "public"."books" USING "btree" ("status", "review_status", "published_at" DESC);



CREATE INDEX "books_published_at_idx" ON "public"."books" USING "btree" ("published_at" DESC);



CREATE INDEX "books_review_status_idx" ON "public"."books" USING "btree" ("review_status");



CREATE INDEX "books_reviewed_by_idx" ON "public"."books" USING "btree" ("reviewed_by");



CREATE INDEX "books_status_idx" ON "public"."books" USING "btree" ("status");



CREATE INDEX "books_submitted_at_idx" ON "public"."books" USING "btree" ("submitted_at" DESC);



CREATE INDEX "books_title_lower_idx" ON "public"."books" USING "btree" ("lower"("title"));



CREATE INDEX "devices_user_idx" ON "public"."user_devices" USING "btree" ("user_id");



CREATE INDEX "downloads_device_idx" ON "public"."book_downloads" USING "btree" ("device_id");



CREATE INDEX "downloads_user_idx" ON "public"."book_downloads" USING "btree" ("user_id");



CREATE INDEX "editorial_training_requests_created_at_idx" ON "public"."editorial_training_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "editorial_training_requests_email_idx" ON "public"."editorial_training_requests" USING "btree" ("email");



CREATE INDEX "engagement_book_created_idx" ON "public"."book_engagement_events" USING "btree" ("book_id", "created_at" DESC);



CREATE INDEX "hb_ad_placement_code_idx" ON "public"."ad_placements" USING "btree" ("code");



CREATE INDEX "hb_books_publisher_idx" ON "public"."books" USING "btree" ("publishing_house_id", "status");



CREATE INDEX "hb_books_status_review_idx" ON "public"."books" USING "btree" ("status", "review_status", "copyright_status", "published_at" DESC);



CREATE INDEX "hb_library_user_book_idx" ON "public"."library" USING "btree" ("user_id", "book_id");



CREATE INDEX "hb_market_book_idx" ON "public"."book_market_prices" USING "btree" ("book_id", "country_code", "is_active");



CREATE INDEX "hb_media_book_idx" ON "public"."media_editions" USING "btree" ("book_id", "status");



CREATE INDEX "hb_royalties_user_idx" ON "public"."author_royalty_transactions" USING "btree" ("user_id", "earned_at" DESC);



CREATE INDEX "highlights_book_created_idx" ON "public"."highlights" USING "btree" ("book_id", "created_at" DESC);



CREATE UNIQUE INDEX "highlights_client_unique_idx" ON "public"."highlights" USING "btree" ("user_id", "client_highlight_id") WHERE ("client_highlight_id" IS NOT NULL);



CREATE INDEX "highlights_user_book_idx" ON "public"."highlights" USING "btree" ("user_id", "book_id", "updated_at" DESC);



CREATE UNIQUE INDEX "highlights_user_client_uidx" ON "public"."highlights" USING "btree" ("user_id", "client_highlight_id") WHERE ("client_highlight_id" IS NOT NULL);



CREATE INDEX "highlights_user_created_idx" ON "public"."highlights" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_author_profiles_display_name" ON "public"."author_profiles" USING "btree" ("display_name");



CREATE INDEX "idx_book_assets_book_id" ON "public"."book_assets" USING "btree" ("book_id");



CREATE INDEX "idx_books_author_id_status" ON "public"."books" USING "btree" ("author_id", "status");



CREATE INDEX "idx_library_book_id" ON "public"."library" USING "btree" ("book_id");



CREATE INDEX "idx_library_user_id" ON "public"."library" USING "btree" ("user_id");



CREATE INDEX "idx_reading_progress_book_id" ON "public"."reading_progress" USING "btree" ("book_id");



CREATE INDEX "idx_reading_progress_user_id" ON "public"."reading_progress" USING "btree" ("user_id");



CREATE UNIQUE INDEX "library_active_user_book_format_uidx" ON "public"."library" USING "btree" ("user_id", "book_id", COALESCE("granted_by_format_id", '00000000-0000-0000-0000-000000000000'::"uuid")) WHERE ("status" = 'active'::"text");



CREATE INDEX "library_book_idx" ON "public"."library" USING "btree" ("book_id");



CREATE INDEX "library_subscription_id_idx" ON "public"."library" USING "btree" ("subscription_id");



CREATE INDEX "library_user_book_idx" ON "public"."library" USING "btree" ("user_id", "book_id");



CREATE UNIQUE INDEX "library_user_book_uidx" ON "public"."library" USING "btree" ("user_id", "book_id");



CREATE INDEX "library_user_idx" ON "public"."library" USING "btree" ("user_id");



CREATE INDEX "library_user_status_idx" ON "public"."library" USING "btree" ("user_id", "status", "last_opened_at" DESC);



CREATE INDEX "licenses_device_idx" ON "public"."offline_reading_licenses" USING "btree" ("device_id");



CREATE INDEX "licenses_user_book_idx" ON "public"."offline_reading_licenses" USING "btree" ("user_id", "book_id");



CREATE INDEX "mobile_app_trial_grants_expires_at_idx" ON "public"."mobile_app_trial_grants" USING "btree" ("expires_at");



CREATE INDEX "mobile_app_trial_grants_status_idx" ON "public"."mobile_app_trial_grants" USING "btree" ("status");



CREATE UNIQUE INDEX "mobile_app_version_unique_idx" ON "public"."mobile_app_versions" USING "btree" ("platform", "version_code");



CREATE UNIQUE INDEX "offline_licenses_active_asset_uidx" ON "public"."offline_reading_licenses" USING "btree" ("user_id", "device_id", "book_id", COALESCE("asset_id", '00000000-0000-0000-0000-000000000000'::"uuid")) WHERE ("status" = 'active'::"text");



CREATE INDEX "offline_licenses_lookup_idx" ON "public"."offline_reading_licenses" USING "btree" ("user_id", "device_id", "book_id", "status", "valid_until" DESC);



CREATE INDEX "order_items_book_format_idx" ON "public"."order_items" USING "btree" ("book_format");



CREATE INDEX "order_items_book_idx" ON "public"."order_items" USING "btree" ("book_id");



CREATE INDEX "order_items_format_idx" ON "public"."order_items" USING "btree" ("format_id");



CREATE UNIQUE INDEX "order_items_order_book_format_uidx" ON "public"."order_items" USING "btree" ("order_id", "book_id", "book_format");



CREATE INDEX "order_items_order_idx" ON "public"."order_items" USING "btree" ("order_id");



CREATE UNIQUE INDEX "order_payment_transaction_unique_idx" ON "public"."orders" USING "btree" ("payment_provider", "payment_transaction_id") WHERE ("payment_transaction_id" IS NOT NULL);



CREATE INDEX "orders_created_at_idx" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "orders_payment_provider_created_at_idx" ON "public"."orders" USING "btree" ("payment_provider", "created_at" DESC);



CREATE UNIQUE INDEX "orders_payment_transaction_id_idx" ON "public"."orders" USING "btree" ("payment_transaction_id") WHERE ("payment_transaction_id" IS NOT NULL);



CREATE UNIQUE INDEX "orders_payment_transaction_uidx" ON "public"."orders" USING "btree" ("payment_transaction_id") WHERE ("payment_transaction_id" IS NOT NULL);



CREATE INDEX "orders_status_idx" ON "public"."orders" USING "btree" ("payment_status");



CREATE INDEX "orders_user_idx" ON "public"."orders" USING "btree" ("user_id");



CREATE UNIQUE INDEX "payment_attempt_provider_reference_unique_idx" ON "public"."payment_attempts" USING "btree" ("provider", "provider_reference") WHERE ("provider_reference" IS NOT NULL);



CREATE INDEX "payment_attempts_order_idx" ON "public"."payment_attempts" USING "btree" ("order_id") WHERE ("order_id" IS NOT NULL);



CREATE UNIQUE INDEX "payment_attempts_provider_reference_uidx" ON "public"."payment_attempts" USING "btree" ("provider", "provider_reference") WHERE ("provider_reference" IS NOT NULL);



CREATE INDEX "payment_attempts_status_idx" ON "public"."payment_attempts" USING "btree" ("status");



CREATE INDEX "payment_attempts_user_created_idx" ON "public"."payment_attempts" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "payment_attempts_user_idx" ON "public"."payment_attempts" USING "btree" ("user_id");



CREATE INDEX "profiles_affiliate_source_book_id_idx" ON "public"."profiles" USING "btree" ("affiliate_source_book_id");



CREATE INDEX "profiles_affiliate_source_plan_id_idx" ON "public"."profiles" USING "btree" ("affiliate_source_plan_id");



CREATE INDEX "profiles_referred_by_affiliate_code_idx" ON "public"."profiles" USING "btree" ("referred_by_affiliate_code");



CREATE INDEX "profiles_referred_by_affiliate_user_id_idx" ON "public"."profiles" USING "btree" ("referred_by_affiliate_user_id");



CREATE INDEX "push_notification_tokens_user_active_idx" ON "public"."push_notification_tokens" USING "btree" ("user_id", "is_active");



CREATE INDEX "ratings_book_idx" ON "public"."ratings" USING "btree" ("book_id");



CREATE UNIQUE INDEX "ratings_user_book_uidx" ON "public"."ratings" USING "btree" ("user_id", "book_id");



CREATE UNIQUE INDEX "ratings_user_book_unique_idx" ON "public"."ratings" USING "btree" ("user_id", "book_id");



CREATE INDEX "reader_affiliate_profiles_affiliate_code_idx" ON "public"."reader_affiliate_profiles" USING "btree" ("affiliate_code");



CREATE UNIQUE INDEX "reading_progress_user_book_format_uidx" ON "public"."reading_progress" USING "btree" ("user_id", "book_id", COALESCE("format_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



CREATE UNIQUE INDEX "reading_progress_user_book_format_unique_idx" ON "public"."reading_progress" USING "btree" ("user_id", "book_id", "format_id") NULLS NOT DISTINCT;



CREATE INDEX "reading_progress_user_book_idx" ON "public"."reading_progress" USING "btree" ("user_id", "book_id");



CREATE INDEX "reading_progress_user_updated_idx" ON "public"."reading_progress" USING "btree" ("user_id", "updated_at" DESC);



CREATE UNIQUE INDEX "reading_sync_device_event_unique_idx" ON "public"."reading_sync_queue" USING "btree" ("device_id", "client_event_id");



CREATE INDEX "reading_sync_queue_pending_idx" ON "public"."reading_sync_queue" USING "btree" ("status", "created_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'failed'::"text"]));



CREATE INDEX "subscription_plan_books_book_id_idx" ON "public"."subscription_plan_books" USING "btree" ("book_id");



CREATE UNIQUE INDEX "subscription_plan_books_plan_book_uidx" ON "public"."subscription_plan_books" USING "btree" ("plan_id", "book_id");



CREATE INDEX "subscription_plan_books_plan_id_idx" ON "public"."subscription_plan_books" USING "btree" ("plan_id");



CREATE UNIQUE INDEX "subscription_plan_books_unique_idx" ON "public"."subscription_plan_books" USING "btree" ("plan_id", "book_id");



CREATE INDEX "subscription_plans_active_idx" ON "public"."subscription_plans" USING "btree" ("is_active");



CREATE INDEX "subscriptions_plan_idx" ON "public"."user_subscriptions" USING "btree" ("plan_id");



CREATE INDEX "subscriptions_status_idx" ON "public"."user_subscriptions" USING "btree" ("status");



CREATE INDEX "subscriptions_user_idx" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE INDEX "user_devices_user_active_idx" ON "public"."user_devices" USING "btree" ("user_id", "is_active", "last_seen_at" DESC);



CREATE UNIQUE INDEX "user_devices_user_device_unique_idx" ON "public"."user_devices" USING "btree" ("user_id", "device_uuid");



CREATE INDEX "user_subscriptions_affiliate_user_id_idx" ON "public"."user_subscriptions" USING "btree" ("affiliate_user_id");



CREATE INDEX "user_subscriptions_plan_id_idx" ON "public"."user_subscriptions" USING "btree" ("plan_id");



CREATE INDEX "user_subscriptions_user_id_idx" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE INDEX "user_subscriptions_user_status_idx" ON "public"."user_subscriptions" USING "btree" ("user_id", "status");



CREATE OR REPLACE TRIGGER "enforce_book_publication_rights_trigger" BEFORE INSERT OR UPDATE OF "status", "copyright_status" ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_book_publication_rights"();



CREATE OR REPLACE TRIGGER "hb_enforce_book_workflow" BEFORE INSERT OR UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."hb_book_workflow_guard"();



CREATE OR REPLACE TRIGGER "hb_guard_reader_rating_trigger" BEFORE INSERT OR UPDATE ON "public"."ratings" FOR EACH ROW EXECUTE FUNCTION "public"."hb_guard_reader_rating"();



CREATE OR REPLACE TRIGGER "ratings_after_delete" AFTER DELETE ON "public"."ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_book_rating"();



CREATE OR REPLACE TRIGGER "ratings_after_insert" AFTER INSERT OR UPDATE ON "public"."ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_book_rating"();



CREATE OR REPLACE TRIGGER "set_book_downloads_updated_at" BEFORE UPDATE ON "public"."book_downloads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_mobile_app_versions_updated_at" BEFORE UPDATE ON "public"."mobile_app_versions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_offline_reading_licenses_updated_at" BEFORE UPDATE ON "public"."offline_reading_licenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_payment_attempts_updated_at" BEFORE UPDATE ON "public"."payment_attempts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_push_notification_tokens_updated_at" BEFORE UPDATE ON "public"."push_notification_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_reading_sync_queue_updated_at" BEFORE UPDATE ON "public"."reading_sync_queue" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_user_devices_updated_at" BEFORE UPDATE ON "public"."user_devices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_admin_book_import_batches_updated_at" BEFORE UPDATE ON "public"."admin_book_import_batches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_admin_book_import_items_protect_identity" BEFORE UPDATE ON "public"."admin_book_import_items" FOR EACH ROW EXECUTE FUNCTION "public"."protect_admin_book_import_item_identity"();



CREATE OR REPLACE TRIGGER "trg_admin_book_import_items_updated_at" BEFORE UPDATE ON "public"."admin_book_import_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_affiliate_payout_accounts_updated_at" BEFORE UPDATE ON "public"."affiliate_payout_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_affiliate_withdrawals_updated_at" BEFORE UPDATE ON "public"."affiliate_withdrawals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_author_profiles_updated_at" BEFORE UPDATE ON "public"."author_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_blog_posts_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_book_assets_format" BEFORE INSERT OR UPDATE ON "public"."book_assets" FOR EACH ROW EXECUTE FUNCTION "public"."validate_book_format_relation"();



CREATE OR REPLACE TRIGGER "trg_book_assets_updated_at" BEFORE UPDATE ON "public"."book_assets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_book_download_asset" BEFORE INSERT OR UPDATE ON "public"."book_downloads" FOR EACH ROW EXECUTE FUNCTION "public"."validate_asset_relation"();



CREATE OR REPLACE TRIGGER "trg_book_download_format" BEFORE INSERT OR UPDATE ON "public"."book_downloads" FOR EACH ROW EXECUTE FUNCTION "public"."validate_book_format_relation"();



CREATE OR REPLACE TRIGGER "trg_book_downloads_updated_at" BEFORE UPDATE ON "public"."book_downloads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_book_engagement_views_automation" AFTER INSERT OR DELETE OR UPDATE ON "public"."book_engagement_events" FOR EACH ROW EXECUTE FUNCTION "public"."handle_book_engagement_views_automation"();



CREATE OR REPLACE TRIGGER "trg_book_formats_author_delete_workflow" BEFORE DELETE ON "public"."book_formats" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_author_book_format_delete_workflow"();



CREATE OR REPLACE TRIGGER "trg_book_formats_author_workflow" BEFORE INSERT OR UPDATE ON "public"."book_formats" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_author_book_format_workflow"();



CREATE OR REPLACE TRIGGER "trg_book_formats_updated_at" BEFORE UPDATE ON "public"."book_formats" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_books_author_submission_workflow" BEFORE INSERT OR UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_author_book_submission_workflow"();



CREATE OR REPLACE TRIGGER "trg_books_updated_at" BEFORE UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_editorial_training_requests_updated_at" BEFORE UPDATE ON "public"."editorial_training_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_flash_sale_configs_updated_at" BEFORE UPDATE ON "public"."flash_sale_configs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_guard_affiliate_payout_account" BEFORE INSERT OR UPDATE ON "public"."affiliate_payout_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."guard_affiliate_payout_account"();



CREATE OR REPLACE TRIGGER "trg_guard_book_admin_fields" BEFORE UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."guard_book_admin_fields"();



CREATE OR REPLACE TRIGGER "trg_guard_device_security" BEFORE INSERT OR UPDATE ON "public"."user_devices" FOR EACH ROW EXECUTE FUNCTION "public"."guard_device_security"();



CREATE OR REPLACE TRIGGER "trg_guard_profile_sensitive_fields" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."guard_profile_sensitive_fields"();



CREATE OR REPLACE TRIGGER "trg_highlights_updated_at" BEFORE UPDATE ON "public"."highlights" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_home_featured_configs_updated_at" BEFORE UPDATE ON "public"."home_featured_configs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mobile_app_configs_updated_at" BEFORE UPDATE ON "public"."mobile_app_configs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mobile_app_trial_grants_updated_at" BEFORE UPDATE ON "public"."mobile_app_trial_grants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mobile_app_versions_updated_at" BEFORE UPDATE ON "public"."mobile_app_versions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_offline_license_asset" BEFORE INSERT OR UPDATE ON "public"."offline_reading_licenses" FOR EACH ROW EXECUTE FUNCTION "public"."validate_asset_relation"();



CREATE OR REPLACE TRIGGER "trg_offline_license_format" BEFORE INSERT OR UPDATE ON "public"."offline_reading_licenses" FOR EACH ROW EXECUTE FUNCTION "public"."validate_book_format_relation"();



CREATE OR REPLACE TRIGGER "trg_offline_reading_licenses_updated_at" BEFORE UPDATE ON "public"."offline_reading_licenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_order_items_automation" AFTER INSERT OR DELETE OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_order_items_automation"();



CREATE OR REPLACE TRIGGER "trg_orders_insert_affiliate_order_credit" AFTER INSERT ON "public"."orders" FOR EACH ROW WHEN (("new"."payment_status" = 'paid'::"text")) EXECUTE FUNCTION "public"."credit_affiliate_paid_order_commission"();



CREATE OR REPLACE TRIGGER "trg_orders_insert_paid_automation" AFTER INSERT ON "public"."orders" FOR EACH ROW WHEN (("new"."payment_status" = 'paid'::"text")) EXECUTE FUNCTION "public"."handle_orders_payment_status_automation"();



CREATE OR REPLACE TRIGGER "trg_orders_payment_status_automation" AFTER UPDATE OF "payment_status" ON "public"."orders" FOR EACH ROW WHEN (("old"."payment_status" IS DISTINCT FROM "new"."payment_status")) EXECUTE FUNCTION "public"."handle_orders_payment_status_automation"();



CREATE OR REPLACE TRIGGER "trg_orders_update_affiliate_order_credit" AFTER UPDATE OF "payment_status" ON "public"."orders" FOR EACH ROW WHEN (("old"."payment_status" IS DISTINCT FROM "new"."payment_status")) EXECUTE FUNCTION "public"."credit_affiliate_paid_order_commission"();



CREATE OR REPLACE TRIGGER "trg_payment_attempts_updated_at" BEFORE UPDATE ON "public"."payment_attempts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_affiliate_referral" BEFORE INSERT OR UPDATE OF "referred_by_affiliate_code", "affiliate_source_type", "affiliate_source_book_id", "affiliate_source_plan_id" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."resolve_profile_affiliate_referral"();



CREATE OR REPLACE TRIGGER "trg_profiles_ensure_author_profile" AFTER INSERT OR UPDATE OF "role", "name" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_author_profile"();



CREATE OR REPLACE TRIGGER "trg_profiles_reader_affiliate_profile" AFTER INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_reader_affiliate_profile"();



CREATE OR REPLACE TRIGGER "trg_push_notification_tokens_updated_at" BEFORE UPDATE ON "public"."push_notification_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ratings_automation" AFTER INSERT OR DELETE OR UPDATE ON "public"."ratings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_ratings_automation"();



CREATE OR REPLACE TRIGGER "trg_reader_affiliate_profiles_updated_at" BEFORE UPDATE ON "public"."reader_affiliate_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_reading_progress_format" BEFORE INSERT OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."validate_book_format_relation"();



CREATE OR REPLACE TRIGGER "trg_reading_progress_updated_at" BEFORE UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_reading_sync_queue_updated_at" BEFORE UPDATE ON "public"."reading_sync_queue" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_subscription_plans_updated_at" BEFORE UPDATE ON "public"."subscription_plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_user_devices_updated_at" BEFORE UPDATE ON "public"."user_devices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_user_subscriptions_affiliate_credit" AFTER INSERT OR UPDATE OF "status" ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."credit_affiliate_subscription_commission"();



CREATE OR REPLACE TRIGGER "trg_user_subscriptions_affiliate_prepare" BEFORE INSERT OR UPDATE OF "user_id", "plan_id", "status" ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."prepare_user_subscription_affiliate_commission"();



CREATE OR REPLACE TRIGGER "trg_user_subscriptions_updated_at" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_validate_download_license" BEFORE INSERT OR UPDATE ON "public"."book_downloads" FOR EACH ROW EXECUTE FUNCTION "public"."validate_download_license"();



CREATE OR REPLACE TRIGGER "trg_validate_order_item_format" BEFORE INSERT OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."validate_order_item_format"();



CREATE OR REPLACE TRIGGER "trg_validate_payment_order" BEFORE INSERT OR UPDATE ON "public"."payment_attempts" FOR EACH ROW EXECUTE FUNCTION "public"."validate_payment_order"();



CREATE OR REPLACE TRIGGER "trg_validate_withdrawal_account" BEFORE INSERT OR UPDATE ON "public"."affiliate_withdrawals" FOR EACH ROW EXECUTE FUNCTION "public"."validate_withdrawal_account"();



ALTER TABLE ONLY "public"."academic_taxonomies"
    ADD CONSTRAINT "academic_taxonomies_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."academic_taxonomies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ad_assignments"
    ADD CONSTRAINT "ad_assignments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ad_assignments"
    ADD CONSTRAINT "ad_assignments_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "public"."ad_creatives"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ad_assignments"
    ADD CONSTRAINT "ad_assignments_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "public"."ad_placements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ad_creatives"
    ADD CONSTRAINT "ad_creatives_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ad_events"
    ADD CONSTRAINT "ad_events_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."ad_assignments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ad_events"
    ADD CONSTRAINT "ad_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_book_import_batches"
    ADD CONSTRAINT "admin_book_import_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_book_import_items"
    ADD CONSTRAINT "admin_book_import_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."admin_book_import_batches"("id") ON DELETE CASCADE NOT VALID;



ALTER TABLE ONLY "public"."admin_book_import_items"
    ADD CONSTRAINT "admin_book_import_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_book_import_items"
    ADD CONSTRAINT "admin_book_import_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."affiliate_order_transactions"
    ADD CONSTRAINT "affiliate_order_transactions_affiliate_user_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_order_transactions"
    ADD CONSTRAINT "affiliate_order_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_order_transactions"
    ADD CONSTRAINT "affiliate_order_transactions_purchased_book_id_fkey" FOREIGN KEY ("purchased_book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_order_transactions"
    ADD CONSTRAINT "affiliate_order_transactions_referral_source_book_id_fkey" FOREIGN KEY ("referral_source_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."affiliate_order_transactions"
    ADD CONSTRAINT "affiliate_order_transactions_referral_source_plan_id_fkey" FOREIGN KEY ("referral_source_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."affiliate_order_transactions"
    ADD CONSTRAINT "affiliate_order_transactions_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_payout_accounts"
    ADD CONSTRAINT "affiliate_payout_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."affiliate_wallet_transactions"
    ADD CONSTRAINT "affiliate_wallet_transactions_affiliate_user_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_wallet_transactions"
    ADD CONSTRAINT "affiliate_wallet_transactions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."affiliate_wallet_transactions"
    ADD CONSTRAINT "affiliate_wallet_transactions_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_wallet_transactions"
    ADD CONSTRAINT "affiliate_wallet_transactions_source_book_id_fkey" FOREIGN KEY ("source_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."affiliate_wallet_transactions"
    ADD CONSTRAINT "affiliate_wallet_transactions_source_plan_id_fkey" FOREIGN KEY ("source_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."affiliate_wallet_transactions"
    ADD CONSTRAINT "affiliate_wallet_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_withdrawals"
    ADD CONSTRAINT "affiliate_withdrawals_payout_account_id_fkey" FOREIGN KEY ("payout_account_id") REFERENCES "public"."affiliate_payout_accounts"("id");



ALTER TABLE ONLY "public"."affiliate_withdrawals"
    ADD CONSTRAINT "affiliate_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."author_payout_accounts"
    ADD CONSTRAINT "author_payout_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."author_payouts"
    ADD CONSTRAINT "author_payouts_payout_account_id_fkey" FOREIGN KEY ("payout_account_id") REFERENCES "public"."author_payout_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."author_payouts"
    ADD CONSTRAINT "author_payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."author_royalty_accounts"
    ADD CONSTRAINT "author_royalty_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."author_royalty_transactions"
    ADD CONSTRAINT "author_royalty_transactions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."author_royalty_transactions"
    ADD CONSTRAINT "author_royalty_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."author_royalty_transactions"
    ADD CONSTRAINT "author_royalty_transactions_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."author_royalty_transactions"
    ADD CONSTRAINT "author_royalty_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_academic_taxonomy"
    ADD CONSTRAINT "book_academic_taxonomy_academic_taxonomy_id_fkey" FOREIGN KEY ("academic_taxonomy_id") REFERENCES "public"."academic_taxonomies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_academic_taxonomy"
    ADD CONSTRAINT "book_academic_taxonomy_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_assets"
    ADD CONSTRAINT "book_assets_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_assets"
    ADD CONSTRAINT "book_assets_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "public"."book_formats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."author_profiles"("id");



ALTER TABLE ONLY "public"."book_authors"
    ADD CONSTRAINT "book_authors_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_categories"
    ADD CONSTRAINT "book_categories_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_categories"
    ADD CONSTRAINT "book_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_distribution_settings"
    ADD CONSTRAINT "book_distribution_settings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_downloads"
    ADD CONSTRAINT "book_downloads_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."book_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_downloads"
    ADD CONSTRAINT "book_downloads_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_downloads"
    ADD CONSTRAINT "book_downloads_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_downloads"
    ADD CONSTRAINT "book_downloads_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "public"."book_formats"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_downloads"
    ADD CONSTRAINT "book_downloads_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "public"."offline_reading_licenses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_downloads"
    ADD CONSTRAINT "book_downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_editorial_events"
    ADD CONSTRAINT "book_editorial_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_editorial_events"
    ADD CONSTRAINT "book_editorial_events_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_engagement_events"
    ADD CONSTRAINT "book_engagement_events_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_engagement_events"
    ADD CONSTRAINT "book_engagement_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_favorites"
    ADD CONSTRAINT "book_favorites_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_favorites"
    ADD CONSTRAINT "book_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_formats"
    ADD CONSTRAINT "book_formats_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_manuscript_versions"
    ADD CONSTRAINT "book_manuscript_versions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_manuscript_versions"
    ADD CONSTRAINT "book_manuscript_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_market_prices"
    ADD CONSTRAINT "book_market_prices_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_reader_sessions"
    ADD CONSTRAINT "book_reader_sessions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_reader_sessions"
    ADD CONSTRAINT "book_reader_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_admin_import_batch_id_fkey" FOREIGN KEY ("admin_import_batch_id") REFERENCES "public"."admin_book_import_batches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_admin_import_item_id_fkey" FOREIGN KEY ("admin_import_item_id") REFERENCES "public"."admin_book_import_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_admin_imported_by_fkey" FOREIGN KEY ("admin_imported_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_author_profile_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."author_profiles"("id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_bat_approved_by_fkey" FOREIGN KEY ("bat_approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_copyright_blocked_by_fkey" FOREIGN KEY ("copyright_blocked_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_imprint_fk" FOREIGN KEY ("imprint_id") REFERENCES "public"."publishing_imprints"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_publishing_house_fk" FOREIGN KEY ("publishing_house_id") REFERENCES "public"."publishing_houses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."editorial_training_requests"
    ADD CONSTRAINT "editorial_training_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_device_record_id_fkey" FOREIGN KEY ("device_record_id") REFERENCES "public"."user_devices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_granted_by_format_id_fkey" FOREIGN KEY ("granted_by_format_id") REFERENCES "public"."book_formats"("id");



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_granted_by_order_id_fkey" FOREIGN KEY ("granted_by_order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_granted_by_plan_id_fkey" FOREIGN KEY ("granted_by_plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."library"
    ADD CONSTRAINT "library_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_chapters"
    ADD CONSTRAINT "media_chapters_media_edition_id_fkey" FOREIGN KEY ("media_edition_id") REFERENCES "public"."media_editions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_editions"
    ADD CONSTRAINT "media_editions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mobile_app_configs"
    ADD CONSTRAINT "mobile_app_configs_current_android_version_fkey" FOREIGN KEY ("current_android_version_id") REFERENCES "public"."mobile_app_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mobile_app_configs"
    ADD CONSTRAINT "mobile_app_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mobile_app_trial_grants"
    ADD CONSTRAINT "mobile_app_trial_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mobile_app_versions"
    ADD CONSTRAINT "mobile_app_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offline_reading_licenses"
    ADD CONSTRAINT "offline_reading_licenses_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."book_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offline_reading_licenses"
    ADD CONSTRAINT "offline_reading_licenses_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offline_reading_licenses"
    ADD CONSTRAINT "offline_reading_licenses_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offline_reading_licenses"
    ADD CONSTRAINT "offline_reading_licenses_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "public"."book_formats"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offline_reading_licenses"
    ADD CONSTRAINT "offline_reading_licenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "public"."book_formats"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_promotion_fk" FOREIGN KEY ("promotion_campaign_id") REFERENCES "public"."promotion_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."platform_audit_events"
    ADD CONSTRAINT "platform_audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_affiliate_source_book_id_fkey" FOREIGN KEY ("affiliate_source_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_affiliate_source_plan_id_fkey" FOREIGN KEY ("affiliate_source_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referred_by_affiliate_user_id_fkey" FOREIGN KEY ("referred_by_affiliate_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promotion_campaigns"
    ADD CONSTRAINT "promotion_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promotion_events"
    ADD CONSTRAINT "promotion_events_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promotion_events"
    ADD CONSTRAINT "promotion_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promotion_events"
    ADD CONSTRAINT "promotion_events_promotion_campaign_id_fkey" FOREIGN KEY ("promotion_campaign_id") REFERENCES "public"."promotion_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promotion_events"
    ADD CONSTRAINT "promotion_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."publishing_house_members"
    ADD CONSTRAINT "publishing_house_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publishing_house_members"
    ADD CONSTRAINT "publishing_house_members_publishing_house_id_fkey" FOREIGN KEY ("publishing_house_id") REFERENCES "public"."publishing_houses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publishing_imprints"
    ADD CONSTRAINT "publishing_imprints_publishing_house_id_fkey" FOREIGN KEY ("publishing_house_id") REFERENCES "public"."publishing_houses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publishing_review_cases"
    ADD CONSTRAINT "publishing_review_cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."publishing_review_cases"
    ADD CONSTRAINT "publishing_review_cases_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."author_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."publishing_review_cases"
    ADD CONSTRAINT "publishing_review_cases_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."publishing_review_cases"
    ADD CONSTRAINT "publishing_review_cases_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."push_notification_tokens"
    ADD CONSTRAINT "push_notification_tokens_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_notification_tokens"
    ADD CONSTRAINT "push_notification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_hidden_by_fkey" FOREIGN KEY ("hidden_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reader_affiliate_profiles"
    ADD CONSTRAINT "reader_affiliate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_device_record_id_fkey" FOREIGN KEY ("device_record_id") REFERENCES "public"."user_devices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "public"."book_formats"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_sync_queue"
    ADD CONSTRAINT "reading_sync_queue_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_sync_queue"
    ADD CONSTRAINT "reading_sync_queue_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_sync_queue"
    ADD CONSTRAINT "reading_sync_queue_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "public"."book_formats"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reading_sync_queue"
    ADD CONSTRAINT "reading_sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rights_acquisition_targets"
    ADD CONSTRAINT "rights_acquisition_targets_author_profile_id_fkey" FOREIGN KEY ("author_profile_id") REFERENCES "public"."author_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rights_contracts"
    ADD CONSTRAINT "rights_contracts_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rights_contracts"
    ADD CONSTRAINT "rights_contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rights_contracts"
    ADD CONSTRAINT "rights_contracts_publishing_house_id_fkey" FOREIGN KEY ("publishing_house_id") REFERENCES "public"."publishing_houses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscription_plan_books"
    ADD CONSTRAINT "subscription_plan_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_plan_books"
    ADD CONSTRAINT "subscription_plan_books_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_affiliate_source_book_id_fkey" FOREIGN KEY ("affiliate_source_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_affiliate_source_plan_id_fkey" FOREIGN KEY ("affiliate_source_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_affiliate_user_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin full affiliate order transactions access" ON "public"."affiliate_order_transactions" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full affiliate wallet transactions access" ON "public"."affiliate_wallet_transactions" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full author profiles access" ON "public"."author_profiles" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full blog posts access" ON "public"."blog_posts" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full book engagement events access" ON "public"."book_engagement_events" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full book favorites access" ON "public"."book_favorites" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full books access" ON "public"."books" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full editorial training requests access" ON "public"."editorial_training_requests" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full flash sale configs access" ON "public"."flash_sale_configs" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full formats access" ON "public"."book_formats" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full highlights access" ON "public"."highlights" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full home featured configs access" ON "public"."home_featured_configs" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full library access" ON "public"."library" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full mobile app config access" ON "public"."mobile_app_configs" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full mobile app trial access" ON "public"."mobile_app_trial_grants" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full order items access" ON "public"."order_items" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full orders access" ON "public"."orders" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full profiles access" ON "public"."profiles" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full ratings access" ON "public"."ratings" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full reader affiliate profiles access" ON "public"."reader_affiliate_profiles" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full subscription mapping access" ON "public"."subscription_plan_books" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full subscription plans access" ON "public"."subscription_plans" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admin full user subscriptions access" ON "public"."user_subscriptions" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Admins insert own book import items" ON "public"."admin_book_import_items" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_current_user_admin"() AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Admins read book import items" ON "public"."admin_book_import_items" FOR SELECT TO "authenticated" USING ("public"."is_current_user_admin"());



CREATE POLICY "Admins update book import items" ON "public"."admin_book_import_items" FOR UPDATE TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "Anyone can create editorial training requests" ON "public"."editorial_training_requests" FOR INSERT WITH CHECK ((("user_id" IS NULL) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Anyone can view active subscription plans" ON "public"."subscription_plans" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view author profiles" ON "public"."author_profiles" FOR SELECT USING (true);



CREATE POLICY "Anyone can view blog posts" ON "public"."blog_posts" FOR SELECT USING (true);



CREATE POLICY "Anyone can view flash sale configs" ON "public"."flash_sale_configs" FOR SELECT USING (true);



CREATE POLICY "Anyone can view public mobile app config" ON "public"."mobile_app_configs" FOR SELECT USING ((("is_public" = true) OR "public"."is_current_user_admin"()));



CREATE POLICY "Anyone can view published subscription mappings" ON "public"."subscription_plan_books" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."subscription_plans" "sp"
     JOIN "public"."books" "b" ON (("b"."id" = "subscription_plan_books"."book_id")))
  WHERE (("sp"."id" = "subscription_plan_books"."plan_id") AND ("sp"."is_active" = true) AND ("b"."status" = ANY (ARRAY['published'::"text", 'coming_soon'::"text"]))))));



CREATE POLICY "Author can view own sales items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "order_items"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can create books" ON "public"."books" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can delete own formats" ON "public"."book_formats" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_formats"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can delete own subscription mappings" ON "public"."subscription_plan_books" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "subscription_plan_books"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can insert own author profile" ON "public"."author_profiles" FOR INSERT WITH CHECK ((("auth"."uid"() = "id") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['author'::"text", 'admin'::"text"])))))));



CREATE POLICY "Authors can insert own formats" ON "public"."book_formats" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_formats"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can insert own subscription mappings" ON "public"."subscription_plan_books" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "subscription_plan_books"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can update own author profile" ON "public"."author_profiles" FOR UPDATE USING ((("auth"."uid"() = "id") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['author'::"text", 'admin'::"text"]))))))) WITH CHECK ((("auth"."uid"() = "id") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['author'::"text", 'admin'::"text"])))))));



CREATE POLICY "Authors can update own books" ON "public"."books" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can update own formats" ON "public"."book_formats" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_formats"."book_id") AND ("b"."author_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_formats"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can update own subscription mappings" ON "public"."subscription_plan_books" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "subscription_plan_books"."book_id") AND ("b"."author_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "subscription_plan_books"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can view own books" ON "public"."books" FOR SELECT USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can view own formats" ON "public"."book_formats" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_formats"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can view own subscription mappings" ON "public"."subscription_plan_books" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "subscription_plan_books"."book_id") AND ("b"."author_id" = "auth"."uid"())))));



CREATE POLICY "Reader sees own library" ON "public"."library" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Reader sees own order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "Reader sees own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can delete own book favorites" ON "public"."book_favorites" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can delete own highlights" ON "public"."highlights" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can insert own book favorites" ON "public"."book_favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can insert own highlights" ON "public"."highlights" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can insert own subscriptions" ON "public"."user_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can update own highlights" ON "public"."highlights" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can update own subscriptions" ON "public"."user_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can view own affiliate order transactions" ON "public"."affiliate_order_transactions" FOR SELECT USING (("auth"."uid"() = "affiliate_user_id"));



CREATE POLICY "Readers can view own affiliate profile" ON "public"."reader_affiliate_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can view own affiliate wallet transactions" ON "public"."affiliate_wallet_transactions" FOR SELECT USING (("auth"."uid"() = "affiliate_user_id"));



CREATE POLICY "Readers can view own book favorites" ON "public"."book_favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can view own highlights" ON "public"."highlights" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can view own mobile app trial" ON "public"."mobile_app_trial_grants" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Readers can view own subscriptions" ON "public"."user_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can see own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."academic_taxonomies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_creatives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_placements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_book_import_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_book_import_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliate_accounts_own" ON "public"."affiliate_payout_accounts" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."affiliate_order_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliate_orders_read" ON "public"."affiliate_order_transactions" FOR SELECT TO "authenticated" USING ((("affiliate_user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."affiliate_payout_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliate_profile_read" ON "public"."reader_affiliate_profiles" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "affiliate_wallet_read" ON "public"."affiliate_wallet_transactions" FOR SELECT TO "authenticated" USING ((("affiliate_user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."affiliate_wallet_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliate_withdrawals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliate_withdrawals_read" ON "public"."affiliate_withdrawals" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "assets_author_manage" ON "public"."book_assets" TO "authenticated" USING (("public"."owns_book"("book_id") OR "public"."is_admin"())) WITH CHECK (("public"."owns_book"("book_id") OR "public"."is_admin"()));



CREATE POLICY "assets_read" ON "public"."book_assets" FOR SELECT TO "authenticated", "anon" USING (((("asset_type" = ANY (ARRAY['cover'::"text", 'thumbnail'::"text", 'sample'::"text"])) AND ("is_published" = true)) OR (("asset_type" = 'full_book'::"text") AND "public"."has_book_access"("book_id")) OR "public"."owns_book"("book_id") OR "public"."is_admin"()));



ALTER TABLE "public"."author_payout_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."author_payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."author_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."author_royalty_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."author_royalty_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authors_public_read" ON "public"."author_profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "authors_update_self" ON "public"."author_profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_academic_taxonomy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_authors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "book_categories_public_read" ON "public"."book_categories" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."book_distribution_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_downloads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "book_downloads_delete_own" ON "public"."book_downloads" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "book_downloads_insert_own" ON "public"."book_downloads" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "book_downloads_select_own" ON "public"."book_downloads" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "book_downloads_update_own" ON "public"."book_downloads" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."book_editorial_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_engagement_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_formats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_manuscript_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_market_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_reader_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "books_author_insert" ON "public"."books" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "books_author_update" ON "public"."books" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("author_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_admin_manage" ON "public"."categories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "categories_public_read" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "devices_own" ON "public"."user_devices" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "downloads_own" ON "public"."book_downloads" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "editorial_event_own_author" ON "public"."book_editorial_events" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_editorial_events"."book_id") AND ("b"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR "public"."is_current_user_admin"()));



ALTER TABLE "public"."editorial_training_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "favorites_own" ON "public"."book_favorites" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."flash_sale_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "formats_author_manage" ON "public"."book_formats" TO "authenticated" USING (("public"."owns_book"("book_id") OR "public"."is_admin"())) WITH CHECK (("public"."owns_book"("book_id") OR "public"."is_admin"()));



CREATE POLICY "hb_academic_link_owner_or_admin" ON "public"."book_academic_taxonomy" TO "authenticated" USING (("public"."is_current_user_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_academic_taxonomy"."book_id") AND ("b"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))))) WITH CHECK (("public"."is_current_user_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_academic_taxonomy"."book_id") AND ("b"."author_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "hb_academic_taxonomy_admin_write" ON "public"."academic_taxonomies" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."ad_assignments" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."ad_campaigns" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."ad_creatives" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."ad_events" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."ad_placements" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."author_payout_accounts" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."author_payouts" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."author_royalty_accounts" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."author_royalty_transactions" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."book_distribution_settings" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."book_manuscript_versions" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."book_market_prices" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."book_reader_sessions" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."media_chapters" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."media_editions" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."platform_audit_events" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."promotion_campaigns" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."promotion_events" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."publishing_house_members" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."publishing_houses" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."publishing_imprints" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."publishing_review_cases" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."rights_acquisition_targets" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_all" ON "public"."rights_contracts" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_admin_editorial_event_insert" ON "public"."book_editorial_events" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_current_user_admin"() AND ("actor_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "hb_author_book_distribution" ON "public"."book_distribution_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_distribution_settings"."book_id") AND ("b"."author_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_distribution_settings"."book_id") AND ("b"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "hb_author_read_cases" ON "public"."publishing_review_cases" FOR SELECT TO "authenticated" USING (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "hb_author_read_manuscripts" ON "public"."book_manuscript_versions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_manuscript_versions"."book_id") AND ("b"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "hb_author_read_own" ON "public"."author_payout_accounts" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "hb_author_read_own" ON "public"."author_payouts" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "hb_author_read_own" ON "public"."author_royalty_accounts" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "hb_author_read_own" ON "public"."author_royalty_transactions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "hb_author_update_payout_account" ON "public"."author_payout_accounts" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("is_verified" = false)));



CREATE POLICY "hb_manage_book_authors_admin" ON "public"."book_authors" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());



CREATE POLICY "hb_no_self_review_insert" ON "public"."ratings" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "ratings"."book_id") AND ("b"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "hb_no_self_review_update" ON "public"."ratings" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "ratings"."book_id") AND ("b"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "hb_public_book_visibility" ON "public"."books" FOR SELECT TO "authenticated", "anon" USING (((((("status" = 'published'::"text") AND ("review_status" = 'approved'::"text")) OR ("status" = 'coming_soon'::"text")) AND (COALESCE("copyright_status", 'review'::"text") <> 'blocked'::"text")) OR ("author_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_current_user_admin"()));



CREATE POLICY "hb_public_published_formats" ON "public"."book_formats" FOR SELECT TO "authenticated", "anon" USING (("is_published" AND (EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_formats"."book_id") AND ("b"."status" = 'published'::"text") AND ("b"."review_status" = 'approved'::"text") AND ("b"."copyright_status" = 'clear'::"text"))))));



CREATE POLICY "hb_read_active_imprints" ON "public"."publishing_imprints" FOR SELECT TO "authenticated", "anon" USING (("is_active" AND (EXISTS ( SELECT 1
   FROM "public"."publishing_houses" "ph"
  WHERE (("ph"."id" = "publishing_imprints"."publishing_house_id") AND ("ph"."status" = 'active'::"text"))))));



CREATE POLICY "hb_read_active_promotions" ON "public"."promotion_campaigns" FOR SELECT TO "authenticated", "anon" USING (("is_active" AND (("starts_at" IS NULL) OR ("starts_at" <= "now"())) AND (("ends_at" IS NULL) OR ("ends_at" >= "now"()))));



CREATE POLICY "hb_read_active_publishing_houses" ON "public"."publishing_houses" FOR SELECT TO "authenticated", "anon" USING (("status" = 'active'::"text"));



CREATE POLICY "hb_read_book_authors" ON "public"."book_authors" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_authors"."book_id") AND ("b"."status" = 'published'::"text") AND ("b"."review_status" = 'approved'::"text") AND ("b"."copyright_status" = 'clear'::"text")))));



ALTER TABLE "public"."highlights" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "highlights_own" ON "public"."highlights" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."home_featured_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "import_batches_admin" ON "public"."admin_book_import_batches" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "import_items_admin" ON "public"."admin_book_import_items" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."library" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "library_read_own" ON "public"."library" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "licenses_read" ON "public"."offline_reading_licenses" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."media_chapters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_editions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mobile engagement authenticated insert" ON "public"."book_engagement_events" FOR INSERT TO "authenticated" WITH CHECK ((("event_type" = ANY (ARRAY['detail_view'::"text", 'reader_open'::"text", 'file_access'::"text"])) AND ("is_authenticated" = true)));



CREATE POLICY "mobile engagement insert" ON "public"."book_engagement_events" FOR INSERT WITH CHECK ((("event_type" = ANY (ARRAY['detail_view'::"text", 'reader_open'::"text", 'file_access'::"text"])) AND (("auth"."uid"() = "user_id") OR ("user_id" IS NULL))));



CREATE POLICY "mobile favorites own" ON "public"."book_favorites" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "mobile highlights own" ON "public"."highlights" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "mobile library read own" ON "public"."library" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "mobile progress own" ON "public"."reading_progress" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "mobile published assets read" ON "public"."book_assets" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."mobile_app_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mobile_app_trial_grants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mobile_app_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mobile_versions_admin_manage" ON "public"."mobile_app_versions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "mobile_versions_public_read" ON "public"."mobile_app_versions" FOR SELECT TO "authenticated", "anon" USING ((("is_published" = true) OR "public"."is_admin"()));



CREATE POLICY "offline_licenses_admin_manage" ON "public"."offline_reading_licenses" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "offline_licenses_select_own" ON "public"."offline_reading_licenses" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."offline_reading_licenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_read_own" ON "public"."order_items" FOR SELECT TO "authenticated" USING (("public"."owns_order"("order_id") OR "public"."is_admin"()));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_read_own" ON "public"."orders" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."payment_attempts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_attempts_admin_manage" ON "public"."payment_attempts" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "payment_attempts_read" ON "public"."payment_attempts" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "payment_attempts_select_own" ON "public"."payment_attempts" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."platform_audit_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profile_read_self" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "profile_update_self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "progress_own" ON "public"."reading_progress" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."promotion_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotion_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_book_taxonomies" ON "public"."book_academic_taxonomy" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_academic_taxonomy"."book_id") AND ("b"."status" = 'published'::"text") AND ("b"."copyright_status" <> 'blocked'::"text")))));



CREATE POLICY "public_catalog_taxonomies" ON "public"."academic_taxonomies" FOR SELECT TO "authenticated", "anon" USING ("is_active");



ALTER TABLE "public"."publishing_house_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publishing_houses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publishing_imprints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publishing_review_cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_notification_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "push_tokens_delete_own" ON "public"."push_notification_tokens" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "push_tokens_insert_own" ON "public"."push_notification_tokens" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "push_tokens_own" ON "public"."push_notification_tokens" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "push_tokens_select_own" ON "public"."push_notification_tokens" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "push_tokens_update_own" ON "public"."push_notification_tokens" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ratings_delete" ON "public"."ratings" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "ratings_insert" ON "public"."ratings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ratings_read" ON "public"."ratings" FOR SELECT TO "authenticated", "anon" USING (((NOT "is_hidden") OR (( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_current_user_admin"()));



CREATE POLICY "ratings_update" ON "public"."ratings" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."reader_affiliate_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_sync_queue" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reading_sync_queue_delete_own" ON "public"."reading_sync_queue" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "reading_sync_queue_insert_own" ON "public"."reading_sync_queue" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "reading_sync_queue_select_own" ON "public"."reading_sync_queue" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "reading_sync_queue_update_own" ON "public"."reading_sync_queue" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."rights_acquisition_targets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rights_contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plan_books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_read_own" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "sync_own" ON "public"."reading_sync_queue" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_devices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_devices_delete_own" ON "public"."user_devices" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "user_devices_insert_own" ON "public"."user_devices" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "user_devices_select_own" ON "public"."user_devices" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "user_devices_update_own" ON "public"."user_devices" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."_sync_library_access_for_order"("p_order_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_sync_library_access_for_order"("p_order_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_import_published_book"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_confirm_rights" boolean, "p_title" "text", "p_description" "text", "p_author_id" "uuid", "p_author_display_name" "text", "p_language" "text", "p_category" "text", "p_price" numeric, "p_currency_code" "text", "p_file_path" "text", "p_cover_path" "text", "p_original_file_name" "text", "p_file_size" bigint, "p_page_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_import_published_book"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_confirm_rights" boolean, "p_title" "text", "p_description" "text", "p_author_id" "uuid", "p_author_display_name" "text", "p_language" "text", "p_category" "text", "p_price" numeric, "p_currency_code" "text", "p_file_path" "text", "p_cover_path" "text", "p_original_file_name" "text", "p_file_size" bigint, "p_page_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_import_published_book"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_confirm_rights" boolean, "p_title" "text", "p_description" "text", "p_author_id" "uuid", "p_author_display_name" "text", "p_language" "text", "p_category" "text", "p_price" numeric, "p_currency_code" "text", "p_file_path" "text", "p_cover_path" "text", "p_original_file_name" "text", "p_file_size" bigint, "p_page_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_import_published_book"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_confirm_rights" boolean, "p_title" "text", "p_description" "text", "p_author_id" "uuid", "p_author_display_name" "text", "p_language" "text", "p_category" "text", "p_price" numeric, "p_currency_code" "text", "p_file_path" "text", "p_cover_path" "text", "p_original_file_name" "text", "p_file_size" bigint, "p_page_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON TABLE "public"."mobile_app_trial_grants" TO "anon";
GRANT ALL ON TABLE "public"."mobile_app_trial_grants" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_app_trial_grants" TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_current_user_mobile_app_trial"("p_trial_days" integer, "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."claim_current_user_mobile_app_trial"("p_trial_days" integer, "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_current_user_mobile_app_trial"("p_trial_days" integer, "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."credit_affiliate_paid_order_commission"() TO "anon";
GRANT ALL ON FUNCTION "public"."credit_affiliate_paid_order_commission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."credit_affiliate_paid_order_commission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."credit_affiliate_subscription_commission"() TO "anon";
GRANT ALL ON FUNCTION "public"."credit_affiliate_subscription_commission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."credit_affiliate_subscription_commission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_author_book_format_delete_workflow"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_author_book_format_delete_workflow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_author_book_format_delete_workflow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_author_book_format_workflow"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_author_book_format_workflow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_author_book_format_workflow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_author_book_submission_workflow"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_author_book_submission_workflow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_author_book_submission_workflow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_book_publication_rights"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_book_publication_rights"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_book_publication_rights"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_author_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_author_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_author_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_reader_affiliate_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_reader_affiliate_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_reader_affiliate_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_reader_affiliate_code"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_reader_affiliate_code"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_reader_affiliate_code"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_affiliate_payout_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_affiliate_payout_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_affiliate_payout_account"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_book_admin_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_book_admin_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_book_admin_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_device_security"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_device_security"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_device_security"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_profile_sensitive_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_profile_sensitive_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_profile_sensitive_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_book_engagement_views_automation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_book_engagement_views_automation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_book_engagement_views_automation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_order_items_automation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_order_items_automation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_order_items_automation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_orders_payment_status_automation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_orders_payment_status_automation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_orders_payment_status_automation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_ratings_automation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_ratings_automation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_ratings_automation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_reader_affiliate_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_reader_affiliate_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_reader_affiliate_profile"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_book_access"("p_book_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_book_access"("p_book_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_book_access"("p_book_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_book_access"("p_book_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hb_admin_transition_book"("p_book_id" "uuid", "p_action" "text", "p_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hb_admin_transition_book"("p_book_id" "uuid", "p_action" "text", "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hb_admin_transition_book"("p_book_id" "uuid", "p_action" "text", "p_note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hb_book_workflow_guard"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hb_book_workflow_guard"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."hb_guard_reader_rating"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hb_guard_reader_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hb_guard_reader_rating"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_affiliate_source_type"("p_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_affiliate_source_type"("p_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_affiliate_source_type"("p_value" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."owns_book"("p_book_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."owns_book"("p_book_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owns_book"("p_book_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owns_book"("p_book_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."owns_order"("p_order_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."owns_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owns_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owns_order"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."admin_book_import_items" TO "anon";
GRANT ALL ON TABLE "public"."admin_book_import_items" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_book_import_items" TO "service_role";



REVOKE ALL ON FUNCTION "public"."prepare_admin_book_import_item"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_source_file_name" "text", "p_source_file_size_bytes" bigint, "p_file_path" "text", "p_cover_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prepare_admin_book_import_item"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_source_file_name" "text", "p_source_file_size_bytes" bigint, "p_file_path" "text", "p_cover_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."prepare_admin_book_import_item"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_source_file_name" "text", "p_source_file_size_bytes" bigint, "p_file_path" "text", "p_cover_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."prepare_admin_book_import_item"("p_batch_id" "uuid", "p_item_id" "uuid", "p_checksum" "text", "p_source_file_name" "text", "p_source_file_size_bytes" bigint, "p_file_path" "text", "p_cover_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."prepare_user_subscription_affiliate_commission"() TO "anon";
GRANT ALL ON FUNCTION "public"."prepare_user_subscription_affiliate_commission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prepare_user_subscription_affiliate_commission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_admin_book_import_item_identity"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_admin_book_import_item_identity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_admin_book_import_item_identity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."refresh_book_derived_stats"("p_book_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_book_derived_stats"("p_book_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."refresh_book_purchases_stats"("p_book_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_book_purchases_stats"("p_book_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."refresh_book_rating_stats"("p_book_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_book_rating_stats"("p_book_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."refresh_book_views_stats"("p_book_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_book_views_stats"("p_book_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_profile_affiliate_referral"() TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_profile_affiliate_referral"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_profile_affiliate_referral"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_uuid"("p_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_uuid"("p_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_uuid"("p_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_book_for_review"("p_book_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_book_for_review"("p_book_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_book_for_review"("p_book_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_book_for_review"("p_book_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_library_access_for_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_library_access_for_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_library_access_for_order"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_book_engagement"("p_book_id" "uuid", "p_event_type" "text", "p_source" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."track_book_engagement"("p_book_id" "uuid", "p_event_type" "text", "p_source" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_book_engagement"("p_book_id" "uuid", "p_event_type" "text", "p_source" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_book_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_book_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_book_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_access_to_book"("p_user_id" "uuid", "p_book_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_access_to_book"("p_user_id" "uuid", "p_book_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_access_to_book"("p_user_id" "uuid", "p_book_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_asset_relation"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_asset_relation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_asset_relation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_book_format_relation"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_book_format_relation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_book_format_relation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_download_license"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_download_license"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_download_license"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_order_item_format"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_order_item_format"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_order_item_format"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_payment_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_payment_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_payment_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_withdrawal_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_withdrawal_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_withdrawal_account"() TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";









GRANT ALL ON TABLE "public"."academic_taxonomies" TO "service_role";
GRANT SELECT ON TABLE "public"."academic_taxonomies" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."academic_taxonomies" TO "authenticated";



GRANT ALL ON TABLE "public"."ad_assignments" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ad_assignments" TO "authenticated";



GRANT ALL ON TABLE "public"."ad_campaigns" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ad_campaigns" TO "authenticated";



GRANT ALL ON TABLE "public"."ad_creatives" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ad_creatives" TO "authenticated";



GRANT ALL ON TABLE "public"."ad_events" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ad_events" TO "authenticated";



GRANT ALL ON TABLE "public"."ad_placements" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ad_placements" TO "authenticated";



GRANT ALL ON TABLE "public"."admin_book_import_batches" TO "anon";
GRANT ALL ON TABLE "public"."admin_book_import_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_book_import_batches" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_order_transactions" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_order_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_order_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_payout_accounts" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_payout_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_payout_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_wallet_transactions" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_withdrawals" TO "service_role";



GRANT ALL ON TABLE "public"."author_payout_accounts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."author_payout_accounts" TO "authenticated";



GRANT ALL ON TABLE "public"."author_payouts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."author_payouts" TO "authenticated";



GRANT ALL ON TABLE "public"."author_profiles" TO "anon";
GRANT ALL ON TABLE "public"."author_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."author_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."author_royalty_accounts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."author_royalty_accounts" TO "authenticated";



GRANT ALL ON TABLE "public"."author_royalty_transactions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."author_royalty_transactions" TO "authenticated";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."book_academic_taxonomy" TO "service_role";
GRANT SELECT ON TABLE "public"."book_academic_taxonomy" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."book_academic_taxonomy" TO "authenticated";



GRANT ALL ON TABLE "public"."book_assets" TO "anon";
GRANT ALL ON TABLE "public"."book_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."book_assets" TO "service_role";



GRANT ALL ON TABLE "public"."book_authors" TO "anon";
GRANT ALL ON TABLE "public"."book_authors" TO "authenticated";
GRANT ALL ON TABLE "public"."book_authors" TO "service_role";



GRANT ALL ON TABLE "public"."book_categories" TO "anon";
GRANT ALL ON TABLE "public"."book_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."book_categories" TO "service_role";



GRANT ALL ON TABLE "public"."book_distribution_settings" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."book_distribution_settings" TO "authenticated";



GRANT ALL ON TABLE "public"."book_downloads" TO "anon";
GRANT ALL ON TABLE "public"."book_downloads" TO "authenticated";
GRANT ALL ON TABLE "public"."book_downloads" TO "service_role";



GRANT ALL ON TABLE "public"."book_editorial_events" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."book_editorial_events" TO "authenticated";



GRANT ALL ON TABLE "public"."book_engagement_events" TO "anon";
GRANT ALL ON TABLE "public"."book_engagement_events" TO "authenticated";
GRANT ALL ON TABLE "public"."book_engagement_events" TO "service_role";



GRANT ALL ON TABLE "public"."book_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."book_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."book_formats" TO "anon";
GRANT ALL ON TABLE "public"."book_formats" TO "authenticated";
GRANT ALL ON TABLE "public"."book_formats" TO "service_role";



GRANT ALL ON TABLE "public"."book_manuscript_versions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."book_manuscript_versions" TO "authenticated";



GRANT ALL ON TABLE "public"."book_market_prices" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."book_market_prices" TO "authenticated";



GRANT ALL ON TABLE "public"."book_reader_sessions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."book_reader_sessions" TO "authenticated";



GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."editorial_training_requests" TO "anon";
GRANT ALL ON TABLE "public"."editorial_training_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."editorial_training_requests" TO "service_role";



GRANT ALL ON TABLE "public"."flash_sale_configs" TO "anon";
GRANT ALL ON TABLE "public"."flash_sale_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."flash_sale_configs" TO "service_role";



GRANT ALL ON TABLE "public"."highlights" TO "anon";
GRANT ALL ON TABLE "public"."highlights" TO "authenticated";
GRANT ALL ON TABLE "public"."highlights" TO "service_role";



GRANT ALL ON TABLE "public"."home_featured_configs" TO "anon";
GRANT ALL ON TABLE "public"."home_featured_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."home_featured_configs" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."library" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."library" TO "authenticated";
GRANT ALL ON TABLE "public"."library" TO "service_role";



GRANT ALL ON TABLE "public"."media_chapters" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."media_chapters" TO "authenticated";



GRANT ALL ON TABLE "public"."media_editions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."media_editions" TO "authenticated";



GRANT ALL ON TABLE "public"."mobile_app_configs" TO "anon";
GRANT ALL ON TABLE "public"."mobile_app_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_app_configs" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_app_versions" TO "anon";
GRANT ALL ON TABLE "public"."mobile_app_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_app_versions" TO "service_role";



GRANT ALL ON TABLE "public"."offline_reading_licenses" TO "anon";
GRANT ALL ON TABLE "public"."offline_reading_licenses" TO "authenticated";
GRANT ALL ON TABLE "public"."offline_reading_licenses" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."order_items" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."orders" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_attempts" TO "anon";
GRANT ALL ON TABLE "public"."payment_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."platform_audit_events" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."platform_audit_events" TO "authenticated";



GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("first_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("last_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("phone") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("country") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("city") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("preferred_language") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("favorite_categories") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("marketing_opt_in") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."promotion_campaigns" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."promotion_campaigns" TO "authenticated";



GRANT ALL ON TABLE "public"."promotion_events" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."promotion_events" TO "authenticated";



GRANT ALL ON TABLE "public"."publishing_house_members" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."publishing_house_members" TO "authenticated";



GRANT ALL ON TABLE "public"."publishing_houses" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."publishing_houses" TO "authenticated";



GRANT ALL ON TABLE "public"."publishing_imprints" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."publishing_imprints" TO "authenticated";



GRANT ALL ON TABLE "public"."publishing_review_cases" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."publishing_review_cases" TO "authenticated";



GRANT ALL ON TABLE "public"."push_notification_tokens" TO "anon";
GRANT ALL ON TABLE "public"."push_notification_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."push_notification_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";
GRANT SELECT ON TABLE "public"."ratings" TO "anon";



GRANT ALL ON TABLE "public"."reader_affiliate_profiles" TO "anon";
GRANT ALL ON TABLE "public"."reader_affiliate_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."reader_affiliate_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."reading_sync_queue" TO "anon";
GRANT ALL ON TABLE "public"."reading_sync_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_sync_queue" TO "service_role";



GRANT ALL ON TABLE "public"."rights_acquisition_targets" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rights_acquisition_targets" TO "authenticated";



GRANT ALL ON TABLE "public"."rights_contracts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rights_contracts" TO "authenticated";



GRANT ALL ON TABLE "public"."subscription_plan_books" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plan_books" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plan_books" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."user_devices" TO "anon";
GRANT ALL ON TABLE "public"."user_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."user_devices" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































