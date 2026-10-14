BEGIN;
-- Retirer les politiques historiques trop permissives (union OR des RLS).
DROP POLICY IF EXISTS "books_read_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "books_public_covers_read" ON storage.objects;
DROP POLICY IF EXISTS "books_insert_avatars_or_author_files" ON storage.objects;
DROP POLICY IF EXISTS "books_update_delete_avatars_or_author_files" ON storage.objects;
DROP POLICY IF EXISTS "Purchased users can read ebook files" ON storage.objects;
DROP POLICY IF EXISTS "Purchased users can read format ebook files" ON storage.objects;
DROP POLICY IF EXISTS "Accessible users can read digital format files" ON storage.objects;
DROP POLICY IF EXISTS "book_read_auth" ON storage.objects;
DROP POLICY IF EXISTS "Reader inserts own library items" ON public.library;
REVOKE INSERT ON public.library FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view published or coming soon books" ON public.books;
DROP POLICY IF EXISTS "mobile published books read" ON public.books;
DROP POLICY IF EXISTS "books_public_read" ON public.books;
CREATE POLICY "hb_public_book_visibility" ON public.books FOR SELECT TO anon,authenticated
 USING(
   ((status='published' AND review_status='approved' OR status='coming_soon')
      AND coalesce(copyright_status,'review')<>'blocked')
   OR author_id=(SELECT auth.uid())
   OR public.is_current_user_admin()
 );

-- Les formats ne doivent pas rendre publics les ouvrages non approuvés ou bloqués.
DROP POLICY IF EXISTS "formats_read" ON public.book_formats;
DROP POLICY IF EXISTS "Anyone can view published formats" ON public.book_formats;
CREATE POLICY "hb_public_published_formats" ON public.book_formats FOR SELECT TO anon, authenticated
 USING (
   is_published AND EXISTS (
      SELECT 1 FROM public.books b WHERE b.id=book_id AND b.status='published'
      AND b.review_status='approved' AND b.copyright_status='clear'
   )
 );
DROP POLICY IF EXISTS "mobile published formats read" ON public.book_formats;

-- La table associative des auteurs avait RLS activé mais aucune policy.
CREATE POLICY "hb_read_book_authors" ON public.book_authors FOR SELECT TO anon,authenticated
 USING (EXISTS (SELECT 1 FROM public.books b WHERE b.id=book_id AND b.status='published'
                AND b.review_status='approved' AND b.copyright_status='clear'));
CREATE POLICY "hb_manage_book_authors_admin" ON public.book_authors FOR ALL TO authenticated
 USING (public.is_current_user_admin()) WITH CHECK(public.is_current_user_admin());

-- Empêche les auteurs de s'auto-valider ou de falsifier les compteurs via PostgREST.
CREATE OR REPLACE FUNCTION public.hb_book_workflow_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $guard$
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
$guard$;
REVOKE ALL ON FUNCTION public.hb_book_workflow_guard() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS hb_enforce_book_workflow ON public.books;
CREATE TRIGGER hb_enforce_book_workflow BEFORE INSERT OR UPDATE ON public.books
FOR EACH ROW EXECUTE FUNCTION public.hb_book_workflow_guard();

-- Index ciblés pour les recherches et accès sécurisés.
CREATE INDEX IF NOT EXISTS hb_books_status_review_idx ON public.books(status,review_status,copyright_status,published_at DESC);
CREATE INDEX IF NOT EXISTS hb_library_user_book_idx ON public.library(user_id,book_id);
COMMIT;