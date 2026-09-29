# HolisticBooks Publishing Backend

Backend Laravel de HolisticBooks : API, Control Center, Author Studio, paiements, royalties et distribution.

## URLs locales

- Portail backend : `http://127.0.0.1:8000`
- Control Center : `http://127.0.0.1:8000/admin`
- Author Studio : `http://127.0.0.1:8000/studio`
- API : `http://127.0.0.1:8000/api/v1`
- Frontend Next.js : `http://localhost:3000`

Production cible :

- API / backend : `https://api.aba.cd`
- Administration : `https://api.aba.cd/admin`
- Studio auteurs : `https://api.aba.cd/studio`

## Installation locale

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Configurer MySQL dans `.env` avant les migrations.

## Filament 5

Le projet utilise deux panels Filament :

### Control Center

Réservé aux profils `admin`.

Fonctions principales :

- pilotage global
- catalogue et auteurs
- validation éditoriale et droits
- commandes et paiements
- abonnements
- contenus et blog
- application mobile
- comptes de versement auteurs
- royalties et demandes de versement

### Author Studio

Accessible aux profils `author` et `admin`.

Fonctions principales :

- livres de l'auteur
- couverture et manuscrit
- soumission éditoriale
- score de préparation à la publication
- marchés et territoires
- distribution web / mobile / librairies / institutions
- impression locale et impression à la demande
- ventes
- royalties
- comptes Mobile Money / banque
- demandes de versement

## Thèmes Filament

Les panels possèdent deux thèmes HolisticBooks :

```text
resources/css/filament/admin/theme.css
resources/css/filament/studio/theme.css
```

Compiler les assets :

```bash
npm install
npm run build
```

Puis :

```bash
php artisan filament:assets
php artisan optimize:clear
```

## Créer un administrateur

```bash
php artisan holistic:make-admin admin@example.com
```

Sans option `--password`, le mot de passe est demandé de manière masquée.

## Royalties auteurs

Les ventes vérifiées par le backend peuvent générer automatiquement une écriture de royalty.

Variables principales :

```env
AUTHOR_DEFAULT_ROYALTY_RATE=0.70
AUTHOR_PAYOUT_DELAY_DAYS=30
AUTHOR_MINIMUM_PAYOUT=10
AUTHOR_DEFAULT_CURRENCY=USD
```

Le taux par défaut est seulement une configuration plateforme. Un taux spécifique peut être défini pour chaque livre dans ses paramètres de distribution.

Cycle :

```text
vente vérifiée
    ↓
royalty pending
    ↓
délai configuré
    ↓
royalty payable
    ↓
solde auteur disponible
    ↓
demande de versement
    ↓
validation équipe
    ↓
Mobile Money / banque
```

## Scheduler Laravel

Les royalties arrivées à échéance sont libérées par :

```bash
php artisan royalties:release-payable
```

En production, configurer le cron Laravel :

```cron
* * * * * cd /chemin/vers/backend && php artisan schedule:run >> /dev/null 2>&1
```

Le scheduler exécute automatiquement `royalties:release-payable` chaque jour.

## Paiements EasyPay

Variables :

```env
EASYPAY_BASE_URL=https://www.e-com-easypay.com
EASYPAY_MODE=sandbox
EASYPAY_CORRELATION_ID=
EASYPAY_PUBLISHABLE_KEY=
```

Routes principales :

- `POST /api/v1/payments/easypay/init`
- `POST /api/v1/payments/easypay/notify`
- `POST /api/v1/payments/easypay/orders/{order}/reconcile`

Un livre numérique n'est accordé au lecteur qu'après vérification serveur du paiement.

## API Author Studio

### Finance

- `GET /api/v1/author/finance/summary`
- `GET /api/v1/author/finance/royalties`
- `GET /api/v1/author/finance/payout-accounts`
- `POST /api/v1/author/finance/payout-accounts`
- `PUT /api/v1/author/finance/payout-accounts/{payoutAccount}`
- `DELETE /api/v1/author/finance/payout-accounts/{payoutAccount}`
- `GET /api/v1/author/finance/payouts`
- `POST /api/v1/author/finance/payouts`

### Distribution

- `GET /api/v1/author/books/{book}/distribution`
- `PUT /api/v1/author/books/{book}/distribution`

## API Reader

- `GET /api/v1/books/{book}/progress`
- `PUT /api/v1/books/{book}/progress`
- `GET /api/v1/books/{book}/highlights`
- `POST /api/v1/books/{book}/highlights`
- `PUT /api/v1/highlights/{highlight}`
- `DELETE /api/v1/highlights/{highlight}`

## Stockage

- couvertures : stockage public
- manuscrits PDF / EPUB : disque privé `books`
- versions mobiles / APK : stockage privé
- coordonnées de versement : identifiant chiffré côté Laravel

Les fichiers numériques complets ne doivent jamais être exposés directement dans `public/`.

## Vérifications locales

```bash
php artisan optimize:clear
php artisan migrate
php artisan route:list
php artisan test
php artisan serve
```

Dans un second terminal, pour les thèmes :

```bash
npm install
npm run build
```

## Architecture active

Laravel, MySQL, Sanctum, Filament, stockage privé et EasyPay constituent le backend de référence de HolisticBooks.

Le frontend Next.js et les futures applications mobiles consomment la même API `/api/v1`.
