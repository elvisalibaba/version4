#!/usr/bin/env bash
set -euo pipefail

# HolisticBooks API production deployment for api.aba.cd.
# Run this script from the backend directory after the server .env has been configured.

if [ ! -f artisan ] || [ ! -f composer.json ]; then
  echo "Erreur: lancez ce script depuis le dossier backend."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Erreur: backend/.env est absent. Copiez .env.production.example vers .env et renseignez les secrets."
  exit 1
fi

echo "==> Installation PHP production"
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

echo "==> Mise en cache / maintenance"
php artisan down --retry=60 || true
php artisan optimize:clear

echo "==> Migrations MySQL"
php artisan migrate --force

echo "==> Lien de stockage"
php artisan storage:link || true

if command -v npm >/dev/null 2>&1; then
  echo "==> Assets Filament / Vite"
  npm ci --no-audit --no-fund
  npm run build
  php artisan filament:assets || true
else
  echo "ATTENTION: Node/npm absent. Le dossier public/build doit déjà avoir été construit et déployé."
fi

echo "==> Cache production"
php artisan config:cache
php artisan view:cache
php artisan event:cache || true

echo "==> Permissions runtime"
chmod -R ug+rwX storage bootstrap/cache || true

echo "==> Remise en ligne"
php artisan up

echo "==> Vérification Laravel"
php artisan about --only=environment || true
php artisan route:list --path=api/v1/health

echo ""
echo "Déploiement terminé."
echo "Testez: https://api.aba.cd/api/v1/health"
