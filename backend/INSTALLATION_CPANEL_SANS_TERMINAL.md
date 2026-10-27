# INSTALLATION HOLISTIQUE BOOKS SUR CPANEL SANS TERMINAL

## Les deux fichiers ZIP sont prêts pour le panneau cPanel

Ce paquet est construit depuis la branche **main** du dépôt `elvisalibaba/version4`.
Vous recevez :
- `holisticbooks-api-public-....zip` : contenu à extraire dans `/home/khspevnk/public_html/api.aba.cd/`.
- `holisticbooks-api-private-....zip` : contenu à extraire dans `/home/khspevnk/holistic-api/`.

**Vérifiez que ces chemins correspondent à votre hébergement avant toute extraction.**
Les ZIP contiennent directement les fichiers de leur destination, sans dossier parent supplémentaire.

### Ordre sécurisé

1. Faire une sauvegarde cPanel du dossier `holistic-api`, des fichiers privés du lecteur, et de la base MySQL par phpMyAdmin / Backup Wizard.
2. Ne jamais remplacer/supprimer `/home/khspevnk/holistic-api/.env`, `storage/app/private/books`, `storage/app/backups`, ni les téléchargements déjà présents.
3. Extraire d'abord le ZIP **public** dans `/home/khspevnk/public_html/api.aba.cd/`.
4. Extraire ensuite le ZIP **privé** dans `/home/khspevnk/holistic-api/` : le fichier `RELEASE` mis à jour déclenche automatiquement l'initialisation.
5. **Ne PAS importer de SQL manuellement** : les migrations en attente sont exécutées de manière incrémentale par le script cron via `php artisan migrate --force`.
6. cPanel > Advanced / Tâches cron > Une fois par minute, inscrire **une seule** tâche :

```cron
* * * * * /bin/bash /home/khspevnk/holistic-api/cpanel-cron.sh >/dev/null 2>&1
```

Si aucun binaire PHP correct n'est détecté, utiliser plutôt :

```cron
* * * * * PHP_BIN=/opt/cpanel/ea-php83/root/usr/bin/php /bin/bash /home/khspevnk/holistic-api/cpanel-cron.sh >/dev/null 2>&1
```

La variante PHP_BIN n'est à activer qu'après vérification du chemin PHP 8.3+ sur votre cPanel.
**Ne créez pas deux tâches cron équivalentes.** Si `cpanel-cron.sh` existe déjà dans vos tâches, gardez la tâche existante.

7. Après exécution, ouvrir le Gestionnaire de fichiers cPanel et contrôler :
   - `holistic-api/storage/app/deploy/STATUS.txt` : `Résultat : OK`
   - `holistic-api/storage/logs/deploy.log`
   - `holistic-api/storage/logs/schedule.log`
8. Le script prend en charge : sauvegarde DB si `mysqldump` est disponible, `migrate --force`, un seeder connu au premier déploiement, `optimize`, `filament:optimize`, `queue:restart`, vérification de santé, tâches planifiées. **Attention :** si mysqldump n'est pas installé, le script avertit qu'aucun dump local n'a été créé ; la sauvegarde manuelle préalable est indispensable.
9. Si les logs affichent un échec de migration, ne pas extraire le ZIP suivant ni effacer les données ; contrôler les erreurs et le backup.

### Frontend Cloudflare

Une fois l'API testée, déployer la branche `main` de Next.js sur Cloudflare et configurer les variables build et runtime :

```text
HOLISTIC_DATA_SOURCE=laravel
API_URL=https://api.aba.cd
NEXT_PUBLIC_API_URL=https://api.aba.cd
NEXT_PUBLIC_APP_URL=https://www.holistique-books.com
APP_BASE_URL=https://www.holistique-books.com
```

Les livres gratuits utilisent `GET https://api.aba.cd/api/v1/books/{UUID}/read-free`. Ajouter une règle **Cache Rules** Cloudflare strictement limitée à cet endpoint, pas à toutes les routes `/api`. Vérifier que le sous-domaine `api.aba.cd` est effectivement proxy Cloudflare et que le CORS autorise `www.holistique-books.com`.

### Validation fonctionnelle

- Un PDF réellement gratuit publié s'ouvre sans compte ; après son chargement initial, chaque page se lit localement.
- Un PDF payant doit refuser l'accès direct à `/read-free` (HTTP 403).
- Les couvertures, le catalogue, les authentifications, EasyPay, les sessions et la console Filament fonctionnent.
- Ne supprimez aucune donnée Supabase avant d'avoir vérifié les livres/comptes/fichiers éventuellement encore hébergés là-bas.
- En cas de blocage, envoyer le contenu de `STATUS.txt` et les extraits pertinents de `deploy.log`, **jamais le fichier `.env` ni vos mots de passe**.
