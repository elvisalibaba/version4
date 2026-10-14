-- HolisticBooks: secure editorial transitions, executed as an atomic, RLS-scoped RPC.
-- Existing books and covers are not modified by installing this function.
CREATE OR REPLACE FUNCTION public.hb_admin_transition_book(
  p_book_id uuid,
  p_action text,
  p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
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
$function$;
REVOKE ALL ON FUNCTION public.hb_admin_transition_book(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.hb_admin_transition_book(uuid,text,text) TO authenticated;
