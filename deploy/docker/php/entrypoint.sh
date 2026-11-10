#!/bin/sh
# HolisticBooks — démarrage des conteneurs PHP (app, worker, scheduler).
# Les caches de configuration, de routes et de vues sont reconstruits à chaque
# démarrage à partir des variables d'environnement du conteneur.
set -eu

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY manquante : renseignez env/api.env sur le serveur." >&2
    exit 1
fi

php artisan optimize --quiet
php artisan filament:optimize --quiet 2>/dev/null || true

exec "$@"
