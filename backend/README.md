# HolisticBooks API

Backend Laravel de HolisticBooks.

## Environnements

- API locale : `http://127.0.0.1:8000`
- Frontend local : `http://localhost:3000`
- API de production cible : `https://api.aba.cd`

## Installation locale

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Configurer MySQL dans `.env` avant d'exécuter les migrations.

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
php artisan test
php artisan route:list
```

## Migration depuis Supabase

La migration reste progressive. Supabase ne doit pas être retiré du frontend tant que chaque module Laravel/MySQL correspondant n'a pas été validé.
