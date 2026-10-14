# Base de sécurité Supabase — état de référence

> Phase 0 — 14/10/2026. Projet `wgsvzhhzsmioihjwcwcs` (ESS).
>
> **Statut : partiel.** Les colonnes « dépôt » sont calculées à partir de `supabase/migrations/`.
> Les colonnes « réel » (⏳) seront remplies avec la sortie de
> `supabase/diagnostics/20261014_phase0_readonly_diagnostic.sql` (sections 03, 06 et 07).
> Ce document sert ensuite de référence pour la migration `security_hardening` (Phase 1).

## Écart connu entre le dépôt et la base

- Le dépôt crée **48 tables** ; la base en compte **66**.
- 14 tables utilisées en production n'ont **aucune migration** : `payment_attempts`, `user_devices`,
  `offline_reading_licenses`, `affiliate_payout_accounts`, `affiliate_withdrawals`, `push_notification_tokens`,
  `reading_progress`, `reading_sync_queue`, `book_assets`, `categories`, `book_categories`, `ratings`, `highlights`,
  `mobile_app_versions`, plus la famille `admin_book_import_*`. Les tables restantes seront identifiées par la section 03.
- Le code lit `ratings` (`from("ratings")`) alors qu'aucune migration ne la crée.
- `supabase/pending/20261013_laravel_catalog_parity_review.sql`, déjà appliqué, est désormais
  `supabase/migrations/20261013_1205_laravel_catalog_parity_review.sql`.
- Les noms de migration `0001_…` à `0032_…` ne suivent pas le format horodaté de la CLI. La section 01
  du diagnostic dira sous quelles versions elles sont enregistrées en base (ou si l'historique est vide).

## Tableau par table

Légende : RLS = `relrowsecurity` ; policies = nombre de `CREATE POLICY` ; grants = privilèges
`information_schema.role_table_grants`.

| Table | Migration dans le dépôt | RLS (dépôt) | Policies (dépôt) | RLS (réel) | Policies (réel) | Grants `anon` (réel) | Grants `authenticated` (réel) |
|---|---|---|---|---|---|---|---|
| `academic_taxonomies` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `ad_assignments` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `ad_campaigns` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `ad_creatives` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `ad_events` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `ad_placements` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `admin_book_import_*` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `affiliate_order_transactions` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `affiliate_payout_accounts` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `affiliate_wallet_transactions` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `affiliate_withdrawals` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `author_payout_accounts` | oui | oui | 3 | ⏳ | ⏳ | ⏳ | ⏳ |
| `author_payouts` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `author_profiles` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `author_royalty_accounts` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `author_royalty_transactions` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `blog_posts` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_academic_taxonomy` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_assets` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_categories` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_distribution_settings` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_editorial_events` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_engagement_events` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_favorites` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_formats` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_manuscript_versions` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_market_prices` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `book_reader_sessions` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `books` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `categories` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `editorial_training_requests` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `flash_sale_configs` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `highlights` | **non** | oui | 4 | ⏳ | ⏳ | ⏳ | ⏳ |
| `home_featured_configs` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `library` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `media_chapters` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `media_editions` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `mobile_app_configs` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `mobile_app_trial_grants` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `mobile_app_versions` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `offline_reading_licenses` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `order_items` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `orders` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `payment_attempts` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `platform_audit_events` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `profiles` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `promotion_campaigns` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `promotion_events` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `publishing_house_members` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `publishing_houses` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `publishing_imprints` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `publishing_review_cases` | oui | oui | 2 | ⏳ | ⏳ | ⏳ | ⏳ |
| `push_notification_tokens` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `ratings` | **non** | oui | 7 | ⏳ | ⏳ | ⏳ | ⏳ |
| `reader_affiliate_profiles` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `reading_progress` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `reading_sync_queue` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `rights_acquisition_targets` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `rights_contracts` | oui | oui | 1 | ⏳ | ⏳ | ⏳ | ⏳ |
| `subscription_plan_books` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `subscription_plans` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `user_devices` | **non** | — | 0 | ⏳ | ⏳ | ⏳ | ⏳ |
| `user_subscriptions` | oui | oui | 0 | ⏳ | ⏳ | ⏳ | ⏳ |

## Storage

| Bucket | Public (réel) | Policies `storage.objects` (réel) | Cible Phase 1 / 3 |
|---|---|---|---|
| `books` | ⏳ | ⏳ | privé ; écriture `files/<uid>/`, `covers/<uid>/`, `author-avatars/<uid>/` + admin ; aucune lecture directe de `files/` |
| `covers` | n'existe pas encore | — | public, créé en Phase 3 |

## Fonctions `SECURITY DEFINER`

À remplir avec les sections 10 et 11 du diagnostic : fonction, `search_path` figé, `EXECUTE` pour `anon` et
`authenticated`. Cibles connues de la Phase 1 : `refresh_book_*_stats`, `ensure_reader_affiliate_profile`,
`generate_reader_affiliate_code`, `safe_uuid`, `normalize_affiliate_source_type` (révoquer `anon` et `authenticated`).
