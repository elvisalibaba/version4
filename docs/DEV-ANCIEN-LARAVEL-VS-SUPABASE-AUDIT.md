# Audit Laravel → Supabase (13 octobre 2026)

## Architecture examinée
- Frontend Next.js actuel : thème CSS, pages publiques, auteur et lecteur conservés.
- Laravel : API v1, Sanctum, administration Filament, modèles métiers et migrations jusqu'au 7 octobre.
- Supabase historique : 39 tables publiques, profils, auteurs, catalogue, commandes, bibliothèque, Storage `books` privé.

## Écarts confirmés
1. Laravel accepte les livres sans auteur : côté Supabase `books.author_id` est NOT NULL.
2. Laravel introduit `authorship_type`, `author_credit`, `editorial_pole`, `editorial_stage`, `spiritual_metadata`, `bat_status`, etc.; absents sur Supabase.
3. Taxonomie RDC : `academic_taxonomies`, `book_academic_taxonomy` absentes.
4. Workflows : `book_editorial_events` et plusieurs tables d'édition/royalties/maison d'édition/annonces sont absents.
5. Les règles de lecture protégée Laravel sont fondées sur le rendu de pages et des sessions signées; le Storage Supabase privé ne remplace pas un lecteur anti-téléchargement.
6. Les pages d'admin redirigent encore vers Filament; pour le mode Supabase elles nécessitent un backend admin dédié.
7. Les abonnements, commissions et paiement EasyPay ne doivent jamais être validés dans le navigateur.

## Correctif déjà APPLIQUÉ sur la base ESS
Migration SQL `secure_profile_role_against_self_escalation_20261013` :
REVOKE INSERT, UPDATE sur `profiles` pour rôles publics/anon/authenticated, puis GRANT UPDATE sur une liste restreinte de champs non privilégiés.
Vérification effective : `authenticated INSERT=false`, `authenticated UPDATE role=false`, `authenticated UPDATE name=true`, `anon UPDATE=false`.
La création initiale du profil par le trigger `handle_new_user` est à tester en QA.

## Sécurité encore à traiter
- RPC `SECURITY DEFINER` invocables par le rôle `anon`. Audit des signatures et des appelants avant suppression ciblée des EXECUTE.
- RLS `book_authors` sans policy.
- Plusieurs policies permissives historiquement dupliquées, particulièrement `books`, `library`, `orders`.
- Vérifier les policies Storage : bucket `books` privé; seules les couvertures approuvées doivent être accessibles au catalogue public.
- Établir un pipeline de paiements sûr et la signature serveur des fichiers, sans jamais exposer un document complet à un visiteur.

## SQL livré, non exécuté
`supabase/pending/20261013_laravel_catalog_parity_review.sql` :
colonnes de catalogue et trois tables (taxonomies, associations, événements), avec RLS minimales, sans permissions d'écriture client.

## Démarche de validation
1. Export/sauvegarde base ESS, revue du SQL et tests de non-régression Auth/RLS sur copie.
2. Appliquer migration approuvée puis comparer `information_schema.columns`.
3. Implémenter toutes les API sensibles (admin, paiements, lecture) sur Edge Functions ou routes Next sécurisées.
4. Tester scénarios lecteur/auteur/admin et régression de permissions.
5. Exécuter `npm ci && npm run check`, preview Vercel, contrôle de conception; ensuite seulement PR vers `main`.

## Statut
Le mode Supabase est expérimental : `HOLISTIC_DATA_SOURCE=supabase` n'est pas encore prêt pour un déploiement grand public.
Laisser `HOLISTIC_DATA_SOURCE=laravel` dans les environnements de production.
