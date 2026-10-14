# Inventaire des dépendances à Laravel dans le frontend

> Phase 0 bis — établi le 14/10/2026 sur la branche `feat/supabase-parity-reader` (commit de départ `8421c18`).
> Périmètre : `app/`, `components/`, `lib/`, `proxy.ts`.
> Recherche : `apiServer`, `apiClient`, `@/lib/api/*`, `/api/backend/*`, `API_URL`, `NEXT_PUBLIC_API_URL`,
> `FRONTEND_PROXY_SECRET`, cookie `hb_session`, `isSupabaseMode()`, `HOLISTIC_DATA_SOURCE`.
>
> **Objectif de fin de chantier : toutes les lignes de ce document passent en « ✅ supprimé ».**
> Ensuite on supprime `lib/api/*`, `lib/data-source.ts`, `app/api/backend/[...path]` et les variables
> `API_URL`, `NEXT_PUBLIC_API_URL`, `FRONTEND_PROXY_SECRET`, `HOLISTIC_DATA_SOURCE` de `.env.example`.

## Ce qu'il faut savoir avant de lire le tableau

La production tourne avec `HOLISTIC_DATA_SOURCE=supabase`, et Vercel n'a **ni `API_URL` ni `NEXT_PUBLIC_API_URL`**.
Par conséquent :

- `app/api/backend/[...path]` répond **503** à tout appel en mode Supabase ;
- `apiServer()` se rabat sur `http://127.0.0.1:8000`, ce qui échoue en production.

Tout ce qui n'a pas de branche Supabase est donc **déjà cassé en silence en production**. C'est le cas de l'auteur
(tableau de bord, ventes, finances, versements, distribution, profil, révision), du blog, des auteurs publics,
des catégories, des mises en avant de l'accueil, des ventes flash, des publicités, du suivi d'engagement, de la
progression et des surlignages du lecteur, de l'affiliation lecteur, de l'essai mobile, des médias protégés et
du formulaire de publication auteur. Ces lignes sont marquées **🔴 cassé en prod**.

Légende de l'état actuel en production :
- 🟢 **branche Supabase présente** : il suffit de supprimer la branche Laravel (après vérification) ;
- 🟠 **branche Supabase partielle ou incorrecte** : à réécrire ;
- 🔴 **cassé en prod** : uniquement Laravel, aucun équivalent branché.

## 1. Socle Laravel (à supprimer en dernier)

| Fichier | Dépendance | Remplacement | Phase |
|---|---|---|---|
| `lib/api/client.ts` | `apiClient`, `API_URL`, `NEXT_PUBLIC_API_URL`, `ApiError` | Supprimé. `ApiError` est remplacé par les erreurs Supabase / une petite classe locale si besoin. | fin de Phase 2 |
| `lib/api/server.ts` | `apiServer`, `getServerAuthToken` (cookie `hb_session`) | Supprimé. Session : `lib/supabase/server.ts` (`createClient`). | fin de Phase 2 |
| `lib/api/session.ts` | `AUTH_COOKIE_NAME = "hb_session"` | Supprimé. Cookies gérés par `@supabase/ssr`. | fin de Phase 2 |
| `lib/api/forwarded.ts` | `FRONTEND_PROXY_SECRET`, en-têtes IP pour Laravel | Supprimé. La limitation de débit Supabase lira `x-forwarded-for` directement (Phase 2). | fin de Phase 2 |
| `lib/data-source.ts` | `HOLISTIC_DATA_SOURCE`, `isSupabaseMode()` | Supprimé. | fin de Phase 2 |
| `app/api/backend/[...path]/route.ts` | proxy générique vers Laravel (503 en mode Supabase) | Supprimé, une fois les 9 clients listés en §5 migrés. | fin de Phase 2 |
| `proxy.ts` | 🟠 503 sur `/api/payments/*` ; redirection `/admin` vers Laravel ; garde `/dashboard` sur `hb_session` | Garder seulement `supabaseProxy` (rafraîchissement de session + garde `/dashboard`, `/admin`). Retirer le 503 et la redirection Laravel. | 503 : **Phase 3 bis** ; reste : Phase 2 |

## 2. Authentification

Toutes ces routes ont déjà une branche Supabase (🟢). Il faut seulement supprimer la branche Laravel et vérifier
chaque parcours (connexion, inscription, vérification, mot de passe oublié, déconnexion).

| Fichier | Dépendance | Équivalent Supabase | Phase |
|---|---|---|---|
| `app/api/auth/login/route.ts` | `apiClient`, `hb_session` | 🟢 `supabase.auth.signInWithPassword` | 2 |
| `app/api/auth/logout/route.ts` | `apiClient`, `hb_session` | 🟢 `supabase.auth.signOut` | 2 |
| `app/api/auth/me/route.ts` | `apiClient`, `hb_session` | 🟢 `getSupabaseUser()` | 2 |
| `app/api/auth/register/route.ts` | `apiClient` | 🟢 `supabase.auth.signUp` + trigger `profiles` | 2 |
| `app/api/auth/verify-email/route.ts` | `apiClient`, `hb_session` | 🟢 `verifyOtp` | 2 |
| `app/api/auth/resend-verification/route.ts` | `apiClient` | 🟢 `auth.resend` | 2 |
| `app/api/auth/forgot-password/route.ts` | `apiClient` | 🟢 `resetPasswordForEmail` | 2 |
| `app/api/auth/reset-password/route.ts` | `apiClient` | 🟢 `updateUser({ password })` | 2 |
| `app/actions/auth.ts` | `apiClient`, `hb_session` | 🟢 `auth.signOut` | 2 |
| `app/auth/callback/route.ts` | `isSupabaseMode()` | 🟢 `exchangeCodeForSession` (supprimer seulement le test) | 2 |
| `lib/auth.ts` | `apiServer("auth/me")` | 🟢 `getSupabaseUser()` | 2 |
| `lib/auth/require-admin.ts`, `lib/auth/get-admin-api-session.ts` | indirect via `lib/auth.ts` | 🟢 rôle lu dans `profiles` ; à durcir avec un contrôle en base (Phase 6 admin) | 2 / 6 |

## 3. Catalogue, fiche livre, contenus publics

| Fichier | Dépendance | Équivalent Supabase | Phase |
|---|---|---|---|
| `lib/books.ts` | `apiServer` ×8, `isSupabaseMode()` ×6 | 🟠 `lib/supabase/catalog.ts`. À corriger : `is_free` faux, N+1 de signature des couvertures, `getBookById` renvoie `purchase_formats: []` et `subscription_plans: []` (d'où l'absence de bouton d'achat), ventes flash vides. Fonction partagée `isBookFree()`. | **3 bis** (prix, formats), 3 (couvertures), 2 (ventes flash, accueil) |
| `lib/categories.ts` | `apiServer("categories")` | 🔴 table `categories` (sans migration), lecture publique `is_active` | 1 (RLS) + 2 |
| `lib/home-positioning.ts` | `apiServer("home/featured")` | 🔴 table `home_featured_configs` | 2 |
| `lib/flash-sales.ts` | `apiServer` (ventes flash) | 🔴 table `flash_sale_configs` | 2 |
| `lib/blog.ts` | `apiServer("blog")`, `blog/<slug>` | 🔴 table `blog_posts` (policies existantes à vérifier) | 2 |
| `lib/authors.ts` | `apiServer("authors")`, `authors/<id>` | 🔴 `author_profiles` + `books` publiés (intégrité à rétablir, Phase 1 §13) | 1 + 2 |
| `lib/education.ts` | `apiServer("education/catalog")`, `isSupabaseMode()` | 🟢 `academic_taxonomies` + `book_academic_taxonomy` | 2 |
| `app/book/[id]/page.tsx` | `isSupabaseMode()` ×2 (`supabaseReaderMode` → lecteur ouvert d'office, tout lisible) | Accès via `hb_book_access` ; plus d'ouverture automatique du lecteur | **3 bis** |
| `lib/book-engagement.ts` | `apiServer("books/<id>/engagement")` | 🔴 RPC `track_book_engagement` (à durcir) | 1 + 2 |
| `lib/book-engagement-client.ts` | `fetch("/api/backend/books/<id>/engagement")` | 🔴 même RPC, appelée par le client Supabase ou une route Next | 1 + 2 |
| `components/ads/ad-slot.tsx` | `/api/backend/ads/<placement>`, `/api/backend/ads/<id>/events` | 🔴 tables `ad_placements`, `ad_assignments`, `ad_events` + RPC d'insertion d'événement limitée | 2 |

## 4. Panier, commandes et paiement

| Fichier | Dépendance | Équivalent Supabase | Phase |
|---|---|---|---|
| `app/cart/page.tsx` | `isSupabaseMode()` → prop `supabaseMode` | supprimer la prop | 3 bis |
| `components/cart/cart-view.tsx` | `fetch("/api/backend/orders")` si non Supabase ; `hasDigitalSale` bloque le numérique | `/api/supabase/orders` → RPC `hb_create_order` | **3 bis** |
| `app/api/supabase/orders/route.ts` | garde `isSupabaseMode()` ; refuse les formats numériques | RPC transactionnelle `hb_create_order` | 1 (RPC) + **3 bis** |
| `app/api/payments/cinetpay/init/route.ts` (réexporté par `easypay/init`) | garde `isSupabaseMode()` | `lib/payments/easypay.ts` (renommage), `payment_order_ref`, `payment_attempts` | **3 bis** |
| `app/api/payments/cinetpay/notify/route.ts` (réexporté par `easypay/notify`) | garde `isSupabaseMode()` ; bloqué par le 503 de `proxy.ts` | revérification `checking-status` uniquement | **3 bis** |
| `app/payment/return/page.tsx` | `apiServer("orders/<id>")`, `apiServer("payments/easypay/orders/<id>/reconcile")`, `isSupabaseMode()` | 🟠 `components/payments/supabase-payment-return.tsx` ; correspondance sur `payment_order_ref` | **3 bis** |

## 5. Clients navigateur qui appellent encore `/api/backend/*`

| Fichier | Appel Laravel | Équivalent Supabase | Phase |
|---|---|---|---|
| `components/books/book-reviews.tsx` | `/api/backend/books/<id>/reviews`, `/api/backend/reviews/<id>` (si non Supabase) | 🟢 `/api/supabase/books/<id>/reviews`, `/api/supabase/reviews/<id>` ; supprimer la prop `supabaseMode` | 2 |
| `lib/reviews.ts` (+ `lib/reviews.test.ts`) | `buildReviewsPath` → `/api/backend/books/…` | pointer vers la route Supabase et adapter le test | 2 |
| `components/books/favorite-book-button.tsx` | repli `/api/backend/favorites/<id>` sur 404 | 🟢 `/api/supabase/favorites/<id>` ; supprimer le repli | 2 |
| `components/author/publish-lab-form.tsx` | `POST/PATCH /api/backend/books[/<id>]` | 🔴 insertion `books` sous RLS (rôle auteur exigé, Phase 1 §4) + upload Storage `files/<uid>/`, `covers/<uid>/` ; puis assistant KDP | 1 + 2 (puis 6) |
| `components/reader/reader-popup.tsx` | `/api/backend/books/<id>/progress`, `/highlights`, `/api/backend/highlights/<id>` | 🔴 `reading_progress`, `highlights`, `bookmarks` sous RLS ; le fichier est **supprimé** au profit de `/lire/[bookId]` | 2 + **4** |
| `components/reader/protected-media-player.tsx` | `/api/backend/media-editions/<id>/access` | 🔴 `media_editions` / `media_chapters` + route Next avec contrôle d'accès en base | 2 |

## 6. Lecteur

| Fichier | Dépendance | Équivalent Supabase | Phase |
|---|---|---|---|
| `app/api/read/[bookId]/route.ts` | `apiServer("books/<id>")`, `books/<id>/access` ; en mode Supabase → Edge Function `holistic-reader-page` **sans contrôle d'accès** | `hb_book_access` + session de lecture hachée (`book_reader_sessions`) | 2 + **4** |
| `app/api/read/[bookId]/file/route.ts` | `getApiBaseUrl`, `getServerAuthToken`, `proxyForwardHeaders` ; Edge Function en mode Supabase | `GET /api/read/[bookId]/content` et `/sample` (Range, service role, `server-only`) | **4** |
| `lib/book-access.ts` | `apiServer("books/<id>/access")` | 🔴 RPC `hb_book_access(book_id)` | **2** |

## 7. Espaces lecteur, auteur, admin

| Fichier | Dépendance | Équivalent Supabase | Phase |
|---|---|---|---|
| `lib/reader-api.ts` | `apiServer` ×8, `isSupabaseMode()` ×6 | 🟠 `lib/supabase/reader.ts` (N+1 sur les livres de la bibliothèque, `items: []` sur les commandes, couvertures relatives perdues). `getReaderAffiliate` 🔴 → `reader_affiliate_profiles`, `affiliate_*` | 2 (puis 6) |
| pages `app/dashboard/reader/*` (7 pages + layout) | indirect via `lib/reader-api.ts`, `lib/auth.ts` | suivent `lib/reader-api.ts` | 2 / 6 |
| `lib/author-api.ts` | `apiServer` ×13 ; seules `getAuthorBooks`, `getAuthorProfile`, `getSubscriptionPlans` ont une branche Supabase | 🔴 tableau de bord, ventes, finances, relevé, redevances, comptes de versement, versements, dossiers de révision, distribution → `author_royalty_*`, `author_payout*`, `publishing_review_cases`, `book_distribution_settings` (policies propriétaire, Phase 1 §13) | 1 + 2 (puis 6) |
| pages `app/dashboard/author/*` (10 pages + layout) | indirect via `lib/author-api.ts` | suivent `lib/author-api.ts` | 2 / 6 |
| `app/dashboard/author/add-book/page.tsx`, `app/dashboard/author/books/[bookId]/edit/page.tsx` | `isSupabaseMode()` | supprimer le test ; formulaire branché sur Supabase | 2 |
| `app/dashboard/author/distribution/actions.ts` | `apiServer("author/books/<id>/distribution")` | 🔴 `book_distribution_settings` (RPC auteur) | 2 |
| `app/dashboard/author/finance/actions.ts` | `apiServer("author/finance/payout-accounts")`, `payouts` | 🔴 RPC de demande de versement avec seuil minimum | 2 |
| `app/dashboard/author/profile/actions.ts` | `apiServer("author/profile")` | 🔴 `author_profiles` (mise à jour sous RLS, champs protégés) | 2 |
| `app/dashboard/author/reviews/actions.ts` | `apiServer("author/review-cases/<id>/appeal")` | 🔴 RPC d'appel sur `publishing_review_cases` | 2 |
| `app/admin/layout.tsx`, `app/admin/page.tsx` | `isSupabaseMode()` ; redirige vers `/dashboard/admin` | fusion en un seul `/admin` | 2 (test) / **6** (fusion) |
| `app/api/admin/books/[id]/transition/route.ts` | garde `isSupabaseMode()` | 🟢 RPC `hb_admin_transition_book` | 2 |

## 8. Divers

| Fichier | Dépendance | Équivalent Supabase | Phase |
|---|---|---|---|
| `app/formation-editoriale/actions.ts`, `app/home/actions.ts` | `apiServer("editorial-training")` | 🔴 table `editorial_training_requests` (insertion limitée + débit) | 2 |
| `lib/mobile-app.ts` | `apiServer("mobile")` | 🔴 `mobile_app_configs` / `mobile_app_versions` (`is_published`) | 1 + 2 |
| `app/api/mobile-app/download/route.ts` | `apiServer("mobile/trial/claim")`, `/api/backend/mobile/download` | 🔴 `mobile_app_trial_grants` via RPC | 2 |
| `app/api/supabase/books/route.ts`, `books/[id]/route.ts`, `books/[bookId]/reviews/route.ts`, `favorites/[bookId]/route.ts`, `reviews/[id]/route.ts` | garde `isSupabaseMode()` (404 sinon) | 🟢 retirer la garde | 2 |

## 9. Variables d'environnement liées à Laravel ou en double

| Variable | Où | Décision |
|---|---|---|
| `API_URL`, `NEXT_PUBLIC_API_URL` | `lib/api/client.ts`, `app/api/backend`, `proxy.ts`, `.env.example`, `.env.production` | à supprimer (fin de Phase 2) |
| `FRONTEND_PROXY_SECRET` | `lib/api/forwarded.ts`, `.env.example` | à supprimer |
| `HOLISTIC_DATA_SOURCE` | `lib/data-source.ts`, `.env.example` | à supprimer du code ; à retirer de Vercel ensuite |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | replis dans `lib/supabase/config.ts` et ailleurs | un seul nom : `NEXT_PUBLIC_HOLISTIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Phase 3 bis) |
| `NEXT_PUBLIC_EASYPAY_*`, `EASYPAY_PUBLISHABLE_KEY` | `lib/payments/cinetpay.ts` | replis supprimés (Phase 3 bis) |
| `CINETPAY_*` | `supabase/README.md` ; affichage seul dans `app/dashboard/admin/settings/page.tsx` (aucun paiement ne les lit) | page réglages à basculer sur `EASYPAY_*` (Phase 3 bis) ; à retirer de Vercel |

## Suivi

| Phase | Lignes ouvertes |
|---|---|
| 1 | catégories, mobile, auteurs (intégrité), engagement, `hb_create_order`, publication auteur |
| 2 | auth, contenus publics, avis, favoris, espaces lecteur et auteur, médias, pubs, formation, essai mobile, `hb_book_access`, puis suppression du socle |
| 3 bis | `proxy.ts` (503), fiche livre, panier, commandes, paiement, page de retour |
| 3 | couvertures (`lib/books.ts`, `lib/supabase/catalog.ts`, `lib/supabase/author.ts`) |
| 4 | `app/api/read/*`, `reader-popup.tsx` |
| 6 | fusion admin, refonte des espaces |

Commande de contrôle final (doit ne rien renvoyer d'actif) :

```bash
grep -rn "apiServer\|apiClient\|/api/backend\|API_URL\|FRONTEND_PROXY_SECRET\|isSupabaseMode\|HOLISTIC_DATA_SOURCE\|hb_session" app components lib proxy.ts
```
