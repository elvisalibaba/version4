# Guide Flutter Mobile + Supabase partage

## Objectif

Le projet Flutter doit partager exactement le meme backend Supabase que le web:

- meme projet Supabase
- meme `auth.users`
- meme table `profiles`
- meme table `author_profiles`
- meme bucket `books`
- memes tables de lecture, favoris, affiliation, abonnement, commandes et moderation

Le mobile ne doit pas recreer une logique parallele. Il doit consommer les memes donnees et respecter les memes regles metier.

## Ce que Flutter doit partager tel quel

Le mobile peut partager directement:

- `auth.users`
- `public.profiles`
- `public.author_profiles`
- `public.books`
- `public.book_formats`
- `public.library`
- `public.user_subscriptions`
- `public.subscription_plans`
- `public.subscription_plan_books`
- `public.book_favorites`
- `public.highlights`
- `public.reader_affiliate_profiles`
- `public.affiliate_wallet_transactions`
- `public.affiliate_order_transactions`
- `public.orders`
- `public.order_items`

Le mobile doit aussi utiliser le meme bucket Storage:

- bucket `books`

## Initialisation Flutter

Le dev Flutter doit initialiser `supabase_flutter` avec les memes variables que le web:

```dart
await Supabase.initialize(
  url: const String.fromEnvironment('SUPABASE_URL'),
  anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
);
```

En pratique:

- `SUPABASE_URL` = meme valeur que `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` = meme valeur que `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Authentification et profils

Le web cree les comptes avec des metadonnees precises. Le mobile doit envoyer les memes cles, sinon les profils et l affiliation seront incomplets.

Les cles importantes au signup:

- `name`
- `role`
- `first_name`
- `last_name`
- `phone`
- `country`
- `city`
- `preferred_language`
- `favorite_categories`
- `marketing_opt_in`
- `referred_by_affiliate_code`
- `affiliate_source_type`
- `affiliate_source_book_id`
- `affiliate_source_plan_id`
- `author_profile`

Valeurs de `role`:

- `reader`
- `author`

Le role `admin` ne doit pas etre donne par l app mobile au signup.

Exemple Flutter pour un lecteur:

```dart
await supabase.auth.signUp(
  email: email,
  password: password,
  data: {
    'name': '$firstName $lastName'.trim(),
    'role': 'reader',
    'first_name': firstName,
    'last_name': lastName,
    'phone': phone,
    'country': country,
    'city': city,
    'preferred_language': preferredLanguage,
    'favorite_categories': favoriteCategories,
    'marketing_opt_in': marketingOptIn,
    'referred_by_affiliate_code': affiliateCode,
    'affiliate_source_type': affiliateSourceType,
    'affiliate_source_book_id': affiliateBookId,
    'affiliate_source_plan_id': affiliatePlanId,
  },
);
```

Exemple Flutter pour un auteur:

```dart
await supabase.auth.signUp(
  email: email,
  password: password,
  data: {
    'name': '$firstName $lastName'.trim(),
    'role': 'author',
    'first_name': firstName,
    'last_name': lastName,
    'preferred_language': preferredLanguage,
    'author_profile': {
      'display_name': displayName,
      'professional_headline': professionalHeadline,
      'bio': bio,
      'website': website,
      'location': location,
      'genres': genres,
      'publishing_goals': publishingGoals,
      'social_links': socialLinks,
    },
  },
);
```

Important:

- `profiles` est la base du compte
- `author_profiles` est le profil studio auteur
- un auteur peut publier plusieurs livres sous des noms differents grace a `books.author_display_name`
- il ne faut pas obliger le mobile a reutiliser le nom du compte comme nom affiche du livre

## Liens d affiliation et inscription

Le systeme d affiliation fonctionne deja avec des parametres d URL.

Parametres importants:

- `role`
- `ref`
- `source`
- `bookId`
- `planId`

Exemple logique:

- lien lecteur generique: `.../register?role=reader&ref=CODE`
- lien lecteur depuis un livre: `.../register?role=reader&ref=CODE&source=book&bookId=...`
- lien lecteur depuis un abonnement: `.../register?role=reader&ref=CODE&source=plan&planId=...`

Le mobile doit conserver ces informations jusqu au signup, puis les envoyer dans les metadonnees utilisateur.

## Catalogue lecteur

Pour le catalogue public, Flutter doit lire les livres publies et non bloques:

- `books.status = 'published'`
- `books.copyright_status != 'blocked'`

Il faut aussi recuperer:

- `author_display_name`
- `book_formats`
- `price`
- `currency_code`
- `is_single_sale_enabled`
- `is_subscription_available`

Formats pris en charge actuellement:

- `holistique_store`
- `ebook`
- `paperback`
- `pocket`
- `hardcover`
- `audiobook`

Regle importante:

- `author_display_name` est le nom affiche sur ce livre
- ce n est pas forcement le nom global du compte auteur

## Reader mobile: favoris

Les favoris utilisent directement `public.book_favorites`.

Regles:

- cle primaire: `(user_id, book_id)`
- un lecteur ne voit et ne modifie que ses favoris
- le mobile peut faire `insert` et `delete` directement via Supabase

Exemples:

```dart
await supabase.from('book_favorites').insert({
  'user_id': userId,
  'book_id': bookId,
});
```

```dart
await supabase
    .from('book_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId);
```

## Reader mobile: bibliotheque et droits d acces

Le mobile doit raisonner comme le web:

- acces par achat si `library.access_type = 'purchase'`
- acces gratuit si `library.access_type = 'free'`
- acces abonnement si `library.access_type = 'subscription'` et abonnement actif
- acces abonnement actif si `user_subscriptions.status = 'active'` et `expires_at` non depasse

Le web s appuie aussi sur la fonction SQL:

- `public.user_has_access_to_book(p_user_id, p_book_id)`

Cette fonction prend deja en compte:

- achat
- gratuit
- abonnement actif
- blocage copyright
- formats numeriques `holistique_store` et `ebook` pour le gratuit

Recommendation mobile:

- utiliser la meme logique pour afficher `Lire`, `Acheter`, `S abonner`, `Abonnement expire`
- ne jamais marquer un livre comme lisible si `copyright_status = 'blocked'`

## Reader mobile: lecture EPUB et PDF

### Ce qui doit etre partage avec le web

La lecture mobile doit partager:

- le meme controle d acces
- les memes fichiers dans Storage
- la meme table `highlights`
- la meme table `library`
- les memes evenements de lecture si vous voulez garder les stats coherentes

### Ce que le lecteur mobile doit faire

Pour une experience pro, le lecteur Flutter doit gerer:

- progression de lecture
- table des matieres EPUB
- changement taille de police
- interligne
- theme clair / sepia / sombre si besoin
- surlignage
- note
- reprise a la derniere position
- navigation par page pour PDF
- rendu type livre pour PDF si vous faites un mode double page

### Highlights et notes

Les surlignages et notes sont stockes dans `public.highlights`.

Champs utiles:

- `user_id`
- `book_id`
- `page`
- `text`
- `note`
- `color`
- `created_at`
- `updated_at`

Le mobile peut inserer, lire, modifier et supprimer ses propres highlights si la migration `0025_reader_highlights_self_access.sql` est appliquee.

Exemple simple:

```dart
await supabase.from('highlights').insert({
  'user_id': userId,
  'book_id': bookId,
  'page': pageNumber,
  'text': selectedText,
  'note': note,
  'color': 'yellow',
});
```

### Point critique sur la lecture securisee

Aujourd hui, les routes Next suivantes reposent sur la session web par cookies:

- `GET /api/read/[bookId]`
- `GET /api/read/[bookId]/file`

Elles utilisent le client serveur Next avec `cookies()` et pas un bearer token mobile.

Conclusion importante:

- Flutter ne peut pas reutiliser ces routes telles quelles en natif
- pour le mobile, il faut ajouter une authentification `Authorization: Bearer <supabase_access_token>` sur ces routes
- ou creer des routes mobiles dediees

Je recommande de garder la logique de lecture securisee cote backend, puis d adapter les routes pour accepter le JWT Supabase du mobile.

Pourquoi:

- on garde la meme verification de droits
- on garde le blocage copyright
- on garde le tracking lecture
- on evite de disperser la logique metier dans Flutter

### Ce que Flutter ne doit pas faire

Flutter ne doit pas:

- deviner seul si un lecteur a acces
- bypasser les verifications copyright
- multiplier les regles de lecture dans le code mobile

## Reader mobile: affiliation 2%

Le systeme d affiliation lecteur est deja en place.

Regle metier:

- 2% de commission par defaut
- credit sur achat de livre
- credit sur abonnement

Tables principales:

- `reader_affiliate_profiles`
- `affiliate_wallet_transactions`
- `affiliate_order_transactions`

Le portefeuille lecteur contient:

- `affiliate_code`
- `commission_rate`
- `wallet_balance`
- `lifetime_credited`
- `currency_code`
- `is_active`

### Comment le credit est calcule

Le mobile ne doit jamais calculer lui-meme la commission.

Le credit est fait cote base / backend:

- abonnement: via `affiliate_wallet_transactions`
- achat livre: via `affiliate_order_transactions`

Pour l achat livre, la commission est creee par le trigger SQL `credit_affiliate_paid_order_commission()`.

### Ce que Flutter doit afficher

Le dashboard mobile lecteur doit lire:

- `reader_affiliate_profiles` pour le solde
- `affiliate_wallet_transactions` pour les credits abonnement
- `affiliate_order_transactions` pour les credits achat livre

Le timeline mobile doit fusionner ces deux sources pour avoir un historique unique.

### Ce que Flutter doit conserver pendant l onboarding

Si un utilisateur arrive par un lien d affiliation, le mobile doit garder:

- `ref`
- `source`
- `bookId`
- `planId`

Puis envoyer ces informations au moment du signup.

## Flutter auteur: publication et soumission

Le mobile auteur peut partager les memes tables et le meme bucket que le web.

Tables a utiliser:

- `books`
- `book_formats`
- `subscription_plan_books`
- `author_profiles`

Bucket a utiliser:

- `books`

Logique actuelle cote auteur:

- un livre est cree en `status = 'draft'`
- la revue est geree par `review_status`
- soumission admin possible via `review_status = 'submitted'`
- publication finale admin ensuite

Statuts de revue a respecter:

- `draft`
- `submitted`
- `approved`
- `rejected`
- `changes_requested`

Formats a gerer cote auteur:

- `ebook`
- `holistique_store`
- `paperback`
- `pocket`
- `hardcover`
- `audiobook`

Points metier importants:

- `author_display_name` appartient au livre
- un compte auteur peut publier sous plusieurs noms affiches
- les formats papier deja publies ne doivent pas etre retires librement par l auteur
- l admin garde la main sur la validation finale

## Flutter admin: revue, correction et blocage copyright

Si vous faites aussi une app admin Flutter, elle doit respecter les memes statuts.

Champs importants dans `books`:

- `review_status`
- `review_note`
- `reviewed_at`
- `reviewed_by`
- `copyright_status`
- `copyright_note`
- `copyright_blocked_at`
- `copyright_blocked_by`

Statuts copyright:

- `clear`
- `review`
- `blocked`

Regles:

- un livre `blocked` ne doit pas etre achetable
- un livre `blocked` ne doit pas etre lisible
- un livre `blocked` ne doit pas etre expose comme titre public normal
- l admin doit pouvoir corriger les champs du livre avant validation

## Paiement mobile

Le paiement EasyPay est aujourd hui lance via:

- `POST /api/payments/easypay/init`

Comme pour la lecture securisee, cette route utilise aujourd hui la session web serveur.

Donc pour Flutter natif:

- soit vous adaptez cette route pour accepter `Authorization: Bearer <supabase_access_token>`
- soit vous ajoutez une route mobile dediee

Le mobile ne doit pas creer lui-meme la logique de commande de maniere divergente. Il faut garder:

- `orders`
- `order_items`
- `payment_status`
- verification copyright
- verification disponibilite format
- credit affiliation apres paiement

## Ce que Flutter peut faire directement avec Supabase

Le mobile peut faire directement via `supabase_flutter`:

- auth
- lecture de `profiles`
- lecture de `author_profiles`
- lecture catalogue public
- gestion favoris
- gestion highlights
- lecture bibliotheque
- lecture portefeuille affiliation
- CRUD auteur sur ses propres livres si vous respectez les policies

## Ce qui doit rester derriere le backend

Je recommande de garder derriere le backend:

- demarrage lecture securisee
- recuperation fichier protege
- paiement
- verification finale d acces complexe
- tracking lecture centralise si vous voulez des stats coherentes

## Migrations a avoir sur la base partagee

Pour que le mobile retrouve bien tout ce qui existe deja sur le web, la base partagee doit contenir au minimum:

- `0023_reader_affiliate_wallets.sql`
- `0024_reader_favorites_and_order_affiliate_commissions.sql`
- `0025_reader_highlights_self_access.sql`
- `0026_book_author_names_and_extended_formats.sql`
- `0027_admin_copyright_controls.sql`

## Checklist simple pour le dev Flutter

1. Brancher Flutter sur le meme projet Supabase.
2. Reprendre les memes cles metadata au signup.
3. Utiliser `books.author_display_name` pour le nom affiche du livre.
4. Utiliser `book_favorites` pour les favoris.
5. Utiliser `highlights` pour notes et surlignages.
6. Utiliser `reader_affiliate_profiles`, `affiliate_wallet_transactions` et `affiliate_order_transactions` pour l affiliation.
7. Respecter `review_status` et `copyright_status`.
8. Ne pas bypasser les routes securisees de lecture et paiement.
9. Ajouter une version mobile JWT des routes `/api/read/...` et `/api/payments/easypay/init`.

## Recommandation finale

Le plus propre est:

- Supabase partage pour toutes les donnees
- RLS partagee pour les droits
- Flutter pour l interface mobile
- Next API pour les actions sensibles
- ajout d une authentification JWT mobile sur les routes sensibles

Comme ca, web et mobile restent coherents, sans doubler la logique metier.
