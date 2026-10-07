#!/usr/bin/env bash
# =============================================================================
# Holistique Books — site complet en local (API Laravel + front Next.js).
#
#   npm run dev:local            démarre (crée la base de démo au premier lancement)
#   npm run dev:local -- --fresh repart d'une base de démo neuve
#
# Base SQLite de démo séparée : ta base MySQL et ton backend/.env ne sont pas touchés.
# Comptes de test (mot de passe Demo12345) : lecteur@demo.local, auteur@demo.local, admin@demo.local
# Lecture du PDF protégé : nécessite pdftoppm (brew install poppler).
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$ROOT/backend"
DB_FILE="$API_DIR/database/local-demo.sqlite"
ENV_FILE="$API_DIR/.env.demo"
API_URL="http://127.0.0.1:8000"
PROXY_SECRET="local-demo-proxy-secret"

FRESH=0
[[ "${1:-}" == "--fresh" ]] && FRESH=1

command -v pdftoppm >/dev/null || echo "⚠  pdftoppm absent : la lecture des livres ne s'affichera pas (brew install poppler)."

# Remplace (ou ajoute) une clé dans .env.demo.
set_env() {
  if grep -q "^$1=" "$ENV_FILE"; then
    sed -i.bak "s#^$1=.*#$1=$2#" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  else
    printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"
  fi
}

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$API_DIR/.env" "$ENV_FILE" 2>/dev/null || cp "$API_DIR/.env.example" "$ENV_FILE"
fi
set_env APP_ENV demo
set_env APP_DEBUG true
set_env APP_URL "$API_URL"
set_env DB_CONNECTION sqlite
set_env DB_DATABASE "$DB_FILE"
set_env SESSION_DRIVER file
set_env CACHE_STORE file
set_env QUEUE_CONNECTION sync
set_env MAIL_MAILER log
set_env FRONTEND_URL "http://localhost:3000"
set_env FRONTEND_PROXY_SECRET "$PROXY_SECRET"
grep -q "^APP_KEY=base64" "$ENV_FILE" || (cd "$API_DIR" && php artisan key:generate --env=demo --force --no-interaction >/dev/null)

if [[ $FRESH == 1 ]]; then rm -f "$DB_FILE"; fi
NEW_DB=0
[[ -f "$DB_FILE" ]] || { touch "$DB_FILE"; NEW_DB=1; }

cd "$API_DIR"
php artisan migrate --env=demo --force --no-interaction
if [[ $NEW_DB == 1 ]]; then
  php artisan db:seed --env=demo --class=LocalDemoSeeder --force --no-interaction
fi

cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

php artisan serve --env=demo --host=127.0.0.1 --port=8000 --no-interaction &

cd "$ROOT"
echo "→ API : $API_URL   ·   Site : http://localhost:3000"
API_URL="$API_URL" NEXT_PUBLIC_API_URL="$API_URL" FRONTEND_PROXY_SECRET="$PROXY_SECRET" npx next dev
