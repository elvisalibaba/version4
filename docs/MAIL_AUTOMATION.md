# Messagerie transactionnelle Holistique Books

Le backend Laravel gère désormais les emails suivants :

- code OTP à 6 chiffres après inscription ;
- confirmation de compte après vérification ;
- réinitialisation du mot de passe ;
- reçu après paiement EasyPay confirmé.

## Sécurité

Le mot de passe du compte n’est jamais envoyé par email. La validation utilise un code OTP temporaire, stocké sous forme de hash côté serveur.

## Variables production

Dans `.env` :

```env
MAIL_MAILER=smtp
MAIL_SCHEME=tls
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="Holistique Books"
SUPPORT_EMAIL=
EMAIL_VERIFICATION_TTL_MINUTES=15
EMAIL_VERIFICATION_MAX_ATTEMPTS=5
```

Les identifiants SMTP restent exclusivement dans le fichier `.env` du serveur et ne doivent jamais être commit dans Git.

## Test SMTP

Sans Terminal, utiliser un Cron cPanel temporaire en remplaçant l’adresse :

```cron
* * * * * /usr/local/bin/ea-php83 /home/khspevnk/holistic-api/artisan holistic:test-mail adresse@example.com >> /home/khspevnk/holistic-api/storage/logs/mail-test.log 2>&1
```

Après une seule exécution, supprimer immédiatement ce Cron.

## Vérification email

1. `POST /api/v1/auth/register`
2. le backend envoie l’OTP ;
3. `POST /api/v1/auth/verify-email`
4. le backend marque `email_verified_at` ;
5. un token Sanctum est émis ;
6. un mail de bienvenue est envoyé.

Un utilisateur non vérifié reçoit HTTP 403 à la connexion avec `verification_required=true`.

## Paiements

Le reçu est envoyé seulement après vérification serveur du statut EasyPay. Une colonne `payment_receipt_sent_at` évite les doubles reçus lors de plusieurs callbacks ou réconciliations.

Si le SMTP est indisponible, le paiement reste confirmé : l’échec d’envoi est journalisé et ne bloque pas la transaction.
