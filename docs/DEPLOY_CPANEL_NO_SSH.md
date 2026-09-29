# Déploiement cPanel sans SSH — api.aba.cd

Le plan cPanel actuel n'offre pas Terminal/SSH. Le déploiement utilise donc un paquet Laravel construit automatiquement par GitHub Actions.

## Étapes
1. GitHub Actions > Production package.
2. Télécharger l'artifact holisticbooks-api-production.
3. Dans cPanel File Manager, créer /home/CPANEL_USER/holistic-api hors public_html.
4. Uploader holisticbooks-api-production.zip puis l'extraire.
5. Le Document Root de api.aba.cd doit être /home/CPANEL_USER/holistic-api/public.
6. Copier .env.production.example vers .env et renseigner APP_KEY, MySQL, SMTP et EasyPay.
7. Si cPanel propose Cron Jobs, utiliser un cron temporaire pour exécuter Laravel Artisan.

## Cron temporaire de migration
Le chemin PHP dépend de l'hébergeur :

```cron
* * * * * /usr/local/bin/php /home/CPANEL_USER/holistic-api/artisan migrate --force >> /home/CPANEL_USER/holistic-api/storage/logs/deploy-cron.log 2>&1
```

Après une exécution réussie, supprimer immédiatement ce cron.

Faire de même si nécessaire avec :
- artisan storage:link
- artisan optimize:clear
- artisan config:cache
- artisan view:cache

## Scheduler permanent
```cron
* * * * * /usr/local/bin/php /home/CPANEL_USER/holistic-api/artisan schedule:run >> /dev/null 2>&1
```

## Tests
- https://api.aba.cd/api/v1/health
- https://api.aba.cd/admin
- https://api.aba.cd/studio
- EasyPay IPN : https://api.aba.cd/api/v1/payments/easypay/notify

Ne jamais exposer le dossier Laravel racine ni le fichier .env.
