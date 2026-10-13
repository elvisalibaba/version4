-- HolisticBooks ESS: reviews and favorites. Safe, rerunnable migration.
-- Preserve existing ratings and 7 existing favorites. Restrict exposed tables to least privilege.
BEGIN;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_favorites ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ratings FROM anon;
REVOKE ALL ON TABLE public.book_favorites FROM anon;
GRANT SELECT ON TABLE public.ratings TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.ratings TO authenticated;
GRANT SELECT,INSERT,DELETE ON TABLE public.book_favorites TO authenticated;

DROP POLICY IF EXISTS ratings_read ON public.ratings;
CREATE POLICY ratings_read ON public.ratings
FOR SELECT TO anon,authenticated
USING (NOT is_hidden OR (SELECT auth.uid()) = user_id OR public.is_current_user_admin());

-- The other legacy policies already enforce user_id = auth.uid().
-- This restrictive policy additionally forbids authors from reviewing their own books.
DROP POLICY IF EXISTS hb_no_self_review_insert ON public.ratings;
CREATE POLICY hb_no_self_review_insert ON public.ratings
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.books b WHERE b.id = book_id AND b.author_id = (SELECT auth.uid())
  )
);
DROP POLICY IF EXISTS hb_no_self_review_update ON public.ratings;
CREATE POLICY hb_no_self_review_update ON public.ratings
AS RESTRICTIVE FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.books b WHERE b.id = book_id AND b.author_id = (SELECT auth.uid())
  )
);

-- Disallow readers from forging moderation state, helpful counts and ownership.
CREATE OR REPLACE FUNCTION public.hb_guard_reader_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
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

DROP TRIGGER IF EXISTS hb_guard_reader_rating_trigger ON public.ratings;
CREATE TRIGGER hb_guard_reader_rating_trigger
BEFORE INSERT OR UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.hb_guard_reader_rating();

REVOKE EXECUTE ON FUNCTION public.hb_guard_reader_rating() FROM PUBLIC,anon;
COMMIT;
