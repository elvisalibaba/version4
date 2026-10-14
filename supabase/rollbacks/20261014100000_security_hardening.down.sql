-- =============================================================================
-- ANNULATION de supabase/migrations/20261014100000_security_hardening.sql — restaure l'état du 14/10/2026
-- =============================================================================
-- ATTENTION : rejouer ce fichier RÉOUVRE les failles décrites dans
-- docs/supabase-security-baseline.md (abonnements auto-attribués, file_url public…).
-- À n'utiliser qu'en cas de régression bloquante, le temps de corriger.
-- Généré à partir de la baseline (pg_dump) et du diagnostic Phase 0 du 14/10/2026.
-- =============================================================================

BEGIN;

-- Nouveaux objets
DROP TRIGGER IF EXISTS hb_books_storage_path_guard ON public.books;
DROP TRIGGER IF EXISTS hb_book_formats_storage_path_guard ON public.book_formats;
DROP TRIGGER IF EXISTS hb_audit_no_update_delete ON public.platform_audit_events;
DROP TRIGGER IF EXISTS hb_audit_no_truncate ON public.platform_audit_events;

DROP POLICY IF EXISTS "hb_books_insert_author_or_admin" ON public.books;
DROP POLICY IF EXISTS "hb_audit_admin_read" ON public.platform_audit_events;
DROP POLICY IF EXISTS "hb_audit_admin_insert" ON public.platform_audit_events;
DROP POLICY IF EXISTS "hb_ratings_public_book_insert" ON public.ratings;
DROP POLICY IF EXISTS "hb_ratings_public_book_update" ON public.ratings;
DROP POLICY IF EXISTS "hb_ratings_visible_on_public_books" ON public.ratings;
DROP POLICY IF EXISTS "hb_books_public_covers_read" ON storage.objects;
DROP POLICY IF EXISTS "hb_books_owner_read_non_content" ON storage.objects;
DROP POLICY IF EXISTS "hb_books_owner_update_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "hb_books_owner_delete_own_folder" ON storage.objects;

-- Policies remplacées : suppression puis recréation à l'identique
DROP POLICY IF EXISTS "hb_public_book_visibility" ON public.books;
DROP POLICY IF EXISTS "hb_public_published_formats" ON public.book_formats;
DROP POLICY IF EXISTS "public_book_taxonomies" ON public.book_academic_taxonomy;
DROP POLICY IF EXISTS "book_categories_public_read" ON public.book_categories;
DROP POLICY IF EXISTS "hb_read_book_authors" ON public.book_authors;
DROP POLICY IF EXISTS "Anyone can view published subscription mappings" ON public.subscription_plan_books;
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "Readers can insert own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Readers can update own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "mobile published assets read" ON public.book_assets;
DROP POLICY IF EXISTS "assets_read" ON public.book_assets;
DROP POLICY IF EXISTS "Authors can create books" ON public.books;
DROP POLICY IF EXISTS "books_author_insert" ON public.books;
DROP POLICY IF EXISTS "mobile engagement insert" ON public.book_engagement_events;
DROP POLICY IF EXISTS "mobile engagement authenticated insert" ON public.book_engagement_events;
DROP POLICY IF EXISTS "hb_admin_all" ON public.platform_audit_events;

CREATE POLICY "Readers can insert own subscriptions" ON "public"."user_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Readers can update own subscriptions" ON "public"."user_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "mobile published assets read" ON "public"."book_assets" FOR SELECT USING (("is_published" = true));
CREATE POLICY "assets_read" ON "public"."book_assets" FOR SELECT TO "authenticated", "anon" USING (((("asset_type" = ANY (ARRAY['cover'::"text", 'thumbnail'::"text", 'sample'::"text"])) AND ("is_published" = true)) OR (("asset_type" = 'full_book'::"text") AND "public"."has_book_access"("book_id")) OR "public"."owns_book"("book_id") OR "public"."is_admin"()));
CREATE POLICY "Authors can create books" ON "public"."books" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));
CREATE POLICY "books_author_insert" ON "public"."books" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) OR "public"."is_admin"()));
CREATE POLICY "mobile engagement insert" ON "public"."book_engagement_events" FOR INSERT WITH CHECK ((("event_type" = ANY (ARRAY['detail_view'::"text", 'reader_open'::"text", 'file_access'::"text"])) AND (("auth"."uid"() = "user_id") OR ("user_id" IS NULL))));
CREATE POLICY "mobile engagement authenticated insert" ON "public"."book_engagement_events" FOR INSERT TO "authenticated" WITH CHECK ((("event_type" = ANY (ARRAY['detail_view'::"text", 'reader_open'::"text", 'file_access'::"text"])) AND ("is_authenticated" = true)));
CREATE POLICY "hb_public_book_visibility" ON "public"."books" FOR SELECT TO "authenticated", "anon" USING (((((("status" = 'published'::"text") AND ("review_status" = 'approved'::"text")) OR ("status" = 'coming_soon'::"text")) AND (COALESCE("copyright_status", 'review'::"text") <> 'blocked'::"text")) OR ("author_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_current_user_admin"()));
CREATE POLICY "hb_public_published_formats" ON "public"."book_formats" FOR SELECT TO "authenticated", "anon" USING (("is_published" AND (EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_formats"."book_id") AND ("b"."status" = 'published'::"text") AND ("b"."review_status" = 'approved'::"text") AND ("b"."copyright_status" = 'clear'::"text"))))));
CREATE POLICY "public_book_taxonomies" ON "public"."book_academic_taxonomy" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_academic_taxonomy"."book_id") AND ("b"."status" = 'published'::"text") AND ("b"."copyright_status" <> 'blocked'::"text")))));
CREATE POLICY "book_categories_public_read" ON "public"."book_categories" FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "hb_read_book_authors" ON "public"."book_authors" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."books" "b"
  WHERE (("b"."id" = "book_authors"."book_id") AND ("b"."status" = 'published'::"text") AND ("b"."review_status" = 'approved'::"text") AND ("b"."copyright_status" = 'clear'::"text")))));
CREATE POLICY "Anyone can view published subscription mappings" ON "public"."subscription_plan_books" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."subscription_plans" "sp"
     JOIN "public"."books" "b" ON (("b"."id" = "subscription_plan_books"."book_id")))
  WHERE (("sp"."id" = "subscription_plan_books"."plan_id") AND ("sp"."is_active" = true) AND ("b"."status" = ANY (ARRAY['published'::"text", 'coming_soon'::"text"]))))));
CREATE POLICY "categories_public_read" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "hb_admin_all" ON "public"."platform_audit_events" TO "authenticated" USING ("public"."is_current_user_admin"()) WITH CHECK ("public"."is_current_user_admin"());

DROP POLICY IF EXISTS "Public can read published book covers" ON storage.objects;
CREATE POLICY "Public can read published book covers" ON storage.objects FOR SELECT TO anon, authenticated
  USING ((bucket_id = 'books'::text) AND (EXISTS (SELECT 1 FROM public.books b
    WHERE ((b.cover_url = objects.name) OR (b.cover_thumbnail_url = objects.name))
      AND (b.status = ANY (ARRAY['published'::text, 'coming_soon'::text]))
      AND (b.review_status = 'approved'::text)
      AND (COALESCE(b.copyright_status, 'clear'::text) <> 'blocked'::text))));
DROP POLICY IF EXISTS "Owners can read own book objects" ON storage.objects;
CREATE POLICY "Owners can read own book objects" ON storage.objects FOR SELECT TO authenticated
  USING ((bucket_id = 'books'::text) AND (owner = auth.uid()));
DROP POLICY IF EXISTS "Authors can update own objects" ON storage.objects;
CREATE POLICY "Authors can update own objects" ON storage.objects FOR UPDATE TO authenticated
  USING ((bucket_id = 'books'::text) AND (owner = auth.uid()));

-- Fonctions remplacées (définitions d'origine)
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

DROP FUNCTION IF EXISTS public.hb_book_storage_path_guard();
DROP FUNCTION IF EXISTS public.hb_can_review_book(uuid);
DROP FUNCTION IF EXISTS public.hb_review_verified_purchasers(uuid);
DROP FUNCTION IF EXISTS public.hb_book_access_reason(uuid, uuid);
DROP FUNCTION IF EXISTS public.hb_audit_append_only();
DROP FUNCTION IF EXISTS public.hb_book_private_fields(uuid);
DROP FUNCTION IF EXISTS public.hb_book_format_files(uuid);
DROP FUNCTION IF EXISTS public.hb_author_profile_private(uuid);
DROP FUNCTION IF EXISTS public.hb_book_cover_is_public(text);
DROP FUNCTION IF EXISTS public.hb_book_is_published(uuid);
DROP FUNCTION IF EXISTS public.hb_book_is_public(uuid);
DROP INDEX IF EXISTS public.hb_engagement_dedupe_user_idx;
DROP INDEX IF EXISTS public.hb_engagement_dedupe_session_idx;

-- search_path d'origine
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_current_user_admin() SET search_path = public;
ALTER FUNCTION public.user_has_access_to_book(uuid,uuid) SET search_path = public;
ALTER FUNCTION public.track_book_engagement(uuid,text,text,jsonb) SET search_path = public;
ALTER FUNCTION public.refresh_book_purchases_stats(uuid) SET search_path = public;
ALTER FUNCTION public.refresh_book_rating_stats(uuid) SET search_path = public;
ALTER FUNCTION public.refresh_book_views_stats(uuid) SET search_path = public;
ALTER FUNCTION public.refresh_book_derived_stats(uuid) SET search_path = public;
ALTER FUNCTION public._sync_library_access_for_order(uuid) SET search_path = public;
ALTER FUNCTION public.sync_library_access_for_order(uuid) SET search_path = public;
ALTER FUNCTION public.handle_orders_payment_status_automation() SET search_path = public;
ALTER FUNCTION public.handle_order_items_automation() SET search_path = public;
ALTER FUNCTION public.handle_ratings_automation() SET search_path = public;
ALTER FUNCTION public.handle_book_engagement_views_automation() SET search_path = public;
ALTER FUNCTION public.ensure_reader_affiliate_profile(uuid) SET search_path = public;
ALTER FUNCTION public.resolve_profile_affiliate_referral() SET search_path = public;
ALTER FUNCTION public.handle_reader_affiliate_profile() SET search_path = public;
ALTER FUNCTION public.prepare_user_subscription_affiliate_commission() SET search_path = public;
ALTER FUNCTION public.credit_affiliate_subscription_commission() SET search_path = public;
ALTER FUNCTION public.credit_affiliate_paid_order_commission() SET search_path = public;
ALTER FUNCTION public.claim_current_user_mobile_app_trial(integer,text) SET search_path = public;
ALTER FUNCTION public.enforce_author_book_submission_workflow() SET search_path = public;
ALTER FUNCTION public.enforce_author_book_format_workflow() SET search_path = public;
ALTER FUNCTION public.enforce_author_book_format_delete_workflow() SET search_path = public;
ALTER FUNCTION public.generate_reader_affiliate_code(uuid) SET search_path = public;
ALTER FUNCTION public.protect_admin_book_import_item_identity() SET search_path = public;
ALTER FUNCTION public.prepare_admin_book_import_item(uuid,uuid,text,text,bigint,text,text) SET search_path = public;
ALTER FUNCTION public.admin_import_published_book(uuid,uuid,text,boolean,text,text,uuid,text,text,text,numeric,text,text,text,text,bigint,integer) SET search_path = public;
ALTER FUNCTION public.enforce_book_publication_rights() SET search_path = public;

-- EXECUTE d'origine
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_access_to_book(uuid,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_book_engagement(uuid,text,text,jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_library_access_for_order(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_orders_payment_status_automation() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_order_items_automation() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_ratings_automation() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_book_engagement_views_automation() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_reader_affiliate_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_profile_affiliate_referral() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_reader_affiliate_profile() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_user_subscription_affiliate_commission() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_affiliate_subscription_commission() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_affiliate_paid_order_commission() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_current_user_mobile_app_trial(integer,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_book(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_order(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_book_access(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_book_for_review(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_author_profile() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_book_rating() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_author_book_submission_workflow() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_author_book_format_workflow() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_author_book_format_delete_workflow() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.safe_uuid(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_affiliate_source_type(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_reader_affiliate_code(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_admin_book_import_item_identity() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_admin_book_import_item(uuid,uuid,text,text,bigint,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_import_published_book(uuid,uuid,text,boolean,text,text,uuid,text,text,text,numeric,text,text,text,text,bigint,integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_order_item_format() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_profile_sensitive_fields() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_book_admin_fields() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_device_security() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_affiliate_payout_account() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_book_format_relation() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_asset_relation() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_download_license() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_payment_order() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_withdrawal_account() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_book_publication_rights() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_admin_transition_book(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hb_guard_reader_rating() TO authenticated;

-- Droits de table d'origine (les droits de colonne sont remplacés par le droit de table)
GRANT SELECT ON public."academic_taxonomies" TO anon;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."academic_taxonomies" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."ad_assignments" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."ad_campaigns" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."ad_creatives" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."ad_events" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."ad_placements" TO authenticated;
GRANT ALL ON public."admin_book_import_batches" TO anon;
GRANT ALL ON public."admin_book_import_batches" TO authenticated;
GRANT ALL ON public."admin_book_import_items" TO anon;
GRANT ALL ON public."admin_book_import_items" TO authenticated;
GRANT ALL ON public."affiliate_order_transactions" TO anon;
GRANT ALL ON public."affiliate_order_transactions" TO authenticated;
GRANT ALL ON public."affiliate_payout_accounts" TO anon;
GRANT ALL ON public."affiliate_payout_accounts" TO authenticated;
GRANT ALL ON public."affiliate_wallet_transactions" TO anon;
GRANT ALL ON public."affiliate_wallet_transactions" TO authenticated;
GRANT ALL ON public."affiliate_withdrawals" TO anon;
GRANT ALL ON public."affiliate_withdrawals" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."author_payout_accounts" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."author_payouts" TO authenticated;
GRANT ALL ON public."author_profiles" TO anon;
GRANT ALL ON public."author_profiles" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."author_royalty_accounts" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."author_royalty_transactions" TO authenticated;
GRANT ALL ON public."blog_posts" TO anon;
GRANT ALL ON public."blog_posts" TO authenticated;
GRANT SELECT ON public."book_academic_taxonomy" TO anon;
GRANT DELETE,INSERT,SELECT ON public."book_academic_taxonomy" TO authenticated;
GRANT ALL ON public."book_assets" TO anon;
GRANT ALL ON public."book_assets" TO authenticated;
GRANT ALL ON public."book_authors" TO anon;
GRANT ALL ON public."book_authors" TO authenticated;
GRANT ALL ON public."book_categories" TO anon;
GRANT ALL ON public."book_categories" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."book_distribution_settings" TO authenticated;
GRANT ALL ON public."book_downloads" TO anon;
GRANT ALL ON public."book_downloads" TO authenticated;
GRANT INSERT,SELECT ON public."book_editorial_events" TO authenticated;
GRANT ALL ON public."book_engagement_events" TO anon;
GRANT ALL ON public."book_engagement_events" TO authenticated;
GRANT ALL ON public."book_favorites" TO authenticated;
GRANT ALL ON public."book_formats" TO anon;
GRANT ALL ON public."book_formats" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."book_manuscript_versions" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."book_market_prices" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."book_reader_sessions" TO authenticated;
GRANT ALL ON public."books" TO anon;
GRANT ALL ON public."books" TO authenticated;
GRANT ALL ON public."categories" TO anon;
GRANT ALL ON public."categories" TO authenticated;
GRANT ALL ON public."editorial_training_requests" TO anon;
GRANT ALL ON public."editorial_training_requests" TO authenticated;
GRANT ALL ON public."flash_sale_configs" TO anon;
GRANT ALL ON public."flash_sale_configs" TO authenticated;
GRANT ALL ON public."highlights" TO anon;
GRANT ALL ON public."highlights" TO authenticated;
GRANT ALL ON public."home_featured_configs" TO anon;
GRANT ALL ON public."home_featured_configs" TO authenticated;
GRANT REFERENCES,SELECT,TRIGGER ON public."library" TO anon;
GRANT REFERENCES,SELECT,TRIGGER ON public."library" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."media_chapters" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."media_editions" TO authenticated;
GRANT ALL ON public."mobile_app_configs" TO anon;
GRANT ALL ON public."mobile_app_configs" TO authenticated;
GRANT ALL ON public."mobile_app_trial_grants" TO anon;
GRANT ALL ON public."mobile_app_trial_grants" TO authenticated;
GRANT ALL ON public."mobile_app_versions" TO anon;
GRANT ALL ON public."mobile_app_versions" TO authenticated;
GRANT ALL ON public."offline_reading_licenses" TO anon;
GRANT ALL ON public."offline_reading_licenses" TO authenticated;
GRANT REFERENCES,SELECT,TRIGGER ON public."order_items" TO anon;
GRANT REFERENCES,SELECT,TRIGGER ON public."order_items" TO authenticated;
GRANT REFERENCES,SELECT,TRIGGER ON public."orders" TO anon;
GRANT REFERENCES,SELECT,TRIGGER ON public."orders" TO authenticated;
GRANT ALL ON public."payment_attempts" TO anon;
GRANT ALL ON public."payment_attempts" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."platform_audit_events" TO authenticated;
GRANT DELETE,REFERENCES,SELECT,TRIGGER,TRUNCATE ON public."profiles" TO anon;
GRANT DELETE,REFERENCES,SELECT,TRIGGER,TRUNCATE ON public."profiles" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."promotion_campaigns" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."promotion_events" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."publishing_house_members" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."publishing_houses" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."publishing_imprints" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."publishing_review_cases" TO authenticated;
GRANT ALL ON public."push_notification_tokens" TO anon;
GRANT ALL ON public."push_notification_tokens" TO authenticated;
GRANT SELECT ON public."ratings" TO anon;
GRANT ALL ON public."ratings" TO authenticated;
GRANT ALL ON public."reader_affiliate_profiles" TO anon;
GRANT ALL ON public."reader_affiliate_profiles" TO authenticated;
GRANT ALL ON public."reading_progress" TO anon;
GRANT ALL ON public."reading_progress" TO authenticated;
GRANT ALL ON public."reading_sync_queue" TO anon;
GRANT ALL ON public."reading_sync_queue" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."rights_acquisition_targets" TO authenticated;
GRANT DELETE,INSERT,SELECT,UPDATE ON public."rights_contracts" TO authenticated;
GRANT ALL ON public."subscription_plan_books" TO anon;
GRANT ALL ON public."subscription_plan_books" TO authenticated;
GRANT ALL ON public."subscription_plans" TO anon;
GRANT ALL ON public."subscription_plans" TO authenticated;
GRANT ALL ON public."user_devices" TO anon;
GRANT ALL ON public."user_devices" TO authenticated;
GRANT ALL ON public."user_subscriptions" TO anon;
GRANT ALL ON public."user_subscriptions" TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT UPDATE, DELETE, TRUNCATE ON public.platform_audit_events TO service_role;

-- Privilèges par défaut d'origine
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

COMMIT;
