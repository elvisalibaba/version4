-- =============================================================================
-- HolisticBooks — Phase 3 : bucket public « covers »
-- =============================================================================
-- Les couvertures sont publiques par nature : URL stables, cachables (CDN), sans
-- signature ni requête par livre. Les fichiers de livres restent dans « books » (privé).
--
-- Clé d'objet : <book_id>/<nom>.<ext> (ex. 3f…/cover.jpg). books.cover_url contient
-- cette clé et books.cover_bucket indique le bucket ('books' = ancien emplacement,
-- 'covers' = nouveau). Lecture publique ; écriture par l'auteur du livre ou l'admin.
-- Idempotente, transactionnelle. Annulation : supabase/rollbacks/20261014110000_public_covers_bucket.down.sql
-- =============================================================================

BEGIN;

-- 1. Bucket public, images uniquement, 5 Mo maximum.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Bucket de la couverture.
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cover_bucket text NOT NULL DEFAULT 'books';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'books_cover_bucket_check') THEN
    ALTER TABLE public.books ADD CONSTRAINT books_cover_bucket_check CHECK (cover_bucket IN ('books', 'covers'));
  END IF;
END
$$;
-- Droits de colonne (la migration de sécurité ne rend aucune nouvelle colonne lisible par défaut).
GRANT SELECT (cover_bucket) ON public.books TO anon, authenticated;

-- 3. Écriture dans « covers » : auteur du livre (premier dossier = id du livre) ou admin.
CREATE OR REPLACE FUNCTION public.hb_can_write_cover(p_object_name text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_book_id uuid;
BEGIN
  IF public.is_admin() THEN
    RETURN true;
  END IF;
  IF p_object_name IS NULL
     OR p_object_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9._-]+$' THEN
    RETURN false;
  END IF;
  v_book_id := split_part(p_object_name, '/', 1)::uuid;
  RETURN public.owns_book(v_book_id);
END;
$$;
REVOKE ALL ON FUNCTION public.hb_can_write_cover(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_can_write_cover(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "hb_covers_owner_select" ON storage.objects;
CREATE POLICY "hb_covers_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'covers' AND public.hb_can_write_cover(name));

DROP POLICY IF EXISTS "hb_covers_owner_insert" ON storage.objects;
CREATE POLICY "hb_covers_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND public.hb_can_write_cover(name));

DROP POLICY IF EXISTS "hb_covers_owner_update" ON storage.objects;
CREATE POLICY "hb_covers_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND public.hb_can_write_cover(name))
  WITH CHECK (bucket_id = 'covers' AND public.hb_can_write_cover(name));

DROP POLICY IF EXISTS "hb_covers_owner_delete" ON storage.objects;
CREATE POLICY "hb_covers_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND public.hb_can_write_cover(name));

-- 4. Garde de chemin : une couverture « covers » doit être sous le dossier du livre.
CREATE OR REPLACE FUNCTION public.hb_book_storage_path_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_author uuid;
  v_cover_prefix text;
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin')
     OR COALESCE(auth.role(), '') = 'service_role'
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'books' THEN
    v_author := NEW.author_id;
    v_cover_prefix := CASE WHEN NEW.cover_bucket = 'covers'
                           THEN NEW.id::text || '/'
                           ELSE 'covers/' || v_author::text || '/' END;
    IF NEW.file_url IS NOT NULL
       AND (NEW.file_url NOT LIKE 'files/' || v_author::text || '/%' OR NEW.file_url LIKE '%..%') THEN
      RAISE EXCEPTION 'Chemin de fichier refusé : files/<votre identifiant>/ attendu' USING ERRCODE = '42501';
    END IF;
    IF NEW.cover_url IS NOT NULL
       AND (NEW.cover_url NOT LIKE v_cover_prefix || '%' OR NEW.cover_url LIKE '%..%') THEN
      RAISE EXCEPTION 'Chemin de couverture refusé : % attendu', v_cover_prefix USING ERRCODE = '42501';
    END IF;
    IF NEW.cover_thumbnail_url IS NOT NULL
       AND (NEW.cover_thumbnail_url NOT LIKE v_cover_prefix || '%' OR NEW.cover_thumbnail_url LIKE '%..%') THEN
      RAISE EXCEPTION 'Chemin de miniature refusé : % attendu', v_cover_prefix USING ERRCODE = '42501';
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
  BEFORE INSERT OR UPDATE OF file_url, cover_url, cover_thumbnail_url, cover_bucket ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.hb_book_storage_path_guard();

COMMIT;
