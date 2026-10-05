# Holistique Books — Runbook de mise en production

Ce document accompagne le backend Laravel/Filament et doit être exécuté avant toute promotion vers `production`.

## 1. Pré-requis serveur

- PHP 8.3+ avec : `intl`, `mbstring`, `pdo_mysql`, `fileinfo`, `zip`, `openssl`.
- MySQL/MariaDB compatible avec les migrations du projet.
- `pdfinfo` et `pdftoppm` (Poppler) requis pour le nombre de pages, les couvertures et le lecteur PDF protégé page par page.
- HTTPS obligatoire.
- Répertoire Laravel privé hors `public_html`.
- `storage/app/private/books` ne doit jamais être exposé directement par le serveur web.

Vérifier :

```bash
php -v
php -m
pdfinfo -v
pdftoppm -v
php artisan holistic:health --json
```

## 2. Variables critiques

En production :

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.aba.cd
FRONTEND_URL=https://holistique-books.com

READER_REQUIRE_SESSION=true
READER_SESSION_TTL_MINUTES=10
READER_MAX_ACTIVE_SESSIONS_PER_BOOK=5
BOOK_READER_PAGE_SIZE=1800

QUEUE_CONNECTION=database
SESSION_DRIVER=database
CACHE_STORE=database
```

Ne jamais versionner `APP_KEY`, les identifiants DB, EasyPay, SMTP ou stockage objet.

## 3. Déploiement

Avant migration :

1. Sauvegarde MySQL complète vers un emplacement hors serveur.
2. Sauvegarde ou snapshot du stockage privé des livres.
3. Vérifier le hash du package de production.
4. Activer le mode maintenance si le changement de schéma est important.

Puis :

```bash
php artisan optimize:clear
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan holistic:health --json
```

Ne jamais modifier une migration déjà exécutée. Toute évolution du schéma passe par une nouvelle migration réversible.

## 4. Cron cPanel

Configurer une seule entrée toutes les minutes vers le scheduler Laravel :

```cron
* * * * * cd /CHEMIN/holistic-api && /CHEMIN/PHP artisan schedule:run >> /dev/null 2>&1
```

Le chemin PHP dépend du compte cPanel. Le scheduler prend notamment en charge :

- libération des royalties devenues payables ;
- expiration des contrats de droits ;
- nettoyage des sessions lecteur.

## 5. Lecteur protégé

Politique de production :

- aucun `Book` téléchargeable ;
- aucun `BookFormat` téléchargeable ;
- aucun abonnement avec téléchargement ;
- PDF source uniquement sur disque privé ;
- les clients web/mobile consomment des pages rendues, jamais le PDF complet ;
- sessions lecteur courtes, liées au compte et au contexte appareil ;
- endpoint historique de fichier complet désactivé ;
- aperçu public basé exclusivement sur `sample_url`.

Si `pdftoppm` n’est pas disponible, le lecteur PDF protégé doit être considéré indisponible. Ne jamais réactiver le flux PDF complet comme contournement.

## 6. Paiements

Avant activation EasyPay réelle :

- passer `EASYPAY_MODE` au mode de production prévu par le marchand ;
- vérifier IPN/callback ;
- tester succès, échec, annulation, callback dupliqué et réconciliation manuelle ;
- vérifier qu’une même clé d’idempotence ne crée jamais deux commandes ;
- vérifier qu’une commande payée n’accumule qu’une seule royalty par article.

## 7. Backups

Une sauvegarde sur le même hébergement n’est pas une sauvegarde acceptable.

Minimum recommandé :

- MySQL quotidien, rétention 30 jours ;
- stockage livres/covers/contrats vers un stockage externe versionné ;
- test mensuel de restauration ;
- chiffrement des archives et contrôle d’accès ;
- journal du dernier backup réussi et alerte si > 24 h.

## 8. Rollback

Avant déploiement conserver :

- archive applicative précédente ;
- version DB/snapshot ;
- liste des migrations appliquées ;
- version du frontend correspondante.

En cas d’échec :

1. mettre en maintenance ;
2. restaurer l’application précédente ;
3. ne lancer `migrate:rollback` que pour des migrations explicitement validées comme réversibles ;
4. restaurer le snapshot DB si nécessaire ;
5. exécuter `holistic:health` ;
6. rouvrir le trafic seulement après validation lecture, login, commande et paiement.

## 9. Contrôles fonctionnels de sortie

Tester au minimum :

- création brouillon livre avec titre seul ;
- import massif avec cover appariée ;
- livre anonyme/texte sacré sans auteur ;
- validation éditoriale + BAT ;
- auteur incapable de modifier ses droits contractuels ;
- lecteur incapable de récupérer le PDF complet ;
- page PDF protégée accessible seulement avec session valide ;
- prix marché + promotion identiques entre fiche, panier et paiement ;
- paiement EasyPay idempotent ;
- royalty créée une seule fois ;
- recours auteur visible et audité ;
- permissions staff séparées Finance / Marketing / Juridique / Éditorial.
