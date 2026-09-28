# HolisticBooks

HolisticBooks est une plateforme éditoriale composée d’un frontend Next.js et d’un backend Laravel indépendant.

## Architecture

```text
holistique-books.com
        |
        v
Next.js / Vercel
        |
        | HTTPS JSON
        v
api.aba.cd/api/v1
Laravel / PHP / cPanel
        |
        +-- MySQL / MariaDB
        +-- Laravel Sanctum
        +-- stockage privé des livres
        +-- Filament /admin
```

Le frontend web et les futures applications mobiles consomment la même API Laravel.

## Stack frontend

- Next.js App Router
- React
- Tailwind CSS
- TypeScript
- EPUB.js
- PDF.js

## Stack backend

- Laravel
- PHP 8.2+
- MySQL / MariaDB
- Laravel Sanctum
- Filament
- stockage Laravel public + privé

## Authentification

Laravel est l’autorité d’authentification.

Le frontend Next.js appelle :

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Le token Sanctum est conservé côté Next.js dans un cookie HTTP-only `hb_session`.

Les rôles applicatifs sont :

- `reader`
- `author`
- `admin`

## Catalogue et lecture

Les livres sont servis par `/api/v1/books`.

Les fichiers complets PDF / EPUB sont stockés dans le stockage privé Laravel et ne sont jamais exposés directement depuis `public/`.

Le lecteur passe par :

```text
GET /api/read/{bookId}
        |
        v
GET /api/v1/books/{book}/access
        |
        v
GET /api/v1/read/{book}
```

Laravel vérifie les droits liés aux achats, abonnements et accès gratuits avant de servir le fichier.

## Espaces utilisateurs

### Lecteur

- bibliothèque
- favoris
- commandes
- abonnements
- progression de lecture
- surlignages
- affiliations

### Auteur

- tableau de bord
- profil professionnel
- ajout et modification de livres
- PDF / EPUB privés
- ventes
- suivi éditorial et droits

### Administration

Le back-office est fourni par Filament :

```text
https://api.aba.cd/admin
```

Modules principaux :

- Livres
- Catégories
- Auteurs
- Utilisateurs
- Commandes
- Plans d’abonnement
- Abonnements

## Paiements

Les achats EasyPay sont orchestrés côté Laravel.

Le frontend utilise les routes Next.js comme passerelle :

- `POST /api/payments/easypay/init`
- `POST /api/payments/easypay/notify`

Laravel conserve les commandes et les tentatives de paiement dans MySQL puis vérifie le statut auprès du fournisseur avant de donner un accès numérique.

Les dons utilisent également EasyPay, mais restent séparés du catalogue marchand.

## Formation éditoriale

Les formulaires de formation sont enregistrés via :

```text
POST /api/v1/editorial-training
```

Le frontend peut préremplir les informations depuis le profil Laravel de l’utilisateur connecté.

## Développement local

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

Backend local :

```text
http://127.0.0.1:8000
```

Administration :

```text
http://127.0.0.1:8000/admin
```

### 2. Frontend

Dans un second terminal :

```bash
npm install
npm run dev
```

Frontend local :

```text
http://localhost:3000
```

## Variables frontend

Exemple :

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
API_URL=http://127.0.0.1:8000
```

En production :

```env
NEXT_PUBLIC_APP_URL=https://holistique-books.com
APP_BASE_URL=https://holistique-books.com
NEXT_PUBLIC_API_URL=https://api.aba.cd
API_URL=https://api.aba.cd
```

## Variables backend

Configurer notamment :

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=holisticbooks
DB_USERNAME=root
DB_PASSWORD=

EASYPAY_BASE_URL=https://www.e-com-easypay.com
EASYPAY_MODE=sandbox
EASYPAY_CORRELATION_ID=
EASYPAY_PUBLISHABLE_KEY=
```

Les secrets doivent rester dans les variables d’environnement du serveur et ne doivent jamais être commités.

## Vérifications

Frontend :

```bash
npm run lint
npm run test
npm run build
```

Backend :

```bash
cd backend
php artisan optimize:clear
php artisan route:list
php artisan test
```

## Production

- frontend : Vercel sur `holistique-books.com`
- backend/API : cPanel sur `api.aba.cd`
- base de données : MySQL / MariaDB
- administration : `api.aba.cd/admin`
- fichiers numériques : stockage privé Laravel, puis stockage objet compatible S3 lorsque le volume le justifiera
