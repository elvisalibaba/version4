# Release de consolidation Holistique Books — 29 septembre 2026

## Objectif

Cette release consolide le passage à Laravel/MySQL et prépare la plateforme web, le back-office et le futur client Flutter autour d’une API unique.

## Fonctionnalités livrées

### Administration catalogue
- auteurs catalogue sans compte utilisateur obligatoire ;
- création d’un auteur directement depuis le formulaire livre ;
- valeurs JSON obligatoires normalisées pour MySQL ;
- diagnostic production `holistic:diagnose-admin` ;
- couvertures publiques servies par Laravel, sans dépendre de `storage:link`.

### Authentification et emails
- compte créé comme non vérifié ;
- OTP email à 6 chiffres, durée par défaut 15 minutes ;
- renvoi du code limité par throttle ;
- aucun token Sanctum avant validation de l’adresse ;
- anciens tokens non vérifiés bloqués par le middleware `verified` ;
- Filament refuse également un compte non vérifié ;
- mail de bienvenue ;
- mail de réinitialisation du mot de passe brandé ;
- reçu de paiement après confirmation EasyPay côté serveur ;
- diagnostic SMTP `holistic:test-mail`.

Le mot de passe utilisateur n’est jamais envoyé par email.

### Paiement
- les reçus sont envoyés uniquement après statut EasyPay `SUCCESS` vérifié côté serveur ;
- un échec d’envoi email ne remet pas en cause un paiement déjà confirmé ;
- `payment_receipt_sent_at` évite les envois répétés ordinaires.

### Lecteur web
- reprise PDF par numéro de page ;
- reprise EPUB par CFI ;
- progression synchronisée vers Laravel ;
- activité de bibliothèque mise à jour ;
- progression visible sur dashboard et bibliothèque ;
- même données de progression réutilisables par Flutter.

### Mobile / Flutter
- `GET /api/v1/mobile/bootstrap` ;
- enregistrement / mise à jour d’un appareil ;
- heartbeat ;
- révocation d’un appareil ;
- enregistrement FCM/APNs ;
- Sanctum Bearer comme authentification commune web/mobile ;
- contrat détaillé dans `docs/FLUTTER_API.md`.

## Stockage des couvertures

Le disque public utilise par défaut :

`storage/app/public`

Les médias sont exposés par :

`GET /api/v1/media/{path}`

Exemple :

`https://api.aba.cd/api/v1/media/covers/xxxx.jpg`

Le déploiement cPanel n’a donc plus besoin d’un lien symbolique `public/storage` pour les nouvelles couvertures.

## Migration requise

Après installation du nouveau package :

```bash
/usr/local/bin/ea-php83 /home/khspevnk/holistic-api/artisan migrate --force
```

Puis :

```bash
/usr/local/bin/ea-php83 /home/khspevnk/holistic-api/artisan optimize:clear
/usr/local/bin/ea-php83 /home/khspevnk/holistic-api/artisan config:cache
/usr/local/bin/ea-php83 /home/khspevnk/holistic-api/artisan view:cache
```

Sur le plan sans Terminal, exécuter chaque commande via un Cron temporaire puis supprimer immédiatement le Cron.

## Configuration mail production

Valeurs recommandées dans le vrai `.env` serveur :

```env
MAIL_MAILER=failover
MAIL_SCHEME=tls
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=noreply@aba.cd
MAIL_FROM_NAME="Holistique Books"
MAIL_SENDMAIL_PATH="/usr/sbin/sendmail -bs -i"
SUPPORT_EMAIL=
EMAIL_VERIFICATION_TTL_MINUTES=15
EMAIL_VERIFICATION_MAX_ATTEMPTS=5
```

Le mailer `failover` essaie SMTP puis le sendmail local cPanel. Les identifiants SMTP ne doivent jamais être ajoutés au dépôt Git.

Test :

```bash
/usr/local/bin/ea-php83 /home/khspevnk/holistic-api/artisan holistic:test-mail destinataire@example.com
```

## Diagnostic admin / fichiers

```bash
/usr/local/bin/ea-php83 /home/khspevnk/holistic-api/artisan holistic:diagnose-admin
```

Le résultat indique :
- version PHP ;
- limites d’upload ;
- permissions storage/cache ;
- connexion MySQL ;
- colonnes catalogue nécessaires ;
- état de la contrainte auteur ;
- écriture stockage privé/public ;
- URL publique utilisée pour les covers.

## Contrôles post-déploiement

1. `GET https://api.aba.cd/api/v1/health`
2. création auteur catalogue dans Filament ;
3. création livre sans cover ;
4. création livre avec cover ;
5. ouverture de l’URL cover `/api/v1/media/...` ;
6. inscription d’un nouveau lecteur ;
7. réception OTP ;
8. validation OTP ;
9. login ;
10. mot de passe oublié ;
11. lecture d’un livre et reprise de progression ;
12. paiement EasyPay de test autorisé ;
13. réception du reçu seulement après confirmation ;
14. `GET /api/v1/mobile/bootstrap`.

## Secrets restant à fournir hors Git

- SMTP si l’envoi local cPanel n’est pas retenu ;
- EasyPay CID/token production ;
- éventuels identifiants FCM/APNs lorsque les notifications push Flutter seront activées.

## Règle de release

- développement sur `dev` ;
- CI verte ;
- promotion contrôlée vers `main` et `production` ;
- génération automatique du ZIP Laravel cPanel ;
- sauvegarde DB avant migrations destructives ;
- test health + auth + catalogue + paiement après chaque release.
