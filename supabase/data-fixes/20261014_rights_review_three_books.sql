-- Étape 7 — Droits d'auteur : 3 livres repassés en « review » et dépubliés.
-- STATUT : validée par le propriétaire, EXÉCUTÉE en production le 14/10/2026 (3 livres, 3 événements d audit).
-- Une seule transaction. Si le nombre de lignes modifiées n'est pas exactement 3,
-- l'exception annule tout.
--
-- Effet :
--   * status 'published' → 'draft' (le livre disparaît du catalogue et du lecteur) ;
--   * copyright_status 'clear' → 'review' (republication bloquée tant que l'admin
--     n'a pas validé les droits : trigger enforce_book_publication_rights) ;
--   * auteur affiché de « Père Riche Père Pauvre » corrigé en « Robert T. Kiyosaki » ;
--   * une ligne par livre dans platform_audit_events (avant / après).
-- Les entrées de bibliothèque existantes (3 + 1) sont conservées ; elles ne donnent
-- plus accès tant que le livre n'est pas republié.

BEGIN;

DO $$
DECLARE
  v_count integer;
BEGIN
  WITH targets(id, new_author) AS (
    VALUES
      ('9b7a1207-86a6-4313-aa04-18ef7424bd2f'::uuid, 'Robert T. Kiyosaki'),  -- Père Riche Père Pauvre
      ('914ed9de-118d-4b62-9b9e-3a2407f5e8f4'::uuid, NULL),                  -- Les Vertus de l'échec
      ('7739c5d3-cff1-4f5f-acac-fad7e52f1357'::uuid, NULL)                   -- ROMPRE AVEC SOI-MÊME
  ),
  before AS (
    SELECT b.id, jsonb_build_object(
             'status', b.status, 'copyright_status', b.copyright_status,
             'author_display_name', b.author_display_name, 'published_at', b.published_at) AS state
      FROM public.books b JOIN targets t ON t.id = b.id
     WHERE b.status = 'published'
  ),
  updated AS (
    UPDATE public.books b
       SET status = 'draft',
           copyright_status = 'review',
           copyright_note = 'Droits à vérifier (14/10/2026) : œuvre protégée sans accord de diffusion référencé.',
           author_display_name = COALESCE(t.new_author, b.author_display_name)
      FROM targets t
     WHERE b.id = t.id AND b.id IN (SELECT id FROM before)
    RETURNING b.id, b.title, jsonb_build_object(
             'status', b.status, 'copyright_status', b.copyright_status,
             'author_display_name', b.author_display_name, 'published_at', b.published_at) AS state
  ),
  audit AS (
    INSERT INTO public.platform_audit_events
      (actor_id, action, entity_type, entity_id, severity, summary, before_state, after_state, context)
    SELECT NULL, 'book.rights_review', 'book', u.id, 'warning',
           'Dépublication pour vérification des droits : ' || u.title,
           bf.state, u.state,
           jsonb_build_object('requested_by', 'propriétaire du projet', 'executed_by', 'Claude Code', 'date', '2026-10-14')
      FROM updated u JOIN before bf ON bf.id = u.id
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM audit;

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'Attendu 3 livres modifiés, obtenu % : annulation', v_count;
  END IF;
END
$$;

-- Contrôle (avant COMMIT) : les 3 livres doivent apparaître en draft / review.
SELECT id, title, status, copyright_status, author_display_name
  FROM public.books
 WHERE id IN ('9b7a1207-86a6-4313-aa04-18ef7424bd2f', '914ed9de-118d-4b62-9b9e-3a2407f5e8f4',
              '7739c5d3-cff1-4f5f-acac-fad7e52f1357');

COMMIT;
