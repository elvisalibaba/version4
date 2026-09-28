# Fiche technique - Administration HolistiqueBooks

## 1. Architecture

L’administration HolistiqueBooks repose sur le backend Laravel.

```text
Frontend Next.js / Vercel
        |
        v
Laravel API / api.aba.cd
        |
        +-- MySQL / MariaDB
        +-- Laravel Sanctum
        +-- Filament Admin
        +-- stockage public
        +-- stockage privé PDF / EPUB
```

Le panneau d’administration principal est accessible sur :

```text
https://api.aba.cd/admin
```

En local :

```text
http://127.0.0.1:8000/admin
```

## 2. Authentification et autorisation

Laravel gère les comptes et l’authentification.

Rôles :

- reader
- author
- admin

Seuls les utilisateurs ayant le rôle `admin` peuvent accéder au panneau Filament.

Pour créer ou promouvoir un administrateur :

```bash
php artisan holistic:make-admin admin@example.com
```

## 3. Modules administratifs

Le panneau couvre notamment :

- utilisateurs
- auteurs
- livres
- catégories
- commandes
- plans d’abonnement
- abonnements
- statistiques principales

## 4. Catalogue

La gestion des livres inclut :

- titre et sous-titre
- auteur principal
- co-auteurs
- ISBN
- éditeur
- description
- langue
- catégories et tags
- prix et devise
- formats
- statut éditorial
- statut des droits
- couverture
- PDF / EPUB
- disponibilité à la vente
- disponibilité par abonnement

Les fichiers numériques complets sont conservés dans le stockage privé Laravel.

## 5. Paiements

Les commandes sont persistées dans MySQL.

EasyPay est orchestré par Laravel via :

- `POST /api/v1/payments/easypay/init`
- `POST /api/v1/payments/easypay/orders/{order}/reconcile`
- `POST /api/v1/payments/easypay/notify`

La table `payment_attempts` conserve les tentatives, références fournisseur, états et données de vérification.

Un paiement n’accorde un accès numérique qu’après vérification serveur auprès du fournisseur.

## 6. Bibliothèque et droits de lecture

Laravel calcule les droits à partir :

- des achats validés
- des abonnements actifs
- des livres gratuits

Le service `BookAccessService` est l’autorité d’accès.

Les PDF et EPUB sont servis par une route authentifiée et ne sont pas publiés directement dans le dossier web.

## 7. Espaces frontend

Le frontend Next.js fournit :

### Lecteur

- bibliothèque
- favoris
- commandes
- abonnements
- progression
- surlignages
- affiliations

### Auteur

- tableau de bord
- profil
- catalogue auteur
- ajout / modification de livres
- ventes
- suivi éditorial

Les données transitent par l’API Laravel.

## 8. Variables de production

Frontend :

```env
NEXT_PUBLIC_APP_URL=https://holistique-books.com
APP_BASE_URL=https://holistique-books.com
NEXT_PUBLIC_API_URL=https://api.aba.cd
API_URL=https://api.aba.cd
```

Backend :

```env
APP_URL=https://api.aba.cd
FRONTEND_URL=https://holistique-books.com

DB_CONNECTION=mysql
DB_HOST=
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

EASYPAY_BASE_URL=https://www.e-com-easypay.com
EASYPAY_MODE=v1
EASYPAY_CORRELATION_ID=
EASYPAY_PUBLISHABLE_KEY=
```

## 9. Vérifications avant production

Backend :

```bash
php artisan optimize:clear
php artisan migrate --force
php artisan route:list
php artisan test
```

Frontend :

```bash
npm ci
npm run lint
npm run test
npm run build
```

La branche `main` ne doit recevoir la migration qu’après validation complète de `dev`.
