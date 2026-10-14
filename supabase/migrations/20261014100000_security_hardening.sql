-- =============================================================================
-- HolisticBooks — Phase 1 : durcissement de sécurité de la base
-- =============================================================================
-- STATUT : APPLIQUÉE en production le 14/10/2026 (psql, une transaction), puis
-- enregistrée dans l'historique par `supabase migration repair --status applied 20261014100000`.
-- Vérifiée par 52 assertions (supabase/tests/20261014_security_hardening.test.sql).
--
-- Référence : docs/supabase-security-baseline.md (écarts numérotés #1 à #19).
-- Annulation : supabase/rollbacks/20261014100000_security_hardening.down.sql
-- Tests     : supabase/tests/20261014_security_hardening.test.sql (pgTAP)
--
-- ORDRE DE DÉPLOIEMENT IMPOSÉ :
--   1. Déployer d'abord le code Next qui n'utilise plus `select("*")` sur books,
--      book_formats et author_profiles, et qui lit les colonnes privées via les RPC
--      hb_book_private_fields / hb_book_format_files / hb_author_profile_private
--      (§ B). Sans ce code, le catalogue renverrait « permission denied ».
--   2. Appliquer cette migration.
--   3. Prévenir l'équipe Flutter : l'insertion directe dans book_engagement_events
--      est retirée (passer par la RPC track_book_engagement), § H.
--
-- Idempotente (IF EXISTS / OR REPLACE / DO), transactionnelle, réversible.
-- Toute fonction SECURITY DEFINER : search_path = '', noms qualifiés, contrôle
-- explicite, REVOKE FROM PUBLIC, anon, authenticated puis GRANT minimal.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Fonctions de visibilité partagées (règle unique livre / format / avis)
-- -----------------------------------------------------------------------------
-- Public = publié + approuvé + droits « clear », ou « à paraître » + droits « clear ».
CREATE OR REPLACE FUNCTION public.hb_book_is_public(p_book_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  -- Pas de contrôle d'appelant : ne révèle que ce que le catalogue public montre déjà.
  SELECT EXISTS (
    SELECT 1 FROM public.books b
    WHERE b.id = p_book_id
      AND b.copyright_status = 'clear'
      AND ((b.status = 'published' AND b.review_status = 'approved') OR b.status = 'coming_soon')
  );
$$;

-- Publié et lisible (exclut « à paraître ») : avis, lecture, engagement de lecture.
CREATE OR REPLACE FUNCTION public.hb_book_is_published(p_book_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.books b
    WHERE b.id = p_book_id
      AND b.status = 'published'
      AND b.review_status = 'approved'
      AND b.copyright_status = 'clear'
  );
$$;

-- Une couverture n'est publique que si elle est sous covers/ ET référencée par un livre public.
CREATE OR REPLACE FUNCTION public.hb_book_cover_is_public(p_object_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_object_name LIKE 'covers/%'
     AND EXISTS (
       SELECT 1 FROM public.books b
       WHERE (b.cover_url = p_object_name OR b.cover_thumbnail_url = p_object_name)
         AND public.hb_book_is_public(b.id)
     );
$$;

REVOKE ALL ON FUNCTION public.hb_book_is_public(uuid), public.hb_book_is_published(uuid),
  public.hb_book_cover_is_public(text) FROM PUBLIC, anon, authenticated;
-- Utilisées dans des policies évaluées pour anon et authenticated.
GRANT EXECUTE ON FUNCTION public.hb_book_is_public(uuid), public.hb_book_is_published(uuid),
  public.hb_book_cover_is_public(text) TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- A. user_subscriptions : un lecteur ne crée ni ne modifie ses abonnements (#2)
-- -----------------------------------------------------------------------------
-- Les abonnements sont créés par le serveur (service_role) après paiement, ou par l'admin.
DROP POLICY IF EXISTS "Readers can insert own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Readers can update own subscriptions" ON public.user_subscriptions;

-- -----------------------------------------------------------------------------
-- B. Colonnes privées masquées (file_url, notes de droits, téléphone) (#3, #4)
-- -----------------------------------------------------------------------------
-- Les droits de colonne s'appliquent à anon ET authenticated (admin compris via
-- PostgREST) : les écrans auteur/admin lisent ces colonnes par les RPC ci-dessous.
-- Toute nouvelle colonne est privée par défaut : il faudra l'ajouter explicitement.
DO $$
DECLARE
  v_spec record;
  v_cols text;
BEGIN
  FOR v_spec IN
    SELECT * FROM (VALUES
      ('books', ARRAY['file_url', 'ingestion_metadata', 'admin_import_checksum',
                      'admin_import_original_file_name', 'rights_agreement_reference', 'copyright_note']),
      ('book_formats', ARRAY['file_url']),
      ('author_profiles', ARRAY['phone', 'rights_notes', 'rights_status', 'reference_source_url'])
    ) AS t(table_name, hidden)
  LOOP
    SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.ordinal_position)
      INTO v_cols
      FROM information_schema.columns c
     WHERE c.table_schema = 'public'
       AND c.table_name = v_spec.table_name
       AND c.column_name <> ALL (v_spec.hidden);

    EXECUTE format('REVOKE SELECT ON public.%I FROM anon, authenticated', v_spec.table_name);
    EXECUTE format('GRANT SELECT (%s) ON public.%I TO anon, authenticated', v_cols, v_spec.table_name);
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION public.hb_book_private_fields(p_book_id uuid)
RETURNS TABLE (
  file_url text,
  ingestion_metadata jsonb,
  admin_import_checksum text,
  admin_import_original_file_name text,
  rights_agreement_reference text,
  copyright_note text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.owns_book(p_book_id)) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT b.file_url, b.ingestion_metadata, b.admin_import_checksum,
           b.admin_import_original_file_name, b.rights_agreement_reference, b.copyright_note
      FROM public.books b
     WHERE b.id = p_book_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.hb_book_format_files(p_book_id uuid)
RETURNS TABLE (format_id uuid, format text, file_url text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.owns_book(p_book_id)) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT f.id, f.format, f.file_url FROM public.book_formats f WHERE f.book_id = p_book_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.hb_author_profile_private(p_author_id uuid)
RETURNS TABLE (phone text, rights_notes text, rights_status text, reference_source_url text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (public.is_admin() OR p_author_id = (SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT ap.phone, ap.rights_notes, ap.rights_status, ap.reference_source_url
      FROM public.author_profiles ap
     WHERE ap.id = p_author_id;
END;
$$;

REVOKE ALL ON FUNCTION public.hb_book_private_fields(uuid), public.hb_book_format_files(uuid),
  public.hb_author_profile_private(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_book_private_fields(uuid), public.hb_book_format_files(uuid),
  public.hb_author_profile_private(uuid) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- C. Privilèges : anon en lecture seule sur le catalogue, plus de TRUNCATE (#5)
-- -----------------------------------------------------------------------------
-- Les droits de colonne posés en § B sont des droits distincts : REVOKE ALL ON
-- ALL TABLES les retire aussi, on les repose donc juste après.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;

GRANT SELECT ON
  public.academic_taxonomies, public.blog_posts, public.book_academic_taxonomy,
  public.book_authors, public.book_categories, public.categories, public.flash_sale_configs,
  public.home_featured_configs, public.mobile_app_configs, public.mobile_app_versions,
  public.promotion_campaigns, public.publishing_houses, public.publishing_imprints,
  public.ratings, public.subscription_plan_books, public.subscription_plans
TO anon;
-- Formulaire public « formation éditoriale » (limitation de débit prévue en Phase 2).
GRANT INSERT ON public.editorial_training_requests TO anon;

DO $$
DECLARE
  v_spec record;
  v_cols text;
BEGIN
  FOR v_spec IN
    SELECT * FROM (VALUES
      ('books', ARRAY['file_url', 'ingestion_metadata', 'admin_import_checksum',
                      'admin_import_original_file_name', 'rights_agreement_reference', 'copyright_note']),
      ('book_formats', ARRAY['file_url']),
      ('author_profiles', ARRAY['phone', 'rights_notes', 'rights_status', 'reference_source_url'])
    ) AS t(table_name, hidden)
  LOOP
    SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.ordinal_position)
      INTO v_cols
      FROM information_schema.columns c
     WHERE c.table_schema = 'public'
       AND c.table_name = v_spec.table_name
       AND c.column_name <> ALL (v_spec.hidden);
    EXECUTE format('GRANT SELECT (%s) ON public.%I TO anon', v_cols, v_spec.table_name);
  END LOOP;
END
$$;

-- Plus aucun droit implicite sur les objets futurs (création par le rôle postgres).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- D. book_assets : jamais de lecture directe (#6)
-- -----------------------------------------------------------------------------
-- Accès aux fichiers via RPC ou route serveur avec URL signée uniquement.
DROP POLICY IF EXISTS "mobile published assets read" ON public.book_assets;
DROP POLICY IF EXISTS "assets_read" ON public.book_assets;
-- assets_author_manage (propriétaire ou admin) est conservée.

-- -----------------------------------------------------------------------------
-- E. Création de livres réservée aux auteurs et aux admins (#7)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can create books" ON public.books;
DROP POLICY IF EXISTS "books_author_insert" ON public.books;
DROP POLICY IF EXISTS "hb_books_insert_author_or_admin" ON public.books;
CREATE POLICY "hb_books_insert_author_or_admin" ON public.books
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_current_user_admin()
    OR (
      author_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid()) AND p.role IN ('author', 'admin')
      )
    )
  );

-- Garde de chemin Storage : un auteur ne référence que ses propres dossiers (#3).
CREATE OR REPLACE FUNCTION public.hb_book_storage_path_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_author uuid;
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin')
     OR COALESCE(auth.role(), '') = 'service_role'
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'books' THEN
    v_author := NEW.author_id;
    IF NEW.file_url IS NOT NULL
       AND (NEW.file_url NOT LIKE 'files/' || v_author::text || '/%' OR NEW.file_url LIKE '%..%') THEN
      RAISE EXCEPTION 'Chemin de fichier refusé : files/<votre identifiant>/ attendu' USING ERRCODE = '42501';
    END IF;
    IF NEW.cover_url IS NOT NULL
       AND (NEW.cover_url NOT LIKE 'covers/' || v_author::text || '/%' OR NEW.cover_url LIKE '%..%') THEN
      RAISE EXCEPTION 'Chemin de couverture refusé : covers/<votre identifiant>/ attendu' USING ERRCODE = '42501';
    END IF;
    IF NEW.cover_thumbnail_url IS NOT NULL
       AND (NEW.cover_thumbnail_url NOT LIKE 'covers/' || v_author::text || '/%' OR NEW.cover_thumbnail_url LIKE '%..%') THEN
      RAISE EXCEPTION 'Chemin de miniature refusé : covers/<votre identifiant>/ attendu' USING ERRCODE = '42501';
    END IF;
  ELSE
    SELECT b.author_id INTO v_author FROM public.books b WHERE b.id = NEW.book_id;
    IF NEW.file_url IS NOT NULL
       AND (v_author IS NULL OR NEW.file_url NOT LIKE 'files/' || v_author::text || '/%' OR NEW.file_url LIKE '%..%') THEN
      RAISE EXCEPTION 'Chemin de fichier refusé : files/<votre identifiant>/ attendu' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.hb_book_storage_path_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS hb_books_storage_path_guard ON public.books;
CREATE TRIGGER hb_books_storage_path_guard
  BEFORE INSERT OR UPDATE OF file_url, cover_url, cover_thumbnail_url ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.hb_book_storage_path_guard();

DROP TRIGGER IF EXISTS hb_book_formats_storage_path_guard ON public.book_formats;
CREATE TRIGGER hb_book_formats_storage_path_guard
  BEFORE INSERT OR UPDATE OF file_url ON public.book_formats
  FOR EACH ROW EXECUTE FUNCTION public.hb_book_storage_path_guard();

-- -----------------------------------------------------------------------------
-- F. Storage « books » cloisonné par utilisateur (#3, #11)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read published book covers" ON storage.objects;
DROP POLICY IF EXISTS "hb_books_public_covers_read" ON storage.objects;
CREATE POLICY "hb_books_public_covers_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'books' AND public.hb_book_cover_is_public(name));

-- Le propriétaire relit ses couvertures et portraits, jamais files/ en direct :
-- le contenu des livres passe uniquement par le serveur.
DROP POLICY IF EXISTS "Owners can read own book objects" ON storage.objects;
DROP POLICY IF EXISTS "hb_books_owner_read_non_content" ON storage.objects;
CREATE POLICY "hb_books_owner_read_non_content" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'books'
    AND owner = (SELECT auth.uid())
    AND (storage.foldername(name))[1] IN ('covers', 'author-avatars')
  );

DROP POLICY IF EXISTS "Authors can update own objects" ON storage.objects;
DROP POLICY IF EXISTS "hb_books_owner_update_own_folder" ON storage.objects;
CREATE POLICY "hb_books_owner_update_own_folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'books'
    AND owner = (SELECT auth.uid())
    AND (storage.foldername(name))[1] IN ('files', 'covers', 'author-avatars')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'books'
    AND owner = (SELECT auth.uid())
    AND (storage.foldername(name))[1] IN ('files', 'covers', 'author-avatars')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "hb_books_owner_delete_own_folder" ON storage.objects;
CREATE POLICY "hb_books_owner_delete_own_folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'books'
    AND owner = (SELECT auth.uid())
    AND (storage.foldername(name))[1] IN ('files', 'covers', 'author-avatars')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );
-- Insertion : policies existantes conservées (covers/<uid>, files/<uid> pour le rôle
-- author ; author-avatars/<uid>) ; l'admin garde « Admin full storage books access ».

-- -----------------------------------------------------------------------------
-- G. Accès au livre aligné sur BookAccessService::canRead (#8)
-- -----------------------------------------------------------------------------
-- Motif d'accès unique : 'purchase' | 'library_free' | 'subscription' | 'free' | 'mobile_trial' | NULL.
-- Servira aussi à la RPC hb_book_access (Phase 2) et aux avis (§ J).
CREATE OR REPLACE FUNCTION public.hb_book_access_reason(p_user_id uuid, p_book_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_book record;
  v_price numeric;
  v_library_type text;
BEGIN
  IF p_user_id IS NULL OR p_book_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Pas d'oracle : on n'interroge que ses propres droits, sauf serveur ou admin.
  -- auth.role() est NULL hors PostgREST (trigger, psql), qui reste autorisé.
  IF p_user_id IS DISTINCT FROM (SELECT auth.uid())
     AND auth.role() IS NOT NULL
     AND auth.role() <> 'service_role'
     AND NOT public.is_admin() THEN
    RETURN NULL;
  END IF;

  SELECT b.status, b.copyright_status, b.is_single_sale_enabled, b.price
    INTO v_book
    FROM public.books b
   WHERE b.id = p_book_id;

  -- canRead : status = published ET copyright_status = clear.
  IF NOT FOUND OR v_book.status <> 'published' OR v_book.copyright_status IS DISTINCT FROM 'clear' THEN
    RETURN NULL;
  END IF;

  -- 1. Bibliothèque : achat ou gratuit, entrée active et non expirée.
  SELECT l.access_type INTO v_library_type
    FROM public.library l
   WHERE l.user_id = p_user_id
     AND l.book_id = p_book_id
     AND l.status = 'active'
     AND l.access_type IN ('purchase', 'free')
     AND (l.expires_at IS NULL OR l.expires_at > now())
   ORDER BY CASE l.access_type WHEN 'purchase' THEN 0 ELSE 1 END
   LIMIT 1;
  IF v_library_type = 'purchase' THEN
    RETURN 'purchase';
  ELSIF v_library_type = 'free' THEN
    RETURN 'library_free';
  END IF;

  -- 2. Abonnement en cours (Subscription::currentlyActive) couvrant le livre.
  IF EXISTS (
    SELECT 1
      FROM public.user_subscriptions us
      JOIN public.subscription_plan_books spb ON spb.plan_id = us.plan_id
     WHERE us.user_id = p_user_id
       AND spb.book_id = p_book_id
       AND us.status = 'active'
       AND (us.expires_at IS NULL OR us.expires_at > now())
  ) THEN
    RETURN 'subscription';
  END IF;

  -- 3. Gratuit : vente unitaire active et format publié préféré (holistique_store puis ebook) à 0,
  --    à défaut books.price (comme `$preferredFormat?->price ?? $book->price`).
  SELECT bf.price INTO v_price
    FROM public.book_formats bf
   WHERE bf.book_id = p_book_id
     AND bf.is_published
     AND bf.format IN ('holistique_store', 'ebook')
   ORDER BY CASE bf.format WHEN 'holistique_store' THEN 0 ELSE 1 END
   LIMIT 1;
  IF v_book.is_single_sale_enabled AND COALESCE(v_price, v_book.price, 0) <= 0 THEN
    RETURN 'free';
  END IF;

  -- 4. Essai de l'application mobile (spécifique Supabase, absent de canRead).
  IF EXISTS (
    SELECT 1 FROM public.mobile_app_trial_grants t
    WHERE t.user_id = p_user_id AND t.status = 'active' AND t.expires_at > now()
  ) AND EXISTS (
    SELECT 1 FROM public.book_formats bf
    WHERE bf.book_id = p_book_id AND bf.is_published AND bf.format IN ('holistique_store', 'ebook')
  ) THEN
    RETURN 'mobile_trial';
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_access_to_book(p_user_id uuid, p_book_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  -- Le contrôle d'appelant est fait dans hb_book_access_reason.
  SELECT public.hb_book_access_reason(p_user_id, p_book_id) IS NOT NULL;
$$;

-- Une seule source de vérité : l'auteur et l'admin, puis la règle de lecture.
CREATE OR REPLACE FUNCTION public.has_book_access(p_book_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_admin()
      OR public.owns_book(p_book_id)
      OR public.user_has_access_to_book((SELECT auth.uid()), p_book_id);
$$;

REVOKE ALL ON FUNCTION public.hb_book_access_reason(uuid, uuid), public.user_has_access_to_book(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_book_access_reason(uuid, uuid), public.user_has_access_to_book(uuid, uuid)
  TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_book_access(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_book_access(uuid) TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- H. Engagement : RPC seule, métadonnées bornées, déduplication (#9)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "mobile engagement insert" ON public.book_engagement_events;
DROP POLICY IF EXISTS "mobile engagement authenticated insert" ON public.book_engagement_events;

CREATE INDEX IF NOT EXISTS hb_engagement_dedupe_user_idx
  ON public.book_engagement_events (book_id, user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS hb_engagement_dedupe_session_idx
  ON public.book_engagement_events (book_id, (metadata ->> 'session_hash'), created_at DESC)
  WHERE user_id IS NULL;

CREATE OR REPLACE FUNCTION public.track_book_engagement(
  p_book_id uuid,
  p_event_type text,
  p_source text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_role text;
  v_meta jsonb := COALESCE(p_metadata, '{}'::jsonb);
  v_session text;
  c_allowed_keys CONSTANT text[] := ARRAY['session_hash', 'surface', 'position', 'list', 'query',
                                          'platform', 'app_version', 'referrer'];
BEGIN
  IF p_event_type NOT IN ('detail_view', 'reader_open', 'file_access') THEN
    RAISE EXCEPTION 'Type d''événement non pris en charge' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(v_meta) <> 'object' OR octet_length(v_meta::text) > 2048 THEN
    RAISE EXCEPTION 'Métadonnées invalides (objet JSON de 2 Ko maximum)' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(v_meta) AS k(key) WHERE k.key <> ALL (c_allowed_keys)) THEN
    RAISE EXCEPTION 'Clé de métadonnées non autorisée' USING ERRCODE = '22023';
  END IF;
  IF p_source IS NOT NULL AND char_length(p_source) > 64 THEN
    RAISE EXCEPTION 'Source trop longue' USING ERRCODE = '22023';
  END IF;

  -- La fiche d'un livre « à paraître » compte ; lecture et fichier exigent un livre publié.
  IF (p_event_type = 'detail_view' AND NOT public.hb_book_is_public(p_book_id))
     OR (p_event_type <> 'detail_view' AND NOT public.hb_book_is_published(p_book_id)) THEN
    RAISE EXCEPTION 'Livre indisponible' USING ERRCODE = '42501';
  END IF;

  v_session := NULLIF(left(v_meta ->> 'session_hash', 128), '');
  -- Un visiteur anonyme sans identifiant de session n'est pas comptabilisé.
  IF v_uid IS NULL AND v_session IS NULL THEN
    RETURN;
  END IF;

  -- Une seule vue de fiche par livre et par utilisateur (ou session) toutes les 30 minutes.
  IF p_event_type = 'detail_view' AND EXISTS (
    SELECT 1 FROM public.book_engagement_events e
     WHERE e.book_id = p_book_id
       AND e.event_type = 'detail_view'
       AND e.created_at > now() - interval '30 minutes'
       AND (
         (v_uid IS NOT NULL AND e.user_id = v_uid)
         OR (v_uid IS NULL AND e.user_id IS NULL AND e.metadata ->> 'session_hash' = v_session)
       )
  ) THEN
    RETURN;
  END IF;

  IF v_uid IS NOT NULL THEN
    SELECT p.role INTO v_role FROM public.profiles p WHERE p.id = v_uid;
  END IF;

  INSERT INTO public.book_engagement_events (book_id, user_id, event_type, source, user_role, is_authenticated, metadata)
  VALUES (p_book_id, v_uid, p_event_type, p_source, v_role, v_uid IS NOT NULL, v_meta);
END;
$$;
REVOKE ALL ON FUNCTION public.track_book_engagement(uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_book_engagement(uuid, text, text, jsonb) TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- I. Journal d'audit en insertion seule, même pour l'admin (#10)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "hb_admin_all" ON public.platform_audit_events;
DROP POLICY IF EXISTS "hb_audit_admin_read" ON public.platform_audit_events;
DROP POLICY IF EXISTS "hb_audit_admin_insert" ON public.platform_audit_events;
CREATE POLICY "hb_audit_admin_read" ON public.platform_audit_events
  FOR SELECT TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "hb_audit_admin_insert" ON public.platform_audit_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin() AND actor_id = (SELECT auth.uid()));
REVOKE UPDATE, DELETE, TRUNCATE ON public.platform_audit_events FROM anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.hb_audit_append_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Le journal d''audit est en insertion seule' USING ERRCODE = '42501';
END;
$$;
REVOKE ALL ON FUNCTION public.hb_audit_append_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS hb_audit_no_update_delete ON public.platform_audit_events;
CREATE TRIGGER hb_audit_no_update_delete
  BEFORE UPDATE OR DELETE ON public.platform_audit_events
  FOR EACH ROW EXECUTE FUNCTION public.hb_audit_append_only();
DROP TRIGGER IF EXISTS hb_audit_no_truncate ON public.platform_audit_events;
CREATE TRIGGER hb_audit_no_truncate
  BEFORE TRUNCATE ON public.platform_audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.hb_audit_append_only();

-- -----------------------------------------------------------------------------
-- J. Avis : livre publié, accès au livre requis, pas d'avis sur son propre livre (#12)
-- -----------------------------------------------------------------------------
-- Décision du propriétaire (14/10/2026) : un avis exige l'accès au livre (achat,
-- abonnement actif ou livre gratuit ; l'essai mobile ne suffit pas). Plus strict
-- que Laravel (ReviewController::store n'exige aucun accès).
-- Badge « Achat vérifié » : achats uniquement (Laravel l'accordait aussi au gratuit
-- et à l'abonnement).
CREATE OR REPLACE FUNCTION public.hb_can_review_book(p_book_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
     AND public.hb_book_is_published(p_book_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.books b WHERE b.id = p_book_id AND b.author_id = (SELECT auth.uid())
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.book_authors ba WHERE ba.book_id = p_book_id AND ba.author_id = (SELECT auth.uid())
     )
     AND public.hb_book_access_reason((SELECT auth.uid()), p_book_id)
         IN ('purchase', 'library_free', 'subscription', 'free');
$$;

-- Auteurs d'avis ayant un achat actif : ne révèle que ce que le badge affiche déjà.
CREATE OR REPLACE FUNCTION public.hb_review_verified_purchasers(p_book_id uuid)
RETURNS TABLE (user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT r.user_id
    FROM public.ratings r
   WHERE r.book_id = p_book_id
     AND NOT r.is_hidden
     AND EXISTS (
       SELECT 1 FROM public.library l
        WHERE l.user_id = r.user_id
          AND l.book_id = r.book_id
          AND l.status = 'active'
          AND l.access_type = 'purchase'
          AND (l.expires_at IS NULL OR l.expires_at > now())
     );
$$;

REVOKE ALL ON FUNCTION public.hb_can_review_book(uuid), public.hb_review_verified_purchasers(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_can_review_book(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hb_review_verified_purchasers(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "hb_ratings_public_book_insert" ON public.ratings;
CREATE POLICY "hb_ratings_public_book_insert" ON public.ratings
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin() OR public.hb_can_review_book(book_id));

DROP POLICY IF EXISTS "hb_ratings_public_book_update" ON public.ratings;
CREATE POLICY "hb_ratings_public_book_update" ON public.ratings
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_current_user_admin() OR public.hb_book_is_published(book_id))
  WITH CHECK (public.is_current_user_admin() OR public.hb_book_is_published(book_id));

DROP POLICY IF EXISTS "hb_ratings_visible_on_public_books" ON public.ratings;
CREATE POLICY "hb_ratings_visible_on_public_books" ON public.ratings
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    public.hb_book_is_public(book_id)
    OR user_id = (SELECT auth.uid())
    OR public.is_current_user_admin()
  );

-- -----------------------------------------------------------------------------
-- K. Fonctions : search_path figé et EXECUTE minimal (#13)
-- -----------------------------------------------------------------------------
-- Les 29 fonctions en search_path=public n'utilisent que des noms qualifiés
-- (vérifié sur la baseline du 14/10/2026) : passage à '' sans changement de corps.
DO $$
DECLARE
  v_fn regprocedure;
BEGIN
  FOR v_fn IN
    SELECT p.oid::regprocedure
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND 'search_path=public' = ANY (COALESCE(p.proconfig, '{}'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = %L', v_fn, '');
  END LOOP;
END
$$;

-- Fonctions trigger : jamais appelables directement (le trigger ne vérifie pas EXECUTE).
DO $$
DECLARE
  v_fn regprocedure;
BEGIN
  FOR v_fn IN
    SELECT p.oid::regprocedure
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype
       AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_fn);
  END LOOP;
END
$$;

-- Fonctions internes : appelées seulement par des triggers ou fonctions SECURITY DEFINER.
REVOKE ALL ON FUNCTION public.ensure_reader_affiliate_profile(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_reader_affiliate_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.safe_uuid(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.normalize_affiliate_source_type(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_reader_affiliate_profile(uuid), public.generate_reader_affiliate_code(uuid),
  public.safe_uuid(text), public.normalize_affiliate_source_type(text) TO service_role;

-- RPC réservées aux utilisateurs connectés (contrôle interne conservé).
DO $$
DECLARE
  v_fn regprocedure;
BEGIN
  FOR v_fn IN
    SELECT p.oid::regprocedure
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN ('sync_library_access_for_order', 'claim_current_user_mobile_app_trial',
                         'submit_book_for_review', 'admin_import_published_book', 'prepare_admin_book_import_item')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', v_fn);
  END LOOP;
END
$$;

-- -----------------------------------------------------------------------------
-- L. Visibilité cohérente des livres, formats et tables liées (#14)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "hb_public_book_visibility" ON public.books;
CREATE POLICY "hb_public_book_visibility" ON public.books
  FOR SELECT TO anon, authenticated
  USING (
    (copyright_status = 'clear'
      AND ((status = 'published' AND review_status = 'approved') OR status = 'coming_soon'))
    OR author_id = (SELECT auth.uid())
    OR public.is_current_user_admin()
  );

DROP POLICY IF EXISTS "hb_public_published_formats" ON public.book_formats;
CREATE POLICY "hb_public_published_formats" ON public.book_formats
  FOR SELECT TO anon, authenticated
  USING (is_published AND public.hb_book_is_public(book_id));

DROP POLICY IF EXISTS "public_book_taxonomies" ON public.book_academic_taxonomy;
CREATE POLICY "public_book_taxonomies" ON public.book_academic_taxonomy
  FOR SELECT TO anon, authenticated USING (public.hb_book_is_public(book_id));

DROP POLICY IF EXISTS "book_categories_public_read" ON public.book_categories;
CREATE POLICY "book_categories_public_read" ON public.book_categories
  FOR SELECT TO anon, authenticated
  USING (public.hb_book_is_public(book_id) OR public.owns_book(book_id) OR public.is_admin());

DROP POLICY IF EXISTS "hb_read_book_authors" ON public.book_authors;
CREATE POLICY "hb_read_book_authors" ON public.book_authors
  FOR SELECT TO anon, authenticated USING (public.hb_book_is_public(book_id));

DROP POLICY IF EXISTS "Anyone can view published subscription mappings" ON public.subscription_plan_books;
CREATE POLICY "Anyone can view published subscription mappings" ON public.subscription_plan_books
  FOR SELECT TO anon, authenticated
  USING (
    public.hb_book_is_public(book_id)
    AND EXISTS (SELECT 1 FROM public.subscription_plans sp WHERE sp.id = subscription_plan_books.plan_id AND sp.is_active)
  );

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());

-- -----------------------------------------------------------------------------
-- M. Profils : staff_role, staff_permissions et email protégés (#15)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
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
    RAISE EXCEPTION 'Modification du rôle interdite';
  END IF;

  IF NEW.staff_role IS DISTINCT FROM OLD.staff_role
     OR NEW.staff_permissions IS DISTINCT FROM OLD.staff_permissions THEN
    RAISE EXCEPTION 'Modification des droits du personnel interdite';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'L''adresse e-mail se modifie depuis le compte (Supabase Auth)';
  END IF;

  IF NEW.referred_by_affiliate_user_id IS DISTINCT FROM OLD.referred_by_affiliate_user_id
     OR NEW.referred_by_affiliate_code IS DISTINCT FROM OLD.referred_by_affiliate_code
     OR NEW.affiliate_source_type IS DISTINCT FROM OLD.affiliate_source_type
     OR NEW.affiliate_source_book_id IS DISTINCT FROM OLD.affiliate_source_book_id
     OR NEW.affiliate_source_plan_id IS DISTINCT FROM OLD.affiliate_source_plan_id THEN
    RAISE EXCEPTION 'Modification des données d’affiliation interdite';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_profile_sensitive_fields() FROM PUBLIC, anon, authenticated;

COMMIT;

-- Reporté volontairement (voir le compte rendu Phase 1) :
-- * hb_create_order (cahier § 12) : dépend de orders.payment_order_ref → Phase 3 bis.
-- * Intégrité author_profiles (§ 13) : 1 profil orphelin à arbitrer → Phase 2.
--   Les policies « lecture de ses propres redevances et versements » existent déjà.
-- * Verrou des livres publiés (§ 3) : déjà effectif via enforce_author_book_submission_workflow ;
--   le circuit book_manuscript_versions + RPC admin sera livré avec l'espace auteur (Phase 2).
-- * Nettoyage des policies en double (écart #16) : migration séparée, sans changement de droits.
