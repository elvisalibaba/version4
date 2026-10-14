-- HolisticBooks — Phase 0 : diagnostic de la base réelle, en LECTURE SEULE.
--
-- Aucune écriture : la session est forcée en lecture seule (default_transaction_read_only)
-- et le script ne contient que des SELECT. À exécuter avec psql pour obtenir toutes les
-- sections (l'éditeur SQL de Supabase n'affiche que le dernier résultat) :
--
--   psql "$SUPABASE_DB_URL" -X -f supabase/diagnostics/20261014_phase0_readonly_diagnostic.sql \
--        -o supabase/diagnostics/out/phase0_$(date +%Y%m%d).txt
--
-- SUPABASE_DB_URL : chaîne « Session pooler » du tableau de bord (Project Settings > Database).
-- Le fichier de sortie ne contient aucun secret, mais il contient des métadonnées de sécurité :
-- il est ignoré par git (supabase/diagnostics/out/).

\set ON_ERROR_STOP off
\pset pager off
\pset null '∅'
SET default_transaction_read_only = on;
SET statement_timeout = '60s';

\echo '=== 00. Contexte'
SELECT current_database() AS db, version() AS pg, now() AS run_at, current_setting('transaction_read_only') AS read_only;

\echo '=== 01. Historique des migrations (CLI Supabase)'
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;

\echo '=== 02. Extensions'
SELECT extname, extversion, n.nspname AS schema
FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace ORDER BY 1;

\echo '=== 03. Tables public : RLS, RLS forcé, lignes estimées, nombre de policies'
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       GREATEST(c.reltuples, 0)::bigint AS est_rows,
       (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY 1;

\echo '=== 04. Tables public SANS RLS (doit être vide après la Phase 1)'
SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity ORDER BY 1;

\echo '=== 05. Vues et vues matérialisées public (security_invoker ?)'
SELECT c.relname, c.relkind, c.reloptions
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm') ORDER BY 1;

\echo '=== 06. Policies (public + storage)'
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

\echo '=== 07. Privilèges de table pour anon et authenticated'
SELECT table_schema, table_name, grantee,
       string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated') AND table_schema IN ('public', 'storage')
GROUP BY 1, 2, 3 ORDER BY 2, 3;

\echo '=== 08. Privilèges de colonne pour anon et authenticated'
SELECT table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE grantee IN ('anon', 'authenticated') AND table_schema = 'public'
  AND (table_name, grantee, privilege_type) NOT IN (
    SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
    WHERE table_schema = 'public')
ORDER BY 1, 2, 3;

\echo '=== 09. Privilèges par défaut (ALTER DEFAULT PRIVILEGES)'
SELECT pg_get_userbyid(d.defaclrole) AS owner, n.nspname AS schema, d.defaclobjtype AS obj, d.defaclacl
FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace ORDER BY 1, 2, 3;

\echo '=== 10. Fonctions public : SECURITY DEFINER, search_path, ACL, EXECUTE pour anon / authenticated'
SELECT p.oid::regprocedure AS function,
       p.prosecdef AS security_definer,
       p.provolatile AS volatility,
       p.proconfig AS config,
       p.proacl AS acl,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_exec
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f'
ORDER BY p.prosecdef DESC, 1;

\echo '=== 11. SECURITY DEFINER sans search_path figé (à corriger en Phase 1)'
SELECT p.oid::regprocedure
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
  AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')
ORDER BY 1;

\echo '=== 12. Triggers public'
SELECT event_object_table AS table_name, trigger_name, action_timing, string_agg(event_manipulation, ',') AS events, action_statement
FROM information_schema.triggers WHERE trigger_schema = 'public'
GROUP BY 1, 2, 3, 5 ORDER BY 1, 2;

\echo '=== 13. Triggers sur auth.users'
SELECT tgname, pg_get_triggerdef(t.oid) FROM pg_trigger t
WHERE t.tgrelid = 'auth.users'::regclass AND NOT t.tgisinternal;

\echo '=== 14. Définitions des fonctions sensibles'
SELECT p.oid::regprocedure AS function, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN (
  'user_has_access_to_book', 'protect_profile_security_fields', 'track_book_engagement',
  'hb_book_workflow_guard', 'hb_admin_transition_book', 'is_current_user_admin',
  'refresh_book_rating_stats', 'refresh_book_purchase_stats', 'refresh_book_engagement_stats',
  'ensure_reader_affiliate_profile', 'generate_reader_affiliate_code', 'safe_uuid',
  'normalize_affiliate_source_type', 'handle_new_user')
ORDER BY 1;

\echo '=== 15. Colonnes des tables public'
SELECT table_name, ordinal_position, column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

\echo '=== 16. Contraintes (PK, FK, UNIQUE, CHECK)'
SELECT conrelid::regclass AS table_name, conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE connamespace = 'public'::regnamespace
ORDER BY 1, 3, 2;

\echo '=== 17. Index public'
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY 1, 2;

\echo '=== 18. Types énumérés'
SELECT t.typname, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder)
FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' GROUP BY 1 ORDER BY 1;

\echo '=== 19. Buckets Storage'
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at FROM storage.buckets ORDER BY 1;

\echo '=== 20. Objets Storage par bucket et premier dossier'
SELECT bucket_id, split_part(name, '/', 1) AS prefix, count(*) AS objects,
       pg_size_pretty(sum(coalesce((metadata ->> 'size')::bigint, 0))) AS size
FROM storage.objects GROUP BY 1, 2 ORDER BY 1, 2;

\echo '=== 21. Couvertures : préparation Phase 3 (comptages, aucun contenu)'
SELECT count(*) AS total_books,
       count(*) FILTER (WHERE cover_url IS NULL OR cover_url = '') AS no_cover,
       count(*) FILTER (WHERE cover_url ~ '^https?://') AS absolute_url,
       count(*) FILTER (WHERE cover_url ~ '^https?://' AND cover_url !~ 'supabase\.co') AS absolute_non_supabase,
       count(*) FILTER (WHERE cover_url !~ '^https?://' AND cover_url <> ''
                        AND NOT EXISTS (SELECT 1 FROM storage.objects o
                                        WHERE o.bucket_id = 'books' AND o.name = b.cover_url)) AS relative_missing_in_storage
FROM public.books b;

\echo '=== 22. Exemples de cover_url (10 premiers, pour voir les formats)'
SELECT id, status, left(cover_url, 120) AS cover_url FROM public.books ORDER BY created_at DESC LIMIT 10;

\echo '=== 23. Bug A : livres publiés marqués « gratuits » par la règle actuelle'
SELECT b.status, b.is_single_sale_enabled,
       count(*) AS books,
       count(*) FILTER (WHERE coalesce(b.price, 0) = 0) AS books_price_zero,
       count(*) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM public.book_formats f WHERE f.book_id = b.id AND f.is_published
           AND f.format IN ('ebook', 'holistique_store'))) AS no_published_digital_format,
       count(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM public.book_formats f WHERE f.book_id = b.id AND f.is_published
           AND f.format IN ('ebook', 'holistique_store') AND coalesce(f.price, 0) = 0)) AS digital_format_price_zero
FROM public.books b WHERE b.status IN ('published', 'coming_soon')
GROUP BY 1, 2 ORDER BY 1, 2;

\echo '=== 24. Formats publiés par type'
SELECT format, is_published, currency_code, count(*), min(price), max(price)
FROM public.book_formats GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;

\echo '=== 25. Commandes par statut (aucune donnée client)'
SELECT status, payment_status, count(*) FROM public.orders GROUP BY 1, 2 ORDER BY 1, 2;

\echo '=== 26. Bibliothèque par type d accès et statut'
SELECT access_type, status, count(*) FROM public.library GROUP BY 1, 2 ORDER BY 1, 2;

\echo '=== 27. Profils par rôle'
SELECT role, count(*) FROM public.profiles GROUP BY 1 ORDER BY 1;

\echo '=== 28. Edge Functions : impossible en SQL — lister avec « supabase functions list --project-ref wgsvzhhzsmioihjwcwcs »'

\echo '=== FIN'
