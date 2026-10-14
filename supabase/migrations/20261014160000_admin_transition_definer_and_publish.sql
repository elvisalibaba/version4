-- =============================================================================
-- HolisticBooks — Admin : transitions éditoriales réparées + « Valider et publier »
-- =============================================================================
-- Bug : hb_admin_transition_book était SECURITY INVOKER et lisait books.* ; depuis les droits de
-- colonne (20261014100000), authenticated ne lit plus file_url… → 42501 « permission denied for
-- table books » sur toute action admin. Elle devient SECURITY DEFINER, contrôle admin en tête.
-- Même correction pour admin_import_published_book (lit admin_import_checksum).
--
-- Nouveautés :
--   * action « admin_publish » : livre ajouté par l'équipe (import admin, sans auteur ou créé par
--     un admin) → droits clear (référence obligatoire), approuvé et publié en UNE transaction ;
--   * « publish » vérifie la couverture dans son vrai bucket (covers ou books) ;
--   * chaque action laisse un événement éditorial ET une trace dans platform_audit_events.
-- Idempotente, transactionnelle. Annulation : supabase/rollbacks/20261014160000_admin_transition_definer_and_publish.down.sql
-- =============================================================================

BEGIN;

-- Livre ajouté par l'équipe : import admin, sans auteur, ou dont le « propriétaire » est un admin.
CREATE OR REPLACE FUNCTION public.hb_book_added_by_admin(p_book_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.books b
     WHERE b.id = p_book_id
       AND (b.admin_imported_by IS NOT NULL
            OR b.author_id IS NULL
            OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = b.author_id AND p.role = 'admin'))
  );
$$;
REVOKE ALL ON FUNCTION public.hb_book_added_by_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_book_added_by_admin(uuid) TO authenticated, service_role;

-- Fichiers d'un livre présents dans le stockage : NULL si tout est là, sinon ce qui manque.
CREATE OR REPLACE FUNCTION public.hb_book_missing_assets(p_book_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_book record;
  v_missing text[] := ARRAY[]::text[];
BEGIN
  SELECT b.cover_url, b.cover_bucket, b.file_url INTO v_book FROM public.books b WHERE b.id = p_book_id;
  IF NOT FOUND THEN
    RETURN 'livre introuvable';
  END IF;
  IF nullif(btrim(coalesce(v_book.cover_url, '')), '') IS NULL THEN
    v_missing := v_missing || 'couverture non renseignée'::text;
  ELSIF NOT EXISTS (SELECT 1 FROM storage.objects o
                     WHERE o.bucket_id = coalesce(v_book.cover_bucket, 'books') AND o.name = v_book.cover_url) THEN
    v_missing := v_missing || format('couverture absente du stockage (%s/%s)', coalesce(v_book.cover_bucket, 'books'), v_book.cover_url);
  END IF;
  IF nullif(btrim(coalesce(v_book.file_url, '')), '') IS NULL THEN
    v_missing := v_missing || 'fichier du livre (PDF/EPUB) non renseigné'::text;
  ELSIF NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'books' AND o.name = v_book.file_url) THEN
    v_missing := v_missing || format('fichier du livre absent du stockage (books/%s)', v_book.file_url);
  END IF;
  RETURN CASE WHEN cardinality(v_missing) = 0 THEN NULL ELSE array_to_string(v_missing, ' ; ') END;
END;
$$;
REVOKE ALL ON FUNCTION public.hb_book_missing_assets(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_book_missing_assets(uuid) TO service_role;

-- Nouvelle signature (référence des droits) : l'ancienne est supprimée pour éviter toute ambiguïté.
DROP FUNCTION IF EXISTS public.hb_admin_transition_book(uuid, text, text);

CREATE OR REPLACE FUNCTION public.hb_admin_transition_book(
  p_book_id uuid,
  p_action text,
  p_note text DEFAULT NULL,
  p_rights_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  previous public.books%ROWTYPE;
  current_book public.books%ROWTYPE;
  note_text text := nullif(btrim(coalesce(p_note, '')), '');
  rights_ref text := nullif(btrim(coalesce(p_rights_reference, '')), '');
  missing text;
BEGIN
  -- Contrôle de rôle en base, avant toute lecture.
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Accès administrateur requis' USING ERRCODE = '42501';
  END IF;
  IF p_book_id IS NULL THEN
    RAISE EXCEPTION 'Livre invalide' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(p_note, '')) > 2000 OR length(coalesce(p_rights_reference, '')) > 500 THEN
    RAISE EXCEPTION 'Commentaire ou référence trop long' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO previous FROM public.books WHERE id = p_book_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Livre introuvable' USING ERRCODE = 'P0002';
  END IF;

  IF p_action = 'admin_publish' THEN
    IF NOT public.hb_book_added_by_admin(p_book_id) THEN
      RAISE EXCEPTION 'Livre soumis par un auteur : utilisez le circuit Valider puis Publier' USING ERRCODE = '22023';
    END IF;
    IF previous.status = 'published' THEN
      RAISE EXCEPTION 'Ce livre est déjà publié' USING ERRCODE = '22023';
    END IF;
    IF previous.copyright_status = 'blocked' THEN
      RAISE EXCEPTION 'Droits bloqués : levez le blocage avant de publier' USING ERRCODE = '22023';
    END IF;
    IF rights_ref IS NULL THEN
      RAISE EXCEPTION 'Référence des droits obligatoire (contrat, autorisation, domaine public…)' USING ERRCODE = '22023';
    END IF;
    missing := public.hb_book_missing_assets(p_book_id);
    IF missing IS NOT NULL THEN
      RAISE EXCEPTION 'Publication impossible : %', missing USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET
      copyright_status = 'clear',
      copyright_note = coalesce(note_text, 'Droits confirmés par l''administration'),
      rights_agreement_reference = rights_ref,
      copyright_blocked_at = NULL,
      copyright_blocked_by = NULL,
      review_status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = note_text,
      status = 'published',
      published_at = coalesce(published_at, now())
    WHERE id = p_book_id;

  ELSIF p_action = 'approve' THEN
    IF previous.review_status <> 'submitted' THEN
      RAISE EXCEPTION 'Seul un livre soumis peut être validé' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET review_status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_note = note_text
    WHERE id = p_book_id;

  ELSIF p_action = 'request_changes' THEN
    IF previous.review_status <> 'submitted' OR note_text IS NULL THEN
      RAISE EXCEPTION 'Livre soumis et motif requis pour demander des corrections' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET status = 'draft', review_status = 'changes_requested', reviewed_by = auth.uid(),
      reviewed_at = now(), review_note = note_text, published_at = NULL
    WHERE id = p_book_id;

  ELSIF p_action = 'reject' THEN
    IF previous.review_status <> 'submitted' OR note_text IS NULL THEN
      RAISE EXCEPTION 'Livre soumis et motif requis pour refuser' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET status = 'draft', review_status = 'rejected', reviewed_by = auth.uid(),
      reviewed_at = now(), review_note = note_text, published_at = NULL
    WHERE id = p_book_id;

  ELSIF p_action = 'publish' THEN
    IF previous.review_status <> 'approved' OR previous.copyright_status <> 'clear' THEN
      RAISE EXCEPTION 'Validation éditoriale et droits de diffusion confirmés requis' USING ERRCODE = '22023';
    END IF;
    missing := public.hb_book_missing_assets(p_book_id);
    IF missing IS NOT NULL THEN
      RAISE EXCEPTION 'Publication impossible : %', missing USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET status = 'published', published_at = coalesce(published_at, now()) WHERE id = p_book_id;

  ELSIF p_action = 'coming_soon' THEN
    IF previous.review_status <> 'approved' OR previous.copyright_status <> 'clear'
       OR nullif(btrim(coalesce(previous.cover_url, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Validation, droits confirmés et couverture requis' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET status = 'coming_soon' WHERE id = p_book_id;

  ELSIF p_action = 'unpublish' THEN
    IF previous.status NOT IN ('published', 'coming_soon') THEN
      RAISE EXCEPTION 'Ce livre n’est pas publié' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET status = 'draft', published_at = NULL WHERE id = p_book_id;

  ELSIF p_action = 'archive' THEN
    IF previous.status = 'archived' THEN
      RAISE EXCEPTION 'Ce livre est déjà archivé' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET status = 'archived' WHERE id = p_book_id;

  ELSIF p_action = 'reset_draft' THEN
    IF previous.status = 'published' THEN
      RAISE EXCEPTION 'Dépubliez le livre avant de revenir au brouillon' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET status = 'draft', review_status = 'draft', reviewed_by = NULL, reviewed_at = NULL,
      review_note = NULL, published_at = NULL
    WHERE id = p_book_id;

  ELSIF p_action = 'rights_clear' THEN
    IF note_text IS NULL AND rights_ref IS NULL THEN
      RAISE EXCEPTION 'Indiquez une référence ou justification des droits' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET copyright_status = 'clear', copyright_note = coalesce(note_text, rights_ref),
      rights_agreement_reference = coalesce(rights_ref, rights_agreement_reference),
      copyright_blocked_at = NULL, copyright_blocked_by = NULL
    WHERE id = p_book_id;

  ELSIF p_action = 'rights_review' THEN
    UPDATE public.books SET
      status = (CASE WHEN status IN ('published', 'coming_soon') THEN 'draft' ELSE status END),
      copyright_status = 'review', copyright_note = note_text,
      published_at = (CASE WHEN status IN ('published', 'coming_soon') THEN NULL ELSE published_at END)
    WHERE id = p_book_id;

  ELSIF p_action = 'rights_block' THEN
    IF note_text IS NULL THEN
      RAISE EXCEPTION 'Le motif du blocage des droits est obligatoire' USING ERRCODE = '22023';
    END IF;
    UPDATE public.books SET status = 'draft', copyright_status = 'blocked', copyright_note = note_text,
      copyright_blocked_at = now(), copyright_blocked_by = auth.uid(), published_at = NULL
    WHERE id = p_book_id;

  ELSE
    RAISE EXCEPTION 'Action éditoriale inconnue' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO current_book FROM public.books WHERE id = p_book_id;

  INSERT INTO public.book_editorial_events (book_id, actor_id, event_type, from_stage, to_stage, notes, payload)
  VALUES (p_book_id, auth.uid(), p_action,
    previous.status || '/' || previous.review_status,
    current_book.status || '/' || current_book.review_status,
    note_text,
    pg_catalog.jsonb_build_object(
      'previous_copyright_status', previous.copyright_status,
      'copyright_status', current_book.copyright_status,
      'rights_reference', rights_ref));

  INSERT INTO public.platform_audit_events (actor_id, action, entity_type, entity_id, severity, summary, before_state, after_state, context)
  VALUES (auth.uid(), 'book.' || p_action, 'book', p_book_id,
    CASE WHEN p_action IN ('rights_block', 'unpublish', 'reject') THEN 'warning' ELSE 'info' END,
    left(current_book.title, 200),
    pg_catalog.jsonb_build_object('status', previous.status, 'review_status', previous.review_status, 'copyright_status', previous.copyright_status),
    pg_catalog.jsonb_build_object('status', current_book.status, 'review_status', current_book.review_status, 'copyright_status', current_book.copyright_status),
    pg_catalog.jsonb_build_object('note', note_text, 'rights_reference', rights_ref));

  RETURN pg_catalog.jsonb_build_object(
    'id', current_book.id,
    'status', current_book.status,
    'review_status', current_book.review_status,
    'copyright_status', current_book.copyright_status);
END;
$$;
REVOKE ALL ON FUNCTION public.hb_admin_transition_book(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_admin_transition_book(uuid, text, text, text) TO authenticated, service_role;

-- Import admin : même cause (lecture de admin_import_checksum) → SECURITY DEFINER.
-- Le contrôle « auth.uid() admin » est déjà la première instruction de la fonction.
ALTER FUNCTION public.admin_import_published_book(uuid, uuid, text, boolean, text, text, uuid, text, text, text, numeric, text, text, text, text, bigint, integer)
  SECURITY DEFINER;
ALTER FUNCTION public.admin_import_published_book(uuid, uuid, text, boolean, text, text, uuid, text, text, text, numeric, text, text, text, text, bigint, integer)
  SET search_path = '';
REVOKE ALL ON FUNCTION public.admin_import_published_book(uuid, uuid, text, boolean, text, text, uuid, text, text, text, numeric, text, text, text, text, bigint, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_import_published_book(uuid, uuid, text, boolean, text, text, uuid, text, text, text, numeric, text, text, text, text, bigint, integer)
  TO authenticated, service_role;

COMMIT;
