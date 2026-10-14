-- Tests pgTAP de supabase/pending/20261014_1000_security_hardening.sql
-- Exécution sur une base locale (jamais la production) :
--   supabase start && supabase db reset && psql … -f supabase/pending/20261014_1000_security_hardening.sql
--   supabase test db
-- Tout se déroule dans une transaction annulée à la fin.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT no_plan();

-- ---------------------------------------------------------------------------
-- Outils : se faire passer pour un rôle PostgREST
-- ---------------------------------------------------------------------------
CREATE SCHEMA hb_test;
CREATE FUNCTION hb_test.act_as(p_role text, p_uid uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
END $$;
CREATE FUNCTION hb_test.reset_actor() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
END $$;
GRANT USAGE ON SCHEMA hb_test TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA hb_test TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Jeu de données
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (id, email, aud, role) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'reader@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'author@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'author2@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a5', 'other@test.local', 'authenticated', 'authenticated');
INSERT INTO public.profiles (id, email, role) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'reader@test.local', 'reader'),
  ('00000000-0000-0000-0000-0000000000a2', 'author@test.local', 'author'),
  ('00000000-0000-0000-0000-0000000000a3', 'author2@test.local', 'author'),
  ('00000000-0000-0000-0000-0000000000a4', 'admin@test.local', 'admin'),
  ('00000000-0000-0000-0000-0000000000a5', 'other@test.local', 'reader')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.books (id, title, author_id, status, review_status, copyright_status, price,
                          currency_code, is_single_sale_enabled, file_url, cover_url) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'Payant', '00000000-0000-0000-0000-0000000000a2',
   'published', 'approved', 'clear', 5, 'USD', true,
   'files/00000000-0000-0000-0000-0000000000a2/paid.pdf', 'covers/00000000-0000-0000-0000-0000000000a2/paid.png'),
  ('00000000-0000-0000-0000-0000000000b2', 'Gratuit', '00000000-0000-0000-0000-0000000000a2',
   'published', 'approved', 'clear', 0, 'USD', true,
   'files/00000000-0000-0000-0000-0000000000a2/free.pdf', 'covers/00000000-0000-0000-0000-0000000000a2/free.png'),
  ('00000000-0000-0000-0000-0000000000b3', 'Brouillon', '00000000-0000-0000-0000-0000000000a2',
   'draft', 'draft', 'clear', 5, 'USD', true,
   'files/00000000-0000-0000-0000-0000000000a2/draft.pdf', 'covers/00000000-0000-0000-0000-0000000000a2/draft.png'),
  ('00000000-0000-0000-0000-0000000000b4', 'Autre auteur', '00000000-0000-0000-0000-0000000000a3',
   'published', 'approved', 'clear', 5, 'USD', true,
   'files/00000000-0000-0000-0000-0000000000a3/other.pdf', 'covers/00000000-0000-0000-0000-0000000000a3/other.png');
INSERT INTO public.book_formats (book_id, format, price, currency_code, is_published) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'ebook', 5, 'USD', true),
  ('00000000-0000-0000-0000-0000000000b2', 'ebook', 0, 'USD', true),
  ('00000000-0000-0000-0000-0000000000b4', 'ebook', 5, 'USD', true);

INSERT INTO public.subscription_plans (id, name, monthly_price, currency_code, is_active)
VALUES ('00000000-0000-0000-0000-0000000000c1', 'Plus test', 3, 'USD', true);
INSERT INTO public.subscription_plan_books (plan_id, book_id)
VALUES ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b4');

-- ---------------------------------------------------------------------------
-- #2 Abonnements : un lecteur ne s'attribue rien
-- ---------------------------------------------------------------------------
SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok(
  $$ INSERT INTO public.user_subscriptions (user_id, plan_id, status)
     VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'active') $$,
  '42501', NULL, 'un lecteur ne peut pas créer son propre abonnement');
SELECT hb_test.reset_actor();

-- ---------------------------------------------------------------------------
-- #3 #4 Colonnes privées
-- ---------------------------------------------------------------------------
SELECT hb_test.act_as('anon');
SELECT throws_ok($$ SELECT file_url FROM public.books $$, '42501', NULL, 'anon ne lit pas books.file_url');
SELECT throws_ok($$ SELECT file_url FROM public.book_formats $$, '42501', NULL, 'anon ne lit pas book_formats.file_url');
SELECT throws_ok($$ SELECT phone FROM public.author_profiles $$, '42501', NULL, 'anon ne lit pas le téléphone des auteurs');
SELECT lives_ok($$ SELECT id, title, cover_url, price FROM public.books $$, 'anon lit les colonnes publiques du catalogue');
SELECT is((SELECT count(*)::int FROM public.books WHERE id = '00000000-0000-0000-0000-0000000000b3'), 0,
  'anon ne voit pas un brouillon');
SELECT hb_test.reset_actor();

SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok($$ SELECT file_url FROM public.books $$, '42501', NULL, 'un lecteur ne lit pas books.file_url');
SELECT throws_ok($$ SELECT * FROM public.hb_book_private_fields('00000000-0000-0000-0000-0000000000b1') $$,
  '42501', NULL, 'un lecteur ne lit pas les champs privés d''un livre');
SELECT hb_test.reset_actor();

SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a2');
SELECT is((SELECT file_url FROM public.hb_book_private_fields('00000000-0000-0000-0000-0000000000b1')),
  'files/00000000-0000-0000-0000-0000000000a2/paid.pdf', 'l''auteur lit le chemin de son fichier par RPC');
SELECT hb_test.reset_actor();

-- Une couverture n'expose jamais un objet hors de covers/.
UPDATE public.books SET cover_url = 'files/00000000-0000-0000-0000-0000000000a3/other.pdf'
 WHERE id = '00000000-0000-0000-0000-0000000000b1';
SELECT is(public.hb_book_cover_is_public('files/00000000-0000-0000-0000-0000000000a3/other.pdf'), false,
  'un cover_url pointant vers files/ ne rend pas le fichier public');
UPDATE public.books SET cover_url = 'covers/00000000-0000-0000-0000-0000000000a2/paid.png'
 WHERE id = '00000000-0000-0000-0000-0000000000b1';
SELECT is(public.hb_book_cover_is_public('covers/00000000-0000-0000-0000-0000000000a2/paid.png'), true,
  'la couverture d''un livre publié est publique');
SELECT is(public.hb_book_cover_is_public('covers/00000000-0000-0000-0000-0000000000a2/draft.png'), false,
  'la couverture d''un brouillon n''est pas publique');

-- ---------------------------------------------------------------------------
-- #5 Privilèges anon
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public'
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
      AND NOT (table_name = 'editorial_training_requests' AND privilege_type = 'INSERT')),
  0, 'anon n''a aucun droit d''écriture (hors formulaire de formation)');
SELECT is(
  (SELECT count(*)::int FROM information_schema.role_table_grants
    WHERE grantee = 'authenticated' AND table_schema = 'public' AND privilege_type = 'TRUNCATE'),
  0, 'authenticated n''a TRUNCATE sur aucune table');

-- ---------------------------------------------------------------------------
-- #6 book_assets
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'book_assets' AND cmd = 'SELECT'
      AND (roles && ARRAY['anon', 'public']::name[])),
  0, 'aucune lecture directe de book_assets pour anon');

-- ---------------------------------------------------------------------------
-- #7 Création de livres et verrous auteur
-- ---------------------------------------------------------------------------
SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok(
  $$ INSERT INTO public.books (title, author_id, review_status) VALUES ('Pirate', '00000000-0000-0000-0000-0000000000a1', 'draft') $$,
  '42501', NULL, 'un lecteur ne peut pas créer de livre');
SELECT hb_test.reset_actor();

SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a2');
SELECT lives_ok(
  $$ INSERT INTO public.books (title, author_id, review_status) VALUES ('Nouveau', '00000000-0000-0000-0000-0000000000a2', 'draft') $$,
  'un auteur crée un brouillon');
SELECT throws_ok(
  $$ UPDATE public.books SET cover_url = 'covers/00000000-0000-0000-0000-0000000000a3/other.png'
      WHERE id = '00000000-0000-0000-0000-0000000000b3' $$,
  '42501', NULL, 'un auteur ne pointe pas vers la couverture d''un autre');
SELECT throws_ok(
  $$ UPDATE public.books SET file_url = 'files/00000000-0000-0000-0000-0000000000a3/other.pdf'
      WHERE id = '00000000-0000-0000-0000-0000000000b3' $$,
  '42501', NULL, 'un auteur ne pointe pas vers le fichier d''un autre');
SELECT throws_ok(
  $$ UPDATE public.books SET price = 1 WHERE id = '00000000-0000-0000-0000-0000000000b1' $$,
  NULL, NULL, 'un auteur ne modifie pas un livre publié');
SELECT hb_test.reset_actor();

-- ---------------------------------------------------------------------------
-- #8 user_has_access_to_book (règles de BookAccessService::canRead)
-- ---------------------------------------------------------------------------
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1'),
  false, 'sans achat ni abonnement : pas d''accès');
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2'),
  true, 'livre gratuit (format préféré à 0, vente unitaire) : accès');

INSERT INTO public.library (user_id, book_id, access_type, status)
VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'purchase', 'active');
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1'),
  true, 'achat actif : accès');
UPDATE public.library SET status = 'revoked'
 WHERE user_id = '00000000-0000-0000-0000-0000000000a1' AND book_id = '00000000-0000-0000-0000-0000000000b1';
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1'),
  false, 'entrée révoquée : pas d''accès');
UPDATE public.library SET status = 'active', expires_at = now() - interval '1 day'
 WHERE user_id = '00000000-0000-0000-0000-0000000000a1' AND book_id = '00000000-0000-0000-0000-0000000000b1';
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1'),
  false, 'entrée expirée : pas d''accès');

INSERT INTO public.user_subscriptions (user_id, plan_id, status, expires_at)
VALUES ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000c1', 'active', now() + interval '10 days');
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000b4'),
  true, 'abonnement actif couvrant le livre : accès');
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000b1'),
  false, 'abonnement actif ne couvrant pas le livre : pas d''accès');
UPDATE public.user_subscriptions SET expires_at = now() - interval '1 day'
 WHERE user_id = '00000000-0000-0000-0000-0000000000a5';
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000b4'),
  false, 'abonnement expiré : pas d''accès');

INSERT INTO public.mobile_app_trial_grants (user_id, status, expires_at)
VALUES ('00000000-0000-0000-0000-0000000000a5', 'active', now() + interval '1 day');
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000b1'),
  true, 'essai mobile actif : accès aux livres numériques publiés');

INSERT INTO public.library (user_id, book_id, access_type, status)
VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b3', 'purchase', 'active');
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b3'),
  false, 'brouillon : pas d''accès même en bibliothèque');

SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT is(public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000b1'),
  false, 'pas d''oracle : un lecteur n''interroge pas les droits d''un autre');
SELECT hb_test.reset_actor();

SELECT hb_test.act_as('anon');
SELECT throws_ok(
  $$ SELECT public.user_has_access_to_book('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2') $$,
  '42501', NULL, 'anon n''exécute pas user_has_access_to_book');
SELECT hb_test.reset_actor();

-- ---------------------------------------------------------------------------
-- #9 Engagement
-- ---------------------------------------------------------------------------
SELECT hb_test.act_as('anon');
SELECT throws_ok(
  $$ SELECT public.track_book_engagement('00000000-0000-0000-0000-0000000000b3', 'detail_view', 'test', '{"session_hash":"s1"}') $$,
  '42501', NULL, 'pas d''engagement sur un brouillon');
SELECT throws_ok(
  $$ SELECT public.track_book_engagement('00000000-0000-0000-0000-0000000000b1', 'detail_view', 'test', '{"evil":"x"}') $$,
  '22023', NULL, 'clé de métadonnées refusée');
SELECT lives_ok(
  $$ SELECT public.track_book_engagement('00000000-0000-0000-0000-0000000000b1', 'detail_view', 'test', '{"session_hash":"s1"}') $$,
  'première vue comptée');
SELECT lives_ok(
  $$ SELECT public.track_book_engagement('00000000-0000-0000-0000-0000000000b1', 'detail_view', 'test', '{"session_hash":"s1"}') $$,
  'deuxième vue acceptée sans erreur');
SELECT throws_ok(
  $$ INSERT INTO public.book_engagement_events (book_id, event_type) VALUES ('00000000-0000-0000-0000-0000000000b1', 'detail_view') $$,
  '42501', NULL, 'anon n''insère plus directement');
SELECT hb_test.reset_actor();
SELECT is(
  (SELECT count(*)::int FROM public.book_engagement_events
    WHERE book_id = '00000000-0000-0000-0000-0000000000b1' AND metadata ->> 'session_hash' = 's1'),
  1, 'une seule vue par session sur 30 minutes');

-- ---------------------------------------------------------------------------
-- #10 Journal d'audit
-- ---------------------------------------------------------------------------
INSERT INTO public.platform_audit_events (id, actor_id, action, entity_type, summary)
VALUES ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a4', 'test', 'book', 'test');
SELECT throws_ok($$ UPDATE public.platform_audit_events SET summary = 'x' WHERE id = '00000000-0000-0000-0000-0000000000d1' $$,
  '42501', NULL, 'l''audit ne se modifie pas, même en postgres');
SELECT throws_ok($$ DELETE FROM public.platform_audit_events WHERE id = '00000000-0000-0000-0000-0000000000d1' $$,
  '42501', NULL, 'l''audit ne se supprime pas');

-- ---------------------------------------------------------------------------
-- #12 Avis
-- ---------------------------------------------------------------------------
-- Le lecteur a1 : entrée « purchase » de b1 expirée plus haut, entrée « purchase » sur le brouillon b3.
SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok(
  $$ INSERT INTO public.ratings (user_id, book_id, rating) VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b3', 5) $$,
  '42501', NULL, 'pas d''avis sur un livre non publié');
SELECT throws_ok(
  $$ INSERT INTO public.ratings (user_id, book_id, rating) VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 5) $$,
  '42501', NULL, 'pas d''avis sur un livre payant sans accès');
SELECT lives_ok(
  $$ INSERT INTO public.ratings (user_id, book_id, rating) VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2', 4) $$,
  'avis sur un livre gratuit');
SELECT hb_test.reset_actor();

-- a5 : essai mobile actif (accès en lecture) mais l'essai ne permet pas de noter.
SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a5');
SELECT throws_ok(
  $$ INSERT INTO public.ratings (user_id, book_id, rating) VALUES ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000b1', 5) $$,
  '42501', NULL, 'l''essai mobile ne suffit pas pour noter');
SELECT hb_test.reset_actor();

-- L'auteur ne note pas son propre livre, même gratuit.
SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a2');
SELECT throws_ok(
  $$ INSERT INTO public.ratings (user_id, book_id, rating) VALUES ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b2', 5) $$,
  '42501', NULL, 'un auteur ne note pas son propre livre');
SELECT hb_test.reset_actor();

-- Achat actif : avis autorisé et badge « Achat vérifié ».
UPDATE public.library SET expires_at = NULL
 WHERE user_id = '00000000-0000-0000-0000-0000000000a1' AND book_id = '00000000-0000-0000-0000-0000000000b1';
SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT lives_ok(
  $$ INSERT INTO public.ratings (user_id, book_id, rating) VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 5) $$,
  'avis après achat');
SELECT hb_test.reset_actor();
SELECT hb_test.act_as('anon');
SELECT is(
  (SELECT array_agg(user_id) FROM public.hb_review_verified_purchasers('00000000-0000-0000-0000-0000000000b1')),
  ARRAY['00000000-0000-0000-0000-0000000000a1'::uuid], 'badge « Achat vérifié » pour l''acheteur');
SELECT is(
  (SELECT count(*)::int FROM public.hb_review_verified_purchasers('00000000-0000-0000-0000-0000000000b2')),
  0, 'pas de badge pour un avis sur un livre gratuit');
SELECT hb_test.reset_actor();

-- ---------------------------------------------------------------------------
-- #13 Fonctions SECURITY DEFINER
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND NOT ('search_path=""' = ANY (COALESCE(p.proconfig, '{}')))),
  0, 'toutes les fonctions SECURITY DEFINER ont search_path vide');
SELECT is(
  (SELECT array_agg(p.proname::text ORDER BY p.proname)
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND has_function_privilege('anon', p.oid, 'EXECUTE')),
  ARRAY['has_book_access', 'hb_book_cover_is_public', 'hb_book_is_public', 'hb_book_is_published',
        'hb_review_verified_purchasers',
        'is_admin', 'is_current_user_admin', 'owns_book', 'owns_order', 'track_book_engagement'],
  'anon n''exécute que les fonctions SECURITY DEFINER prévues');

-- ---------------------------------------------------------------------------
-- #15 Profils
-- ---------------------------------------------------------------------------
SELECT hb_test.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok(
  $$ UPDATE public.profiles SET staff_role = 'super_admin' WHERE id = '00000000-0000-0000-0000-0000000000a1' $$,
  '42501', NULL, 'un lecteur ne se donne pas de rôle du personnel');
SELECT throws_ok(
  $$ UPDATE public.profiles SET role = 'admin' WHERE id = '00000000-0000-0000-0000-0000000000a1' $$,
  '42501', NULL, 'un lecteur ne se donne pas le rôle admin');
SELECT hb_test.reset_actor();

SELECT * FROM finish();
ROLLBACK;
