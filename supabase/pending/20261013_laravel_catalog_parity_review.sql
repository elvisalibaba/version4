-- HolisticBooks / dev-ancien / compare Laravel 2026-10-13
-- Migration additive pour le catalogue auteur et les taxonomies académiques.
-- NON appliquée : revue obligatoire des contraintes et tests sur copie de base.
BEGIN;
ALTER TABLE public.books ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS authorship_type text NOT NULL DEFAULT 'named';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author_credit text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS editorial_pole text NOT NULL DEFAULT 'general';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS work_type text NOT NULL DEFAULT 'book';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS editorial_stage text NOT NULL DEFAULT 'intake';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS spiritual_metadata jsonb;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS ingestion_metadata jsonb;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cover_source text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS bat_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS bat_approved_at timestamptz;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS bat_approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS public.academic_taxonomies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.academic_taxonomies(id) ON DELETE SET NULL,
  audience text NOT NULL CHECK(audience IN ('school','university')),
  kind text NOT NULL,code text UNIQUE,name text NOT NULL,slug text NOT NULL UNIQUE,
  description text,sort_order int NOT NULL DEFAULT 0,is_active boolean NOT NULL DEFAULT true,
  is_official boolean NOT NULL DEFAULT false, source_url text, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.book_academic_taxonomy (
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  academic_taxonomy_id uuid NOT NULL REFERENCES public.academic_taxonomies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(book_id,academic_taxonomy_id)
);
CREATE TABLE IF NOT EXISTS public.book_editorial_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
 actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 event_type text NOT NULL,from_stage text,to_stage text,notes text,payload jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academic_taxonomy_audience_idx ON public.academic_taxonomies(audience,kind,is_active);
CREATE INDEX IF NOT EXISTS book_editorial_events_book_idx ON public.book_editorial_events(book_id,created_at);
ALTER TABLE public.academic_taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_academic_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_editorial_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_taxonomies, public.book_academic_taxonomy, public.book_editorial_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.academic_taxonomies TO anon, authenticated;
GRANT SELECT ON public.book_academic_taxonomy TO anon, authenticated;
GRANT SELECT ON public.book_editorial_events TO authenticated;
-- Les modifications et l'administration nécessitent une route serveur autorisée,
-- jamais une clé service-role publiée dans le frontend.
CREATE POLICY "public_catalog_taxonomies" ON public.academic_taxonomies FOR SELECT TO anon, authenticated USING(is_active);
CREATE POLICY "public_book_taxonomies" ON public.book_academic_taxonomy FOR SELECT TO anon, authenticated
 USING(EXISTS(SELECT 1 FROM public.books b WHERE b.id=book_id AND b.status='published' AND b.copyright_status<>'blocked'));
CREATE POLICY "editorial_event_own_author" ON public.book_editorial_events FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.books b WHERE b.id=book_id AND b.author_id=(SELECT auth.uid())) OR public.is_current_user_admin());
COMMIT;
