# HolisticBooks API & Administration

Backend Laravel de HolisticBooks.

## Environnements

- API locale : `http://127.0.0.1:8000`
- Administration locale : `http://127.0.0.1:8000/admin`
- Frontend local : `http://localhost:3000`
- API de production cible : `https://api.aba.cd`
- Administration de production cible : `https://api.aba.cd/admin`

## Installation locale

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Configurer MySQL dans `.env` avant d'exécuter les migrations.

## Installation du panneau Filament

Le projet utilise Filament 5 pour le back-office.

Après avoir récupéré une branche contenant l'ajout de Filament mais avant que le lock Composer soit régénéré localement :

```bash
composer update filament/filament --with-all-dependencies
php artisan filament:assets
php artisan storage:link
php artisan optimize:clear
```

Le panneau est ensuite disponible sur :

```text
http://127.0.0.1:8000/admin
```

La racine `http://127.0.0.1:8000` redirige automatiquement vers `/admin`.

## Créer le premier administrateur

Seuls les profils avec le rôle `admin` peuvent accéder au panneau.

```bash
php artisan holistic:make-admin admin@example.com
```

La commande crée l'utilisateur si nécessaire ou promeut un utilisateur existant.

Options possibles :

```bash
php artisan holistic:make-admin admin@example.com --name="Administrateur HolisticBooks"
```

Évite de passer le mot de passe dans l'historique du terminal en production : sans `--password`, la commande le demande de manière masquée.

## Modules du back-office

Le panneau d'administration expose actuellement :

- Tableau de bord avec statistiques principales
- Livres
- Catégories
- Auteurs
- Utilisateurs
- Commandes
- Plans d'abonnement
- Abonnements

### Livres

La gestion des livres permet notamment :

- métadonnées éditoriales
- auteur principal
- catégories et tags
- prix et devise
- statut de publication
- disponibilité par abonnement
- couverture publique
- PDF / EPUB en stockage privé
- validation éditoriale
- état des droits / copyright

Les fichiers complets restent sur le disque privé `books`. Ils ne doivent pas être servis depuis `public/`.

## API v1

### Public

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/books`
- `GET /api/v1/books/{book}`
- `GET /api/v1/authors`
- `GET /api/v1/authors/{author}`

### Authentifié avec Sanctum

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/library`
- `GET /api/v1/favorites`
- `POST /api/v1/favorites/{book}`
- `DELETE /api/v1/favorites/{book}`
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `GET /api/v1/subscriptions`
- `GET /api/v1/read/{book}`

### Reader

- `GET /api/v1/books/{book}/progress`
- `PUT /api/v1/books/{book}/progress`
- `GET /api/v1/books/{book}/highlights`
- `POST /api/v1/books/{book}/highlights`
- `PUT /api/v1/highlights/{highlight}`
- `DELETE /api/v1/highlights/{highlight}`

Les endpoints Reader vérifient l'authentification, l'accès actif au livre et la propriété des données utilisateur.

## Vérifications

```bash
php artisan optimize:clear
php artisan migrate
php artisan route:list
php artisan test
```

## Migration depuis Supabase

La migration reste progressive. Supabase ne doit pas être retiré du frontend tant que chaque module Laravel/MySQL correspondant n'a pas été validé.
