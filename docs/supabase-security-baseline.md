# Base de sécurité Supabase — état réel au 14/10/2026

> Projet `wgsvzhhzsmioihjwcwcs` (ESS), PostgreSQL 17.6. Relevé en **lecture seule** le 14/10/2026 à 10 h 45 UTC :
> - `supabase db dump --linked` (schéma seul, sans données) → `supabase/migrations/20261014_0900_baseline_schema.sql` ;
> - `supabase/diagnostics/20261014_phase0_readonly_diagnostic.sql` → `supabase/diagnostics/out/` (exclu de git) ;
> - comptages exacts `count(*)` et simulations `SET ROLE anon` dans des transactions `READ ONLY`, sans aucune écriture.

## 1. Écarts, du plus grave au moins grave

| # | Gravité | Écart | Preuve | Correction |
|---|---|---|---|---|
| 1 | **Critique — exploitable aujourd'hui** | **L'Edge Function `holistic-reader-page` sert le contenu de tous les livres payants.** Elle est déployée avec `verify_jwt: false` et lit le fichier avec la clé service role. Seul contrôle : être connecté au-delà de la page 10. Un compte gratuit lit donc **tout livre publié**, et un visiteur anonyme ses 10 premières pages. | `supabase functions list` ; `supabase/functions/holistic-reader-page/index.ts`, lignes 63 à 77 : aucun appel à un contrôle d'accès | Hors base de données. **Action urgente**, à valider : la supprimer, ou la redéployer avec un contrôle `user_has_access_to_book` (voir le compte rendu). |
| 2 | **Critique — non exploité (0 ligne)** | **Un lecteur peut s'attribuer un abonnement actif.** Les policies `Readers can insert own subscriptions` et `Readers can update own subscriptions` (rôle `{public}`) acceptent `status='active'` sans `expires_at`. Conséquences : (a) accès gratuit aux 14 livres de l'offre via `user_has_access_to_book` et `has_book_access` ; (b) **fraude à l'affiliation** : le trigger `credit_affiliate_subscription_commission` crédite le portefeuille du parrain à chaque nouvelle ligne. Un second compte parrainé par le premier peut créer N abonnements, soit N commissions retirables. | Section 06, policies `user_subscriptions` ; GRANT `INSERT,UPDATE` à `authenticated` ; définitions des deux triggers | Phase 1 § A |
| 3 | **Élevée** | **`file_url` exposé à `anon`** (constat du propriétaire, confirmé) : 26 livres sur 26 visibles et 27 formats sur 27 renvoient leur chemin Storage. Les fichiers ne sont **pas** téléchargeables directement : `anon` voit 0 objet `files/`, et un lecteur connecté ne voit que ses propres objets. Mais la policy Storage `Public can read published book covers` rend public **tout objet** dont le nom égale le `cover_url` d'un livre publié, même sous `files/`. Un auteur peut donc mettre en couverture d'un brouillon le chemin du PDF d'un autre auteur. Si l'admin approuve sans voir, le PDF devient public. Aucun garde-fou de chemin n'existe (1 couverture est déjà hors du dossier de son auteur). | Simulation `SET ROLE anon` ; section 06 storage | Phase 1 § B (colonnes masquées) et § F (policy couvertures limitée à `covers/` + garde de chemin) |
| 4 | **Élevée (données personnelles)** | **`author_profiles` expose à `anon`** les colonnes `phone`, `rights_notes`, `rights_status` et `reference_source_url` des 9 auteurs (policies `authors_public_read` et `Anyone can view author profiles`, `USING (true)`, toutes colonnes). | Liste des colonnes ; GRANT `SELECT` à `anon` | Phase 1 § B |
| 5 | **Élevée (défense en profondeur)** | **Privilèges massifs.** `anon` a **tous** les droits, `TRUNCATE` compris, sur 35 tables ; `authenticated` les a sur 33. Les privilèges par défaut du schéma `public` (rôle `postgres`) accordent `arwdDxtm` à `anon` et `authenticated` sur **toute nouvelle table**, et `EXECUTE` sur toute nouvelle fonction. Seul le RLS protège : une table créée sans RLS serait immédiatement lisible et modifiable par tous. `TRUNCATE` contourne le RLS (non exposé par PostgREST). | Sections 07 et 09 | Phase 1 § C |
| 6 | **Moyenne** | **`book_assets`** : la policy `mobile published assets read` (rôle `{public}`) donne à tous toute ligne `is_published`, y compris `asset_type='full_book'`. La table est vide (0 ligne), le risque est donc latent. | Section 06 | Phase 1 § D |
| 7 | **Moyenne** | **Tout compte connecté peut créer un livre.** `Authors can create books` et `books_author_insert` ne vérifient pas `profiles.role`. | Section 06 | Phase 1 § E |
| 8 | **Moyenne** | **`user_has_access_to_book(p_user_id, p_book_id)`** est exécutable par `anon` avec n'importe quel `p_user_id`, ce qui permet de savoir qui possède quel livre. Elle ignore `library.status` et `library.expires_at` (contrairement à `BookAccessService::canRead` et à `has_book_access`). Les deux fonctions d'accès divergent. | Définitions (section 14) | Phase 1 § G |
| 9 | **Moyenne** | **Engagement non maîtrisé** (8 892 lignes) : insertion directe par `anon` (`mobile engagement insert`), aucune déduplication, `metadata` sans limite, livres non publiés acceptés, ce qui gonfle `views_count`. | Section 06 ; `track_book_engagement` | Phase 1 § H |
| 10 | **Moyenne** | **Journal d'audit modifiable** : `platform_audit_events` a `hb_admin_all` (ALL), donc un admin peut modifier ou effacer l'historique. | Section 06 | Phase 1 § I |
| 11 | **Moyenne** | **Storage** : `Authors can update own objects` n'impose aucun chemin, ce qui permet de renommer un objet vers n'importe quel dossier ; `Owners can read own book objects` permet la lecture directe de `files/` par son propriétaire ; aucune policy de suppression pour le propriétaire. | Section 06 storage | Phase 1 § F |
| 12 | **Faible** | **Avis** : aucune vérification de livre publié ni des co-auteurs (`book_authors`) ; les avis des livres non publics sont lisibles par `anon`. | Section 06 ; `ReviewController.php` | Phase 1 § J |
| 13 | **Faible** | **29 fonctions avec `search_path=public`** (dont 21 `SECURITY DEFINER`), et `EXECUTE` accordé à `anon` sur les fonctions trigger et sur `ensure_reader_affiliate_profile`, `generate_reader_affiliate_code`, `safe_uuid`, `normalize_affiliate_source_type`, `admin_import_published_book` et `prepare_admin_book_import_item`. Les `refresh_book_*` sont déjà révoquées. | Section 10 | Phase 1 § K |
| 14 | **Faible** | Visibilité incohérente : `coming_soon` est visible sans contrôle `copyright_status='clear'`. `book_categories` est lisible sans condition, et `book_academic_taxonomy` teste `<> 'blocked'`. Aucun livre `coming_soon` aujourd'hui. | Section 06 | Phase 1 § L |
| 15 | **Faible** | `guard_profile_sensitive_fields` ne protège pas `staff_role` ni `staff_permissions`. C'est déjà compensé : les droits `UPDATE` de colonne sur `profiles` se limitent à 10 champs sûrs. | Section 08 | Phase 1 § M |
| 16 | Info | **Doublons de policies** (rôle `{public}` hérité et `authenticated` récent) : jusqu'à 7 policies sur `highlights` et 6 sur `book_favorites`. Sans faille identifiée, mais difficile à auditer. | Section 06 | Nettoyage dans une migration séparée |
| 17 | Info | `hb_book_workflow_guard()` existe mais **n'est attachée à aucun trigger**. Le verrou des livres publiés vient en réalité de `enforce_author_book_submission_workflow` : toute modification d'un livre non brouillon par son auteur échoue. | Section 12 | À trancher (Phase 1 § 3 du cahier) |
| 18 | Info | `author_profiles` : 1 profil non référencé sans `profiles` correspondant ; `is_reference_profile` vaut `false` partout. | Comptage | Phase 2 (intégrité) |
| 19 | Info | Historique des migrations : 11 versions distantes (`20261013115238` à `20261013163448`) sans fichier local du même nom ; les fichiers `0001` à `0032` n'y figurent pas. | Section 01 | Décision `migration repair` |

### Réponse à la question sur `payment_attempts`, `affiliate_payout_accounts`, `user_devices` et `book_assets`

| Table | Lignes (exact) | Pourquoi `anon` reçoit `[]` | GRANT `anon` inutile ? |
|---|---|---|---|
| `payment_attempts` | 0 | RLS actif, policies seulement `TO authenticated` : `anon` est filtré par le RLS (et la table est vide) | **Oui** : `anon` a tous les droits, `TRUNCATE` compris |
| `affiliate_payout_accounts` | 0 | idem | **Oui**, tous les droits |
| `user_devices` | 0 | idem | **Oui**, tous les droits |
| `book_assets` | 0 | **Table vide.** Deux policies s'appliquent bien à `anon` (`assets_read`, `mobile published assets read`) : une fois remplie, elle exposerait des lignes | **Oui**, tous les droits (et policies à retirer, écart n° 6) |

## 2. Constats utiles pour les phases suivantes

- **Couvertures (Phase 3)** : les 29 `cover_url` sont des chemins relatifs `covers/<uuid>/…`, et **tous existent** dans `storage.objects` (39 objets `covers/`, 38 objets `files/`). L'hypothèse n° 1 (fichiers Laravel absents) est **écartée**. Le problème vient de la signature (URL signées, N+1, cache) ou de `next.config.ts`.
- **Bug A (`is_free`)** : sur 25 livres publiés en vente unitaire, **15 ont un format numérique publié à 0 $**, donc sont réellement gratuits selon la règle de Laravel. 1 livre publié a `is_single_sale_enabled = false` avec un prix de 0 : le code le marque gratuit, Laravel non. **Question** : ces 15 prix à 0 sont-ils voulus ?
- **Commandes** : 8 commandes, 6 `pending` et 2 `failed`, aucune payée. La colonne `orders.status` n'existe pas (seulement `payment_status`). Bibliothèque : 11 accès `free` et 1 `purchase`, tous `active`.
- **Profils** : 2 admins, 4 auteurs, 14 lecteurs. Bucket `books` privé ; bucket `mobile-releases` privé (APK) ; pas de bucket `covers`.

## 3. Tableau par table (réel)

Légende des droits : **tout + TRUNCATE** = `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` ; SIUD = `SELECT, INSERT, UPDATE, DELETE` ; — = aucun droit.
Le RLS est **actif sur les 66 tables**. « en {public} » = policies héritées sans rôle ciblé.

| Table | Lignes | Migration dans le dépôt | RLS | Policies | Droits `anon` | Droits `authenticated` |
|---|---|---|---|---|---|---|
| `academic_taxonomies` | 75 | oui | oui | 2 (0 en {public}) | S | SIUD |
| `ad_assignments` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `ad_campaigns` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `ad_creatives` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `ad_events` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `ad_placements` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `admin_book_import_batches` | 0 | **non** | oui | 1 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `admin_book_import_items` | 19 | **non** | oui | 4 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `affiliate_order_transactions` | 0 | oui | oui | 3 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `affiliate_payout_accounts` | 0 | **non** | oui | 1 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `affiliate_wallet_transactions` | 0 | oui | oui | 3 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `affiliate_withdrawals` | 0 | **non** | oui | 1 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `author_payout_accounts` | 0 | oui | oui | 3 (0 en {public}) | — | SIUD |
| `author_payouts` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `author_profiles` | 9 | oui | oui | 6 (4 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `author_royalty_accounts` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `author_royalty_transactions` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `blog_posts` | 9 | oui | oui | 2 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `book_academic_taxonomy` | 0 | oui | oui | 2 (0 en {public}) | S | D I S |
| `book_assets` | 0 | **non** | oui | 3 (1 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `book_authors` | 26 | **non** | oui | 2 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `book_categories` | 26 | **non** | oui | 1 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `book_distribution_settings` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `book_downloads` | 0 | **non** | oui | 5 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `book_editorial_events` | 7 | oui | oui | 2 (0 en {public}) | — | I S |
| `book_engagement_events` | 8892 | oui | oui | 3 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `book_favorites` | 6 | oui | oui | 6 (5 en {public}) | — | **tout + TRUNCATE** |
| `book_formats` | 38 | oui | oui | 7 (5 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `book_manuscript_versions` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `book_market_prices` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `book_reader_sessions` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `books` | 29 | oui | oui | 7 (4 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `categories` | 5 | **non** | oui | 2 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `editorial_training_requests` | 0 | oui | oui | 2 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `flash_sale_configs` | 1 | oui | oui | 2 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `highlights` | 3 | **non** | oui | 7 (6 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `home_featured_configs` | 1 | oui | oui | 1 (1 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `library` | 12 | oui | oui | 4 (3 en {public}) | R S T | R S T |
| `media_chapters` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `media_editions` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `mobile_app_configs` | 1 | oui | oui | 2 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `mobile_app_trial_grants` | 6 | oui | oui | 2 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `mobile_app_versions` | 0 | **non** | oui | 2 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `offline_reading_licenses` | 0 | **non** | oui | 3 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `order_items` | 2 | oui | oui | 4 (3 en {public}) | R S T | R S T |
| `orders` | 8 | oui | oui | 3 (2 en {public}) | R S T | R S T |
| `payment_attempts` | 0 | **non** | oui | 3 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `platform_audit_events` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `profiles` | 20 | oui | oui | 6 (4 en {public}) | D R S T TRUNC | D R S T TRUNC |
| `promotion_campaigns` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `promotion_events` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `publishing_house_members` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `publishing_houses` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `publishing_imprints` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `publishing_review_cases` | 0 | oui | oui | 2 (0 en {public}) | — | SIUD |
| `push_notification_tokens` | 0 | **non** | oui | 5 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `ratings` | 3 | **non** | oui | 7 (1 en {public}) | S | **tout + TRUNCATE** |
| `reader_affiliate_profiles` | 14 | oui | oui | 3 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `reading_progress` | 7 | **non** | oui | 2 (1 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `reading_sync_queue` | 0 | **non** | oui | 5 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `rights_acquisition_targets` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `rights_contracts` | 0 | oui | oui | 1 (0 en {public}) | — | SIUD |
| `subscription_plan_books` | 14 | oui | oui | 6 (6 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `subscription_plans` | 1 | oui | oui | 2 (2 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `user_devices` | 0 | **non** | oui | 5 (0 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |
| `user_subscriptions` | 0 | oui | oui | 5 (4 en {public}) | **tout + TRUNCATE** | **tout + TRUNCATE** |

Droits de colonne : `authenticated` peut mettre à jour sur `profiles` uniquement `avatar_url, city, country, favorite_categories, first_name, last_name, marketing_opt_in, name, phone, preferred_language`.

## 4. Storage

| Bucket | Public | Objets | Policies `storage.objects` |
|---|---|---|---|
| `books` | non | 1 `avatars/`, 39 `covers/`, 38 `files/` | `Admin full storage books access` ; `Anyone can read author portraits` (`author-avatars/`) ; `Public can read published book covers` (**tout nom égal à un `cover_url`**) ; `Owners can read own book objects` ; `Authors can update own objects` (**sans chemin**) ; insertion `covers/<uid>/`, `files/<uid>/` (rôle `author`) et `author-avatars/<uid>/` |
| `mobile-releases` | non | 0 | admin seulement (lecture, écriture, mise à jour, suppression) |

La policy `Accessible users can read digital format files` **n'existe plus**.

## 5. Fonctions `SECURITY DEFINER` (26)

| Fonction | `search_path` | `EXECUTE` anon / authenticated | Cible Phase 1 |
|---|---|---|---|
| `is_admin`, `owns_book`, `owns_order`, `has_book_access` | `''` | oui / oui | conserver (utilisées par les policies) |
| `is_current_user_admin` | `public` | oui / oui | `''` ; conserver |
| `submit_book_for_review` | `''` | oui / oui | révoquer `anon` |
| `user_has_access_to_book` | `public` | oui / oui | `''` ; révoquer `anon` ; refuser `p_user_id ≠ auth.uid()` |
| `track_book_engagement` | `public` | oui / oui | `''` ; durcir (§ H) |
| `sync_library_access_for_order` | `public` | oui / oui | `''` ; révoquer `anon` (contrôle admin/service interne) |
| `claim_current_user_mobile_app_trial` | `public` | oui / oui | `''` ; révoquer `anon` |
| `ensure_reader_affiliate_profile` | `public` | oui / oui | `''` ; révoquer `anon` et `authenticated` |
| 10 fonctions trigger (`handle_*`, `credit_*`, `prepare_*`, `resolve_*`) | `public` | oui / oui | `''` ; révoquer `anon` et `authenticated` |
| `refresh_book_*_stats` (4), `_sync_library_access_for_order` | `public` | non / non | `''` |
