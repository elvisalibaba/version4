# HolisticBooks · branche dev-ancien · audit de reprise Supabase
Date : 13 octobre 2026

## Statut
- Branche créée depuis `main` (et non `dev`, 46 commits en avance), afin de préserver le frontend et le design les plus récents.
- 32 migrations SQL historiques restaurées sous `supabase/migrations/`, avec README et guide Flutter.
- 20 fichiers sources Supabase anciens conservés sous `docs/legacy-supabase-source/` avec extension `.txt`, afin de préserver le code d'authentification, d'administration, de stockage et les types sans provoquer d'échec TypeScript/Next.js.
- **Le basculement de Laravel vers Supabase n'est PAS encore implémenté** : ne pas déployer la branche sur la production.
- Aucune migration SQL exécutée et aucun changement de données, d'authentification ou de production.

## Sources de référence
- Suppression Supabase du 28/09/2026 : historique Git, notamment commits `68ce2b3`, `7dc68c6`, `a862694`, `51b3151`.
- Base historique Supabase : projet `wgsvzhhzsmioihjwcwcs` (ESS).
- Projet visité et connecté : Supabase `wgsvzhhzsmioihjwcwcs`; les tables de catalogue consultées sont actuellement vides.
- En production, le frontend fait appel à `lib/api/server.ts`, `lib/api/client.ts` et à l'API Laravel; l'authentification utilise ses propres routes Next `app/api/auth/*` et un cookie Laravel.

## Travaux nécessaires avant basculement
1. Établir le contrat de données commun et confronter les modèles actuels `types/api.ts` aux tables Supabase et aux anciens `types/database.ts` : books, book_formats, authors, categories, users, orders, library, ratings, favorites, promotions et taxation.
2. Mettre les adaptateurs Supabase modernes en place sans modifier les composants visuels `app/home`, `app/librairie`, `app/books`, `app/book/[id]`, les pages de connexion, les dashboards auteur/lecteur et les pages admin.
3. Migrer totalement l'authentification, les sessions SSR, la validation d'e-mail et la récupération de mot de passe; ne **jamais** mélanger un cookie Sanctum/Laravel avec les tokens Supabase Auth.
4. Rebrancher les lectures et écritures du catalogue, fichiers EPUB/PDF, couvertures, bibliothèque, achats, abonnements, administration, avis, paiements et droits d'auteur.
5. Créer des migrations nouvelles et idempotentes pour les nouveautés Laravel du 29 septembre au 12 octobre, après audit du schéma existant. Ne jamais relancer la pile historique des migrations sans vérification.
6. Vérifier et corriger les RLS, politiques Storage, privilèges RPC et fonctions SECURITY DEFINER; contrôle de permissions obligatoire avant toute ouverture du catalogue.
7. Ajouter les dépendances npm `@supabase/supabase-js` et `@supabase/ssr` avec mise à jour du lockfile et variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; les clés secrètes restent exclusivement côté serveur.
8. Tester `npm ci`, `npm run lint`, `npm test`, `npm run build`, connexion lecteur/auteur/admin, upload, achat test, lecture 10 pages visiteur, droits d'accès et compatibilité Vercel.
9. Déployer d'abord en preview et comparer visuellement la version `main`; n'ouvrir une PR vers `main` qu'après recette et approbation.

## Sécurité actuelle Supabase
Audit de sécurité consulté le 13/10/2026 : avertissements sur des RPC `SECURITY DEFINER` exécutables par `anon`, des fonctions au `search_path` mutable, et la table `book_authors` avec RLS mais sans policy. Analyse avant corrections. Avis : https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

## Diagnostic SQL en lecture seule (à exécuter si besoin)
```sql
select table_name from information_schema.tables where table_schema='public' order by table_name;
select table_name, column_name, data_type from information_schema.columns where table_schema='public' order by table_name, ordinal_position;
select schemaname, tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname='public' order by tablename, policyname;
select id, name, public from storage.buckets order by id;
select 'books' as entity, count(*) as total from public.books
union all select 'profiles', count(*) from public.profiles
union all select 'orders', count(*) from public.orders;
```

**Important** : La branche conserve le design mais ne dispose pas encore d'un front fonctionnel relié à Supabase. Ne pas fusionner telle quelle dans `main`.
