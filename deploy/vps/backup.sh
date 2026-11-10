#!/usr/bin/env bash
# HolisticBooks — sauvegarde quotidienne chiffrée (base MySQL + fichiers envoyés).
#
# Lancé par hb-backup.timer (voir systemd/). Produit dans /var/backups/holisticbooks :
#   db-<horodatage>.sql.zst.age       dump MySQL complet (--single-transaction)
#   files-<horodatage>.tar.zst.age    volume hb_storage, sans le cache des pages du lecteur
# Chiffrement age vers la ou les clés publiques de backup/age-recipients.txt : la clé
# privée n'est jamais sur le serveur. Copie hors serveur facultative avec rclone
# (HB_BACKUP_RCLONE_REMOTE dans /opt/holisticbooks/.env, ex. « offsite:holisticbooks »).
set -Eeuo pipefail
umask 077

APP_DIR=/opt/holisticbooks
DEST=/var/backups/holisticbooks
RECIPIENTS="$APP_DIR/backup/age-recipients.txt"
KEEP_DAYS=${HB_BACKUP_KEEP_DAYS:-14}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

cd "$APP_DIR"
set -a; . ./.env; set +a
compose() { docker compose --project-directory "$APP_DIR" -f "$APP_DIR/compose.yaml" "$@"; }

command -v age >/dev/null || { echo "age est nécessaire (apt install age)" >&2; exit 1; }
grep -qE '^age1[0-9a-z]+' "$RECIPIENTS" 2>/dev/null || { echo "Aucune clé publique age dans $RECIPIENTS" >&2; exit 1; }
mkdir -p "$DEST"

db_file="$DEST/db-$STAMP.sql.zst.age"
compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --quick --routines --triggers --events --set-gtid-purged=OFF --databases "$MYSQL_DATABASE"' \
    | zstd -q -T0 -10 \
    | age -R "$RECIPIENTS" > "$db_file.part"
mv "$db_file.part" "$db_file"

files_file="$DEST/files-$STAMP.tar.zst.age"
compose exec -T app tar -C /var/www/html/storage/app \
        --exclude=./private/reader-pages --exclude=./private/livewire-tmp --exclude=./livewire-tmp \
        -cf - . \
    | zstd -q -T0 -6 \
    | age -R "$RECIPIENTS" > "$files_file.part"
mv "$files_file.part" "$files_file"

# Un fichier chiffré vide ou minuscule signale un dump raté.
for f in "$db_file" "$files_file"; do
    [ "$(stat -c %s "$f")" -gt 200 ] || { echo "Sauvegarde suspecte (trop petite) : $f" >&2; exit 1; }
done

if [ -n "${HB_BACKUP_RCLONE_REMOTE:-}" ]; then
    rclone copy --no-traverse "$db_file" "$HB_BACKUP_RCLONE_REMOTE/db/"
    rclone copy --no-traverse "$files_file" "$HB_BACKUP_RCLONE_REMOTE/files/"
fi

find "$DEST" -maxdepth 1 -type f \( -name 'db-*.age' -o -name 'files-*.age' \) -mtime +"$KEEP_DAYS" -delete
find "$DEST" -maxdepth 1 -type f -name '*.part' -mmin +120 -delete

echo "Sauvegarde HolisticBooks terminée : $(du -h "$db_file" | cut -f1) (base), $(du -h "$files_file" | cut -f1) (fichiers)."
