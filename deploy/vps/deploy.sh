#!/usr/bin/env bash
# HolisticBooks — déploiement sur le VPS (installé dans /opt/holisticbooks).
#
# Usage (en root) :
#   ./deploy.sh init-secrets   crée env/*.env depuis les modèles et génère les secrets
#                              (APP_KEY, mots de passe MySQL, FRONTEND_PROXY_SECRET)
#                              sans jamais les afficher ; ne remplace rien d'existant.
#   ./deploy.sh <sha>          déploie le commit <sha> (40 caractères) déjà construit
#                              par GitHub Actions et publié sur GHCR.
#   ./deploy.sh rollback       redéploie le commit précédent (images seulement ; les
#                              migrations déjà appliquées ne sont pas annulées).
#   ./deploy.sh caddy          régénère et recharge seulement les sites Caddy.
#   ./deploy.sh status         état des conteneurs et du dernier déploiement.
#
# Les images sont privées : `docker login ghcr.io` doit avoir été fait une fois sur le
# serveur avec un jeton GitHub limité à read:packages.
set -Eeuo pipefail
umask 077

APP_DIR=/opt/holisticbooks
EDGE_DIR=/opt/edge-sites
CERT_DIR="$EDGE_DIR/certs/holisticbooks"
REGISTRY=ghcr.io/elvisalibaba
LOG_FILE=/var/log/holisticbooks-deploy.log

cd "$APP_DIR"

log() { printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "$LOG_FILE" >&2; }
die() { log "ÉCHEC : $*"; exit 1; }

exec 9>"$APP_DIR/.deploy.lock"
flock -n 9 || die "un autre déploiement est en cours"

[ -f .env ] || die ".env absent (voir env/compose.env.example)"
set -a; . ./.env; set +a

compose() { docker compose --project-directory "$APP_DIR" -f "$APP_DIR/compose.yaml" "$@"; }

# Remplace la valeur d'une variable vide dans un fichier .env, sans l'afficher.
fill_secret() {
    local file=$1 key=$2 value=$3
    if grep -qE "^${key}=.+" "$file"; then return 0; fi
    python3 - "$file" "$key" "$value" <<'PY'
import sys, re
path, key, value = sys.argv[1:4]
lines = open(path, encoding="utf-8").read().splitlines()
out, done = [], False
for line in lines:
    if not done and re.match(rf"^{re.escape(key)}=\s*$", line):
        out.append(f"{key}={value}"); done = True
    else:
        out.append(line)
if not done:
    out.append(f"{key}={value}")
open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
PY
}

value_of() { grep -E "^$2=" "$1" | head -n1 | cut -d= -f2-; }

init_secrets() {
    mkdir -p env
    for name in api web db; do
        [ -f "env/$name.env" ] || install -m 600 "env/$name.env.example" "env/$name.env"
        chmod 600 "env/$name.env"
    done
    fill_secret env/db.env MYSQL_PASSWORD "$(openssl rand -hex 24)"
    fill_secret env/db.env MYSQL_ROOT_PASSWORD "$(openssl rand -hex 24)"
    fill_secret env/api.env DB_PASSWORD "$(value_of env/db.env MYSQL_PASSWORD)"
    fill_secret env/api.env APP_KEY "base64:$(openssl rand -base64 32)"
    local proxy_secret
    proxy_secret=$(value_of env/api.env FRONTEND_PROXY_SECRET)
    [ -n "$proxy_secret" ] || proxy_secret=$(openssl rand -hex 32)
    fill_secret env/api.env FRONTEND_PROXY_SECRET "$proxy_secret"
    fill_secret env/web.env FRONTEND_PROXY_SECRET "$proxy_secret"
    [ "$(value_of env/api.env DB_PASSWORD)" = "$(value_of env/db.env MYSQL_PASSWORD)" ] \
        || die "DB_PASSWORD (api.env) et MYSQL_PASSWORD (db.env) diffèrent"
    log "Secrets présents dans env/ (valeurs non affichées). Variables encore vides :"
    for name in api web; do
        grep -E '^[A-Z_]+=$' "env/$name.env" | cut -d= -f1 | sed "s/^/  env\/$name.env : /" >&2 || true
    done
}

cloudflare_ranges() {
    local v4 v6
    v4=$(curl -fsS --max-time 10 https://www.cloudflare.com/ips-v4 2>/dev/null || true)
    v6=$(curl -fsS --max-time 10 https://www.cloudflare.com/ips-v6 2>/dev/null || true)
    if printf '%s\n' "$v4" | grep -qE '^[0-9.]+/[0-9]+$' && printf '%s\n' "$v6" | grep -qE '^[0-9a-f:]+/[0-9]+$'; then
        printf '%s\n%s\n' "$v4" "$v6" | grep -E '^[0-9a-f.:]+/[0-9]+$' | tr '\n' ' '
    else
        log "Liste Cloudflare indisponible : repli sur la liste intégrée."
        echo "173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20 197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14 172.64.0.0/13 131.0.72.0/22 2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32 2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32"
    fi
}

render_caddy() {
    local container=${EDGE_CADDY_CONTAINER:?} target="$EDGE_DIR/holisticbooks.caddy" tmp
    for cert in "$HB_FRONT_CERT" "$HB_API_CERT"; do
        [ -s "$CERT_DIR/$cert.pem" ] && [ -s "$CERT_DIR/$cert.key" ] \
            || die "certificat d'origine absent : $CERT_DIR/$cert.pem / .key"
    done
    docker inspect "$container" >/dev/null 2>&1 || die "conteneur Caddy $container introuvable"
    docker exec "$container" test -d /etc/caddy/sites.d \
        || die "le Caddy partagé ne monte pas encore $EDGE_DIR (PR Ibala Pay non déployée)"

    tmp=$(mktemp "$EDGE_DIR/.holisticbooks.XXXXXX")
    sed -e "s#__CF_RANGES__#$(cloudflare_ranges)#" \
        -e "s#__FRONT_HOST__#${HB_FRONT_HOST:?}#g" \
        -e "s#__API_HOST__#${HB_API_HOST:?}#g" \
        -e "s#__REDIRECT_HOST__#${HB_REDIRECT_HOST:?}#g" \
        -e "s#__FRONT_CERT__#${HB_FRONT_CERT:?}#g" \
        -e "s#__API_CERT__#${HB_API_CERT:?}#g" \
        "$APP_DIR/caddy/holisticbooks.caddy.template" > "$tmp"
    chmod 644 "$tmp"

    local backup=""
    if [ -f "$target" ]; then backup="$target.prev"; cp -p "$target" "$backup"; fi
    mv "$tmp" "$target"
    if ! docker exec "$container" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
        if [ -n "$backup" ]; then mv "$backup" "$target"; else rm -f "$target"; fi
        die "configuration Caddy invalide : ancien fichier restauré, Caddy non rechargé"
    fi
    docker exec "$container" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 \
        || { if [ -n "$backup" ]; then mv "$backup" "$target"; else rm -f "$target"; fi; die "rechargement Caddy refusé : ancien fichier restauré"; }
    log "Sites Caddy HolisticBooks rechargés : $HB_FRONT_HOST, $HB_API_HOST, $HB_REDIRECT_HOST"
}

# Récupère compose.yaml, le gabarit Caddy, les modèles .env et les scripts de la version
# déployée (copiés dans l'image API au build), pour que serveur et code restent alignés.
sync_release_files() {
    local sha=$1 cid release="$APP_DIR/.release"
    rm -rf "$release"; mkdir -p "$release"
    cid=$(docker create "$REGISTRY/holisticbooks-api:$sha")
    docker cp "$cid:/usr/share/holisticbooks/deploy-vps/." "$release/" >/dev/null
    docker rm "$cid" >/dev/null
    install -m 644 "$release/compose.yaml" "$APP_DIR/compose.yaml"
    install -d -m 755 "$APP_DIR/caddy" "$APP_DIR/systemd"
    install -m 644 "$release/caddy/holisticbooks.caddy.template" "$APP_DIR/caddy/"
    install -m 600 "$release"/env/*.example "$APP_DIR/env/"
    install -m 750 "$release/backup.sh" "$APP_DIR/backup.sh"
    install -m 644 "$release"/systemd/* "$APP_DIR/systemd/"
    if ! cmp -s "$release/deploy.sh" "$APP_DIR/deploy.sh"; then
        install -m 750 "$release/deploy.sh" "$APP_DIR/deploy.sh.new"
        log "Nouvelle version de deploy.sh disponible : $APP_DIR/deploy.sh.new (à relire puis installer)."
    fi
}

# Réseau Docker et dossier partagés avec le Caddy d'Ibala Pay (créés par le premier des
# deux projets qui se déploie ; l'autre les réutilise).
ensure_edge() {
    docker network inspect shared-edge >/dev/null 2>&1 || docker network create shared-edge >/dev/null
    install -d -m 755 "$EDGE_DIR"
    install -d -m 700 "$EDGE_DIR/certs" "$CERT_DIR"
}

set_compose_var() {
    local key=$1 value=$2
    if grep -qE "^$key=" .env; then sed -i "s#^$key=.*#$key=$value#" .env; else echo "$key=$value" >> .env; fi
}

wait_healthy() {
    local service=$1 tries=${2:-40} id status
    for _ in $(seq "$tries"); do
        id=$(compose ps -q "$service")
        status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" 2>/dev/null || echo absent)
        [ "$status" = healthy ] && return 0
        sleep 3
    done
    die "$service n'est pas sain (état : $status)"
}

deploy() {
    local sha=$1 web_env=${HB_WEB_ENV:-test}
    [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || die "SHA de commit attendu (40 caractères hexadécimaux)"
    [ -s env/api.env ] && [ -s env/web.env ] && [ -s env/db.env ] || die "lancer d'abord ./deploy.sh init-secrets"

    log "Déploiement de $sha (front : $web_env)"
    local previous=${HB_IMAGE_TAG:-}
    export HB_IMAGE_TAG=$sha HB_WEB_IMAGE_TAG="$web_env-$sha"

    ensure_edge
    compose pull --quiet
    sync_release_files "$sha"
    compose up -d --wait db
    compose run --rm --no-deps app php artisan migrate --force
    compose up -d --remove-orphans
    wait_healthy nginx
    wait_healthy web 60
    compose exec -T app php artisan queue:restart >/dev/null

    compose exec -T nginx wget -q -O /dev/null http://127.0.0.1/api/v1/health \
        || die "l'API ne répond pas sur /api/v1/health"

    set_compose_var HB_IMAGE_TAG "$sha"
    set_compose_var HB_WEB_IMAGE_TAG "$web_env-$sha"
    [ -n "$previous" ] && [ "$previous" != "$sha" ] && set_compose_var HB_PREVIOUS_IMAGE_TAG "$previous"
    render_caddy
    log "Déploiement terminé : $sha"
}

case "${1:-}" in
    init-secrets) init_secrets ;;
    caddy) render_caddy ;;
    status)
        compose ps
        echo "Déployé : ${HB_IMAGE_TAG:-aucun} ; précédent : ${HB_PREVIOUS_IMAGE_TAG:-aucun}" ;;
    rollback)
        [ -n "${HB_PREVIOUS_IMAGE_TAG:-}" ] || die "aucun déploiement précédent connu"
        deploy "$HB_PREVIOUS_IMAGE_TAG" ;;
    "") sed -n '2,16p' "$0"; exit 2 ;;
    *) deploy "$1" ;;
esac
