# Déploiement cPanel sans SSH — api.aba.cd

Ce mode est prévu pour un hébergement cPanel où Terminal/SSH est indisponible.

## Principe

GitHub Actions construit le backend Laravel à la place du serveur :

- Composer installe les dépendances PHP de production ;
- Vite compile les assets Filament ;
- `vendor/` est inclus ;
- `node_modules/` et les fichiers de développement sont retirés ;
- un ZIP prêt pour cPanel est généré.

Le serveur cPanel ne doit donc pas exécuter Composer ou npm.

## 1. Paquet de production

Chaque push sur la branche `production` déclenche le workflow `Production package`.

Dans GitHub :

1. ouvrir **Actions** ;
2. ouvrir le dernier run **Production package** ;
3. télécharger l'artifact **holisticbooks-api-production** ;
4. décompresser l'artifact localement : il contient `holisticbooks-api-production.zip` et son checksum SHA-256.

Le ZIP Laravel contient directement `app/`, `bootstrap/`, `public/`, `vendor/`, etc.

## 2. cPanel File Manager

Créer un dossier privé hors de `public_html`, par exemple :

`/home/CPANEL_USER/holistic-api`

Uploader `holisticbooks-api-production.zip` dans ce dossier puis l'extraire.

Le résultat attendu :

```text
/home/CPANEL_USER/holistic-api/
  app/
  bootstrap/
  config/
  database/
  public/
  resources/
  routes/
  storage/
  vendor/
  artisan
  composer.json
```

## 3. Document Root

Dans **cPanel > Domains**, le Document Root de `api.aba.cd` doit être :

`/home/CPANEL_USER/holistic-api/public`

Ne jamais exposer la racine Laravel.

## 4. Fichier .env

Dans File Manager, copier `.env.production.example` vers `.env`.

Renseigner :

- APP_KEY ;
- base MySQL ;
- SMTP ;
- identifiants EasyPay.

Valeurs de base :

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.aba.cd
FRONTEND_URL=https://holistique-books.com
EASYPAY_MODE=v1
```

Ne jamais rendre le fichier `.env` public.

## 5. Base MySQL

Créer via **cPanel > MySQL Databases** :

- une base dédiée ;
- un utilisateur dédié ;
- les privilèges nécessaires.

Reporter ces informations dans `.env`.

## 6. Exécuter Artisan via Cron Jobs

Si **Cron Jobs** est disponible dans cPanel, il peut servir de lanceur ponctuel même sans Terminal.

Créer temporairement une tâche toutes les minutes. Le chemin PHP varie selon l'hébergeur.

Exemple :

```cron
* * * * * /usr/local/bin/php /home/CPANEL_USER/holistic-api/artisan migrate --force >> /home/CPANEL_USER/holistic-api/storage/logs/deploy-cron.log 2>&1
```

Attendre une exécution, contrôler `storage/logs/deploy-cron.log` depuis File Manager, puis SUPPRIMER ce cron temporaire.

Répéter au besoin pour :

```text
artisan storage:link
artisan optimize:clear
artisan config:cache
artisan view:cache
```

Ne laissez jamais le cron de migration permanent.

## 7. Scheduler permanent

Une fois l'installation terminée, garder uniquement :

```cron
* * * * * /usr/local/bin/php /home/CPANEL_USER/holistic-api/artisan schedule:run >> /dev/null 2>&1
```

Le chemin PHP exact doit être celui fourni par l'hébergeur.

## 8. Si storage:link ne fonctionne pas

Demander à l'hébergeur d'autoriser les liens symboliques, ou utiliser son gestionnaire de fichiers pour créer le lien si cette fonction est proposée.

Ne copiez pas les manuscrits privés dans `public/`.

## 9. EasyPay

Callback de production :

`https://api.aba.cd/api/v1/payments/easypay/notify`

Le token et le CID restent uniquement dans le `.env` Laravel.

## 10. Vérifications

Tester :

- `https://api.aba.cd/api/v1/health`
- `https://api.aba.cd/admin`
- `https://api.aba.cd/studio`

Puis tester inscription, connexion, catalogue, publication auteur, EasyPay, bibliothèque et royalties.

## 11. Mises à jour futures

Workflow recommandé :

```text
travail sur dev
  ↓
CI verte
  ↓
promotion vers production
  ↓
GitHub fabrique le ZIP
  ↓
upload/extraction cPanel
  ↓
cron temporaire migrate --force
  ↓
caches Laravel
  ↓
tests api.aba.cd
```

Toujours sauvegarder la base avant une migration potentiellement destructive.
