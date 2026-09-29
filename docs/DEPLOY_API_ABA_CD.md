# Déploiement production — api.aba.cd

HolisticBooks utilise un frontend Next.js séparé et une API Laravel de production.

## Architecture

```text
https://holistique-books.com
        |
        | HTTPS / Bearer token
        v
https://api.aba.cd
        |
        +-- Laravel 13 / PHP 8.3+
        +-- MySQL / MariaDB
        +-- Sanctum
        +-- Filament
        +-- EasyPay
```

## 1. Préparer le sous-domaine dans cPanel

Créer le sous-domaine :

```text
api.aba.cd
```

Le Document Root doit pointer vers le dossier `public` du backend Laravel, par exemple :

```text
/home/CPANEL_USER/version4/backend/public
```

Ne jamais pointer le domaine vers `/backend` directement.

Vérifier que PHP 8.3 ou supérieur est sélectionné pour `api.aba.cd`.

Extensions PHP importantes :

- pdo_mysql
- mbstring
- openssl
- fileinfo
- curl
- intl
- xml
- zip

## 2. Déployer le dépôt

Exemple via SSH :

```bash
cd ~
git clone -b dev https://github.com/elvisalibaba/version4.git
cd version4/backend
```

Pour une mise à jour ultérieure :

```bash
cd ~/version4
git switch dev
git pull origin dev
cd backend
```

Quand la production sera stabilisée, utilisez de préférence une branche/tag de release plutôt que `dev`.

## 3. Variables de production

```bash
cd ~/version4/backend
cp .env.production.example .env
php artisan key:generate
```

Renseigner ensuite les identifiants MySQL cPanel, SMTP et EasyPay dans `.env`.

Valeurs importantes :

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.aba.cd
FRONTEND_URL=https://holistique-books.com

DB_CONNECTION=mysql

EASYPAY_MODE=v1
EASYPAY_CORRELATION_ID=...
EASYPAY_TOKEN=...
```

Le véritable `.env` ne doit jamais être commit.

## 4. MySQL cPanel

Créer dans cPanel :

1. une base MySQL dédiée ;
2. un utilisateur MySQL dédié ;
3. attribuer tous les privilèges nécessaires à cet utilisateur sur cette base.

Reporter les valeurs dans `.env`.

Ne pas utiliser les identifiants XAMPP locaux en production.

## 5. Lancer le déploiement

```bash
cd ~/version4/backend
chmod +x deploy-cpanel.sh
./deploy-cpanel.sh
```

Le script :

- installe les dépendances PHP sans dépendances de développement ;
- active brièvement le mode maintenance ;
- exécute les migrations avec `--force` ;
- crée le lien `public/storage` ;
- compile les assets si Node/npm existe ;
- génère les caches de production ;
- remet l'application en ligne.

## 6. SSL

Activer AutoSSL/Let's Encrypt sur `api.aba.cd`.

Après activation, cette URL doit répondre en HTTPS :

```text
https://api.aba.cd/api/v1/health
```

Réponse attendue :

```json
{"status":"ok","service":"HolisticBooks API"}
```

## 7. EasyPay Live

Dans l'espace marchand EasyPay, utiliser le callback public direct vers Laravel :

```text
https://api.aba.cd/api/v1/payments/easypay/notify
```

Le backend revérifie le statut auprès d'EasyPay avant de valider une commande.

Variables :

```env
EASYPAY_MODE=v1
EASYPAY_CORRELATION_ID=VOTRE_CID
EASYPAY_TOKEN=VOTRE_TOKEN
```

Ne jamais mettre le token EasyPay dans une variable `NEXT_PUBLIC_*`.

## 8. Cron Laravel

Dans cPanel > Cron Jobs, ajouter chaque minute :

```cron
* * * * * cd /home/CPANEL_USER/version4/backend && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1
```

Adapter le chemin de PHP au serveur cPanel si nécessaire.

Le scheduler libère notamment les royalties arrivées à échéance.

Si des jobs en file d'attente sont utilisés, ajouter également :

```cron
* * * * * cd /home/CPANEL_USER/version4/backend && /usr/local/bin/php artisan queue:work --stop-when-empty --tries=3 >> /dev/null 2>&1
```

## 9. Vérifications après déploiement

```bash
php artisan about
php artisan migrate:status
php artisan route:list
php artisan storage:link
```

Puis vérifier :

```text
https://api.aba.cd/api/v1/health
https://api.aba.cd/admin
https://api.aba.cd/studio
```

Enfin tester depuis le frontend :

1. inscription / connexion ;
2. récupération du profil ;
3. catalogue ;
4. ajout d'un livre auteur ;
5. paiement EasyPay sandbox/live selon environnement ;
6. callback IPN ;
7. accès bibliothèque ;
8. royalties auteur.

## 10. Mise à jour de production

Séquence recommandée :

```bash
cd ~/version4
git pull origin dev
cd backend
./deploy-cpanel.sh
```

Avant toute migration destructive, sauvegarder la base MySQL.
