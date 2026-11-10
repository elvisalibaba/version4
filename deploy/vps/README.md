# HolisticBooks sur le VPS (Docker Compose)

Hébergement du front Next.js et de l'API Laravel sur le VPS Hostinger (`srv1563126`), à côté
d'Ibala Pay. Les images sont construites par GitHub Actions (`.github/workflows/vps-images.yml`)
et publiées sur GHCR en privé ; **rien n'est compilé sur le serveur**.

## Architecture

```
Visiteur ─► Cloudflare (proxy, SSL « Full (strict) »)
              │  certificat d'origine Cloudflare
              ▼
      Caddy d'Ibala Pay (port 443) ── import /etc/caddy/sites.d/*.caddy
              │ réseau Docker « shared-edge »
      ┌───────┴────────┐
   hb-web:3000      hb-nginx:80 ──► app:9000 (PHP-FPM) ──► db (MySQL 8.4, réseau interne)
   (Next.js)        (Laravel)       worker (queue:work)
                                    scheduler (schedule:work)
```

- Aucun port n'est publié par HolisticBooks ; MySQL n'est joignable que par les conteneurs PHP.
- Les connexions qui ne viennent pas de Cloudflare sont refusées par Caddy (403).
- Envois limités à 50 Mo (Laravel `UPLOAD_MAX_KILOBYTES=51200`, PHP et nginx 55 Mo).

## Fichiers sur le serveur

| Chemin | Rôle |
|---|---|
| `/opt/holisticbooks/compose.yaml` | Services (copié depuis l'image à chaque déploiement) |
| `/opt/holisticbooks/.env` | Noms d'hôtes et commit déployé (aucun secret) |
| `/opt/holisticbooks/env/{api,web,db}.env` | Secrets et réglages, droits 600 |
| `/opt/holisticbooks/deploy.sh` | Déploiement, retour arrière, Caddy |
| `/opt/holisticbooks/backup.sh` + `hb-backup.timer` | Sauvegarde quotidienne chiffrée |
| `/opt/edge-sites/holisticbooks.caddy` | Sites Caddy générés (ne pas modifier à la main) |
| `/opt/edge-sites/certs/holisticbooks/` | Certificats d'origine Cloudflare (`<zone>.pem` / `<zone>.key`) |

## Déployer une nouvelle version

1. Fusionner dans `main` (ou pousser sur `deploy/vps-docker`) : le workflow **VPS images**
   teste Laravel, puis publie `holisticbooks-api`, `holisticbooks-nginx` et
   `holisticbooks-web:{test,prod}-<sha>`.
2. Sur le serveur, en root :
   ```bash
   cd /opt/holisticbooks && ./deploy.sh <sha complet du commit>
   ```
   Le script télécharge les images, applique les migrations, redémarre les conteneurs,
   vérifie `/api/v1/health` et recharge Caddy (après `caddy validate`).
3. Retour à la version précédente : `./deploy.sh rollback` (les migrations ne sont pas annulées).

`HB_WEB_ENV` (`test` ou `prod`) dans `/opt/holisticbooks/.env` choisit l'image du front.

## Journaux

```bash
cd /opt/holisticbooks
docker compose logs -f --tail=100 app        # PHP-FPM / Laravel (LOG_CHANNEL=stderr)
docker compose logs -f --tail=100 worker     # file d'attente
docker compose logs -f --tail=100 scheduler  # tâches planifiées
docker compose logs -f --tail=100 nginx web db
tail -n 50 /var/log/holisticbooks-deploy.log # déploiements
journalctl -u hb-backup                      # sauvegardes
```

## Commandes utiles

```bash
docker compose exec app php artisan holistic:health
docker compose exec app php artisan holistic:make-admin <email>   # mot de passe saisi au clavier
docker compose exec app php artisan holistic:test-mail <destinataire>
./deploy.sh status
```

## Sauvegardes

`hb-backup.timer` (03:45, heure de Kinshasa) produit dans `/var/backups/holisticbooks` un dump
MySQL et une archive des fichiers envoyés (sans le cache des pages du lecteur), chiffrés avec
`age` vers les clés publiques de `/opt/holisticbooks/backup/age-recipients.txt`. Conservation :
14 jours. Copie hors serveur si `HB_BACKUP_RCLONE_REMOTE` est défini dans `.env`.

Restauration (sur un poste qui détient la clé privée) :
```bash
age -d -i cle.txt db-<date>.sql.zst.age | zstd -d | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot'
```

## Envoi de gros fichiers (prévu, non activé)

Cloudflare limite le corps des requêtes à 100 Mo sur les offres Free/Pro. Pour accepter plus
de 50 Mo, il faudra une adresse d'administration **hors proxy** (nuage gris, par exemple
`upload-admin.aba.cd`) servie par un certificat public (Let's Encrypt par défi TLS-ALPN, que le
Caddy partagé sait déjà obtenir), restreinte à `/admin` et `/livewire`, puis relever ensemble
`UPLOAD_MAX_KILOBYTES`, `upload_max_filesize`/`post_max_size` (php.ini),
`client_max_body_size` (nginx) et `request_body max_size` (Caddy).
