# Fiche technique utilisateur admin - HolistiqueBooks

Version analysee le 2026-03-16

## 1. Objet

Cette fiche decrit le back-office administrateur de HolistiqueBooks tel qu'il est implemente dans le projet actuel. Elle sert de reference fonctionnelle et technique pour l'exploitation quotidienne, la moderation, la correction de donnees metier et le pilotage commercial.

## 2. Profil concerne

- Role cible : administrateur de la plateforme
- Mission principale : superviser les utilisateurs, le catalogue, les auteurs, les commandes, les abonnements et les contenus marketing
- Point d'entree principal : `/admin`
- Note de navigation : les anciennes routes `/dashboard/admin/*` redirigent vers `/admin/*`

## 3. Acces et securite

| Element | Comportement actuel |
| --- | --- |
| Authentification | Supabase Auth |
| Autorisation | `profiles.role = 'admin'` |
| Utilisateur non connecte | redirection vers `/login?next=/admin` |
| Utilisateur connecte non admin | redirection vers `/dashboard` |
| Protection applicative | `proxy.ts` protege `/admin/:path*` |
| Controle serveur | `requireAdmin()` sur le layout admin et les actions serveur |
| Protection base de donnees | policies RLS basees sur `public.is_current_user_admin()` |

Tables explicitement protegees pour l'admin dans le projet :

- `profiles`
- `orders`
- `library`
- `ratings`
- `highlights`
- `blog_posts`
- `flash_sale_configs`
- `subscription_plans`
- `subscription_plan_books`
- `user_subscriptions`

## 4. Socle technique

- Frontend : Next.js App Router, React, TailwindCSS
- Backend : Supabase PostgreSQL, Auth et Storage
- Actions metier admin : `app/admin/actions.ts`
- Verification du role admin : `lib/auth/require-admin.ts`
- Dashboard et requetes admin : `lib/supabase/admin/*`

Persistance marketing actuelle :

- Blog : table `blog_posts`
- Flash sale : table `flash_sale_configs`
- Fallback de secours en local/dev : `data/blog-posts.json` et `data/flash-sales.json` si le service role Supabase n'est pas disponible

## 5. Perimetre fonctionnel admin

| Module | Routes principales | Capacites utilisateur admin | Donnees manipulees |
| --- | --- | --- | --- |
| Cockpit admin | `/admin` | Vue d'ensemble des KPI, top livres, top auteurs, derniers inscrits, file de revue | `profiles`, `books`, `orders`, `order_items`, `ratings`, `user_subscriptions` |
| Utilisateurs | `/admin/users`, `/admin/users/[id]` | Rechercher, filtrer, consulter le detail, changer le role, voir bibliotheque, commandes, abonnements et engagement | `profiles`, `author_profiles`, `library`, `orders`, `ratings`, `highlights`, `user_subscriptions`, `book_engagement_events` |
| Auteurs | `/admin/authors`, `/admin/authors/[id]` | Consulter les performances auteur, editer la fiche auteur, suivre le catalogue et les formats | `author_profiles`, `profiles`, `books`, `book_formats`, `subscription_plan_books` |
| Livres | `/admin/books`, `/admin/books/[id]`, `/admin/books/[id]/edit` | Filtrer le catalogue, revoir les soumissions, accepter ou refuser, editer les metadonnees, voir commandes, bibliotheque, notes et highlights | `books`, `book_formats`, `order_items`, `library`, `ratings`, `highlights`, `book_engagement_events` |
| Formats | `/admin/formats`, `/admin/formats/[id]` | Creer un format, ajuster prix, stock, cout d'impression, URL de fichier, publier ou supprimer un format non publie | `book_formats`, `books` |
| Commandes | `/admin/orders`, `/admin/orders/[id]` | Filtrer les commandes, consulter les lignes, modifier le statut de paiement | `orders`, `order_items` |
| Bibliotheque | `/admin/library` | Ajouter ou retirer un acces manuel a un livre, corriger les acces purchase, subscription ou free | `library`, `user_subscriptions`, `books`, `profiles` |
| Plans Premium | `/admin/subscriptions/plans`, `/admin/subscriptions/plans/new`, `/admin/subscriptions/plans/[id]`, `/admin/subscriptions/plans/[id]/edit` | Creer un plan, l'activer, l'editer, ajouter ou retirer des livres, voir les abonnes | `subscription_plans`, `subscription_plan_books`, `user_subscriptions`, `books` |
| Abonnements utilisateurs | `/admin/subscriptions/users` | Creer un abonnement manuel, prolonger, changer le statut, corriger l'expiration | `user_subscriptions`, `subscription_plans`, `profiles` |
| Notes lecteurs | `/admin/ratings` | Analyser la distribution des notes, filtrer, supprimer une note en moderation | `ratings`, `books`, `profiles` |
| Highlights | `/admin/highlights` | Analyser l'engagement de lecture, filtrer, supprimer un highlight problematique | `highlights`, `books`, `profiles` |
| Blog editorial | `/admin/blog` | Creer un article, publier, filtrer, supprimer et revalider les pages publiques | `blog_posts` |
| Flash sale | `/admin/flash-sales` | Regler la remise, selectionner les livres mis en avant, nettoyer la selection, verifier le fallback public | `flash_sale_configs`, `books` |

## 6. Flux metier principaux

### 6.1 Gestion des roles utilisateur

- L'admin consulte un profil via `/admin/users/[id]`
- Il peut changer le role entre `reader`, `author` et `admin`
- Si le role devient `author` ou `admin`, une fiche `author_profiles` est creee ou mise a jour automatiquement

### 6.2 Revue d'une soumission auteur

- L'auteur travaille en `draft` ou soumet en `submitted`
- L'admin ouvre `/admin/books/[id]`
- Trois decisions sont disponibles :
  - `approve`
  - `request_changes`
  - `reject`
- En cas d'acceptation, l'admin peut :
  - publier le livre en `published` ou `coming_soon`
  - publier aussi le format `ebook`
- Une note de revue peut etre enregistree pour retour a l'auteur

### 6.3 Correction manuelle d'acces bibliotheque

- L'admin utilise `/admin/library`
- Il peut ajouter un acces :
  - `purchase`
  - `subscription`
  - `free`
- Il peut aussi retirer un acces en cas d'erreur metier

### 6.4 Pilotage des abonnements

- L'admin cree des plans Premium
- Il rattache des livres a un plan
- Il cree ou corrige des abonnements utilisateurs
- Il ajuste les statuts :
  - `active`
  - `cancelled`
  - `expired`
  - `past_due`

### 6.5 Pilotage marketing

- L'admin publie des articles de blog visibles sur le site public
- L'admin ajuste la `flash sale` de la home
- La remise de flash sale agit sur l'affichage public, pas sur le prix de base stocke dans `books`

## 7. Regles de gestion observees

- Le workflow de soumission auteur est controle en base via triggers et contraintes
- Les auteurs ne peuvent pas publier eux-memes leurs livres ou leurs formats finalises
- La suppression d'un format n'est autorisee que s'il n'est pas publie
- Les formats papier peuvent porter un `printing_cost`
- Les acces bibliotheque supportent trois origines : `purchase`, `subscription`, `free`
- L'acces de lecture a un ebook depend des regles `library`, `user_subscriptions` et de la fonction `user_has_access_to_book(...)`

Statuts utiles a connaitre :

- Statuts livre : `draft`, `published`, `archived`, `coming_soon`
- Statuts de revue : `draft`, `submitted`, `approved`, `rejected`, `changes_requested`
- Statuts commande : `pending`, `paid`, `failed`, `refunded`
- Statuts abonnement : `active`, `cancelled`, `expired`, `past_due`
- Types d'acces bibliotheque : `purchase`, `subscription`, `free`

## 8. Limites fonctionnelles du projet actuel

- Aucun flag de suspension ou de desactivation utilisateur n'existe encore dans le schema actuel
- Le dashboard admin repose sur certaines stats derivees (`views_count`, `purchases_count`, `rating_avg`, `ratings_count`) qui doivent rester synchronisees
- La timeline editoriale d'un livre n'est pas un audit log complet
- Le detail commande rappelle explicitement qu'une synchro automatique `orders -> library` n'est pas documentee comme implicite dans le code admin
- La `flash sale` modifie la presentation commerciale, pas le prix de reference en base
- Le blog et la flash sale sont penses pour Supabase, mais gardent un fallback local pour certains contextes de dev

## 9. Prerequis techniques d'exploitation

Pour que le poste admin fonctionne correctement en environnement cible :

- Les migrations Supabase doivent etre appliquees, notamment :
  - `0010_premium_subscriptions.sql`
  - `0011_admin_rls_completion.sql`
  - `0012_book_submission_review_workflow.sql`
  - `0016_blog_posts.sql`
  - `0017_flash_sale_configs.sql`
- Les variables d'environnement critiques doivent etre presentes :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `APP_BASE_URL`
- Pour les paiements CinetPay :
  - `CINETPAY_API_KEY`
  - `CINETPAY_SITE_ID`
  - `CINETPAY_BASE_URL`
- Pour les notifications email admin :
  - `ADMIN_NOTIFY_EMAIL`
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM` optionnel
- Pour le webhook de nouvelle inscription :
  - `SUPABASE_DB_WEBHOOK_SECRET`

## 10. Notifications et supervision

Le projet prevoit une notification email admin a chaque nouvelle inscription si le webhook Supabase est configure :

- Route : `/api/webhooks/supabase/new-user`
- Evenement attendu : insertion sur `public.profiles`
- Protection : header `x-webhook-secret`
- Destinataire : `ADMIN_NOTIFY_EMAIL` ou `CONTACT_TO`

## 11. Recommandations d'usage

- Traiter en priorite la file des livres en `submitted`
- Verifier la coherence entre statut de paiement et acces bibliotheque apres correction manuelle
- Verifier qu'un livre est marque `is_subscription_available = true` avant son ajout a un plan Premium
- Utiliser les modules `ratings` et `highlights` comme outils de moderation et de lecture des signaux d'usage
- Utiliser `blog` et `flash sale` comme leviers marketing directement relies a la home et au site public

## 12. Fichiers de reference du projet

- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/actions.ts`
- `components/admin/shared/admin-shell.tsx`
- `lib/auth/require-admin.ts`
- `lib/supabase/admin/dashboard.ts`
- `proxy.ts`
- `supabase/migrations/0010_premium_subscriptions.sql`
- `supabase/migrations/0011_admin_rls_completion.sql`
- `supabase/migrations/0012_book_submission_review_workflow.sql`
- `supabase/migrations/0016_blog_posts.sql`
- `supabase/migrations/0017_flash_sale_configs.sql`

## 13. Resume

Le back-office admin HolistiqueBooks est un poste de controle complet centre sur `/admin`. Il couvre la supervision des utilisateurs, la moderation editoriale, la gestion du catalogue, les commandes, les abonnements, la bibliotheque et les leviers marketing. Son autorisation repose sur le role `admin` dans `profiles` et sur des policies RLS dediees cote Supabase.
