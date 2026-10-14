-- ANNULATION de supabase/migrations/20261014110000_public_covers_bucket.sql
-- À n'utiliser qu'AVANT la copie des couvertures (scripts/migrate-covers-to-supabase.ts),
-- ou après avoir repassé les livres sur cover_bucket = 'books' : la colonne est supprimée.
BEGIN;

DROP POLICY IF EXISTS "hb_covers_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "hb_covers_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "hb_covers_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "hb_covers_owner_delete" ON storage.objects;
DROP FUNCTION IF EXISTS public.hb_can_write_cover(text);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.books WHERE cover_bucket = 'covers') THEN
    RAISE EXCEPTION 'Des livres utilisent encore le bucket covers : annulation refusée';
  END IF;
END
$$;

-- Garde de chemin d'origine (migration 20261014100000).
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
DROP TRIGGER IF EXISTS hb_books_storage_path_guard ON public.books;
CREATE TRIGGER hb_books_storage_path_guard
  BEFORE INSERT OR UPDATE OF file_url, cover_url, cover_thumbnail_url ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.hb_book_storage_path_guard();

ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_cover_bucket_check;
ALTER TABLE public.books DROP COLUMN IF EXISTS cover_bucket;

-- Le bucket n'est supprimé que s'il est vide.
DELETE FROM storage.buckets b
 WHERE b.id = 'covers'
   AND NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'covers');

COMMIT;
