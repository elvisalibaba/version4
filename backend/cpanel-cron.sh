#!/bin/bash
# =============================================================================
# Holistique Books — cron UNIQUE pour cPanel sans SSH ni terminal.
#
# Dans cPanel > Tâches Cron, ajoutez UNE seule ligne, toutes les minutes :
#
#   * * * * * /bin/bash /home/UTILISATEUR/holistic-api/cpanel-cron.sh >/dev/null 2>&1
#
# Si la détection automatique de PHP échoue (voir storage/logs/deploy.log),
# indiquez le binaire PHP 8.3+ CLI :
#
#   * * * * * PHP_BIN=/opt/cpanel/ea-php84/root/usr/bin/php /bin/bash /home/UTILISATEUR/holistic-api/cpanel-cron.sh >/dev/null 2>&1
#
# Ce que fait ce script à chaque minute :
#   1. Déploiement automatique quand le fichier RELEASE change (nouveau ZIP
#      extrait) ou quand storage/app/deploy/DEPLOY existe :
#      clé APP_KEY, sauvegarde MySQL, migrations, caches, contrôle de santé.
#   2. Création d'un administrateur si storage/app/deploy/make-admin.txt existe
#      (ligne 1 : e-mail, ligne 2 : mot de passe, ligne 3 : nom). Fichier supprimé.
#   3. Sinon : php artisan schedule:run (royalties, file d'attente des e-mails,
#      nettoyage des sessions…).
#
# Résultat lisible depuis le Gestionnaire de fichiers :
#   storage/app/deploy/STATUS.txt   (résumé du dernier déploiement)
#   storage/logs/deploy.log         (journal détaillé)
# =============================================================================

set -u

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$APP_DIR/storage/app/deploy"
LOG_FILE="$APP_DIR/storage/logs/deploy.log"
LOCK_DIR="$DEPLOY_DIR/.lock"
STATUS_FILE="$DEPLOY_DIR/STATUS.txt"

cd "$APP_DIR" || exit 1
umask 007
mkdir -p "$DEPLOY_DIR" "$APP_DIR/storage/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Garde le journal sous 5 Mo.
if [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE")" -gt 5242880 ]; then
    tail -c 1048576 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

# --- Verrou : un seul passage à la fois (mkdir est atomique) -----------------
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    # Verrou orphelin (> 30 min) : on le libère.
    if [ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin +30 2>/dev/null)" ]; then
        rmdir "$LOCK_DIR" 2>/dev/null
        log "Verrou orphelin supprimé."
    fi
    exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null' EXIT

# --- Binaire PHP CLI 8.3+ ----------------------------------------------------
php_ok() {
    [ -x "$1" ] && [ "$("$1" -r 'echo PHP_SAPI === "cli" && PHP_VERSION_ID >= 80300 ? "ok" : "no";' 2>/dev/null)" = "ok" ]
}

if [ -z "${PHP_BIN:-}" ] || ! php_ok "$PHP_BIN"; then
    PHP_BIN=""
    for candidate in \
        /opt/cpanel/ea-php84/root/usr/bin/php \
        /opt/cpanel/ea-php83/root/usr/bin/php \
        /opt/alt/php84/usr/bin/php \
        /opt/alt/php83/usr/bin/php \
        /usr/local/bin/ea-php84 \
        /usr/local/bin/ea-php83 \
        /usr/local/bin/php \
        "$(command -v php 2>/dev/null)"; do
        if [ -n "$candidate" ] && php_ok "$candidate"; then
            PHP_BIN="$candidate"
            break
        fi
    done
fi

if [ -z "$PHP_BIN" ]; then
    log "ERREUR : aucun PHP 8.3+ CLI trouvé. Ajoutez PHP_BIN=/chemin/vers/php devant la commande cron."
    exit 1
fi

artisan() {
    "$PHP_BIN" "$APP_DIR/artisan" "$@" --no-interaction >> "$LOG_FILE" 2>&1
}

write_status() {
    {
        echo "Dernier déploiement : $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Version (RELEASE)   : ${RELEASE:-inconnue}"
        echo "Résultat            : $1"
        echo "PHP                 : $PHP_BIN"
        echo ""
        echo "Détails : storage/logs/deploy.log"
    } > "$STATUS_FILE"
}

# --- Décider s'il faut déployer ----------------------------------------------
RELEASE=""
[ -f "$APP_DIR/RELEASE" ] && RELEASE="$(tr -d '[:space:]' < "$APP_DIR/RELEASE")"
LAST_RELEASE=""
[ -f "$DEPLOY_DIR/last-release" ] && LAST_RELEASE="$(cat "$DEPLOY_DIR/last-release")"
FAILED_RELEASE=""
[ -f "$DEPLOY_DIR/failed-release" ] && FAILED_RELEASE="$(cat "$DEPLOY_DIR/failed-release")"

NEED_DEPLOY=0
if [ -f "$DEPLOY_DIR/DEPLOY" ]; then
    NEED_DEPLOY=1
elif [ -n "$RELEASE" ] && [ "$RELEASE" != "$LAST_RELEASE" ] && [ "$RELEASE" != "$FAILED_RELEASE" ]; then
    # Une version qui a échoué n'est pas retentée en boucle : corrigez puis
    # créez storage/app/deploy/DEPLOY pour relancer.
    NEED_DEPLOY=1
fi

deploy() {
    log "===== Déploiement ${RELEASE:-manuel} ====="

    if [ ! -f "$APP_DIR/.env" ]; then
        log "ERREUR : .env absent. Copiez .env.production.example en .env (Gestionnaire de fichiers) et renseignez-le."
        write_status "ÉCHEC — fichier .env absent"
        return 1
    fi

    mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
        storage/app/private/books storage/app/public storage/app/backups bootstrap/cache
    chmod -R ug+rwX storage bootstrap/cache 2>/dev/null

    # Caches de l'ancienne version : ils pourraient empêcher Laravel de démarrer.
    rm -f bootstrap/cache/*.php

    if ! grep -qE '^APP_KEY=.+' .env; then
        log "Génération de APP_KEY (premier déploiement)."
        artisan key:generate --force || { write_status "ÉCHEC — key:generate"; return 1; }
    fi

    artisan down --retry=60 || true

    if ! artisan holistic:backup-db; then
        log "ERREUR : sauvegarde impossible, migration annulée."
        artisan up
        write_status "ÉCHEC — sauvegarde MySQL (aucune migration lancée)"
        return 1
    fi

    if ! artisan migrate --force; then
        log "ERREUR : migration échouée. Site remis en ligne ; restaurez la sauvegarde si besoin (storage/app/backups)."
        artisan up
        write_status "ÉCHEC — migrations (voir deploy.log)"
        return 1
    fi

    if [ ! -f "$DEPLOY_DIR/seeded" ]; then
        artisan db:seed --class=Database\\Seeders\\RdcEducationCatalogSeeder --force \
            && touch "$DEPLOY_DIR/seeded"
    fi

    artisan optimize || log "Avertissement : optimize a échoué (l'application fonctionne sans cache)."
    artisan filament:optimize || true
    artisan queue:restart || true
    artisan up

    if artisan holistic:health --json; then
        write_status "OK"
    else
        write_status "DÉPLOYÉ — mais le contrôle de santé signale un problème (voir deploy.log)"
    fi

    log "===== Déploiement terminé ====="
    return 0
}

if [ "$NEED_DEPLOY" = "1" ]; then
    rm -f "$DEPLOY_DIR/DEPLOY"
    if deploy; then
        [ -n "$RELEASE" ] && echo "$RELEASE" > "$DEPLOY_DIR/last-release"
        rm -f "$DEPLOY_DIR/failed-release"
    else
        [ -n "$RELEASE" ] && echo "$RELEASE" > "$DEPLOY_DIR/failed-release"
    fi
    exit 0
fi

# --- Création d'administrateur sans terminal -----------------------------------
if [ -f "$DEPLOY_DIR/make-admin.txt" ]; then
    log "Création / promotion d'un administrateur depuis make-admin.txt"
    artisan holistic:make-admin --from-file="$DEPLOY_DIR/make-admin.txt" \
        || log "ERREUR : création admin échouée (fichier supprimé, voir ci-dessus)."
    rm -f "$DEPLOY_DIR/make-admin.txt"
fi

# --- Tâches planifiées Laravel -------------------------------------------------
"$PHP_BIN" "$APP_DIR/artisan" schedule:run --no-interaction >> "$APP_DIR/storage/logs/schedule.log" 2>&1

# Garde schedule.log sous 2 Mo.
if [ -f "$APP_DIR/storage/logs/schedule.log" ] && [ "$(wc -c < "$APP_DIR/storage/logs/schedule.log")" -gt 2097152 ]; then
    tail -c 524288 "$APP_DIR/storage/logs/schedule.log" > "$APP_DIR/storage/logs/schedule.log.tmp" \
        && mv "$APP_DIR/storage/logs/schedule.log.tmp" "$APP_DIR/storage/logs/schedule.log"
fi
