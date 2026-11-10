# syntax=docker/dockerfile:1.7
#
# API Laravel de HolisticBooks pour le VPS (contexte de build : racine du dépôt).
#
#   --target app    → PHP-FPM (API, Filament, worker, planificateur)
#   --target nginx  → nginx servant backend/public et relayant le PHP vers `app`
#   --target test   → image de test (dépendances de développement, SQLite)
#
# Les secrets ne sont jamais copiés dans l'image : ils arrivent au démarrage par
# les variables d'environnement (env/api.env sur le serveur).

ARG PHP_VERSION=8.3
ARG NODE_VERSION=22
ARG NGINX_VERSION=1.27

############################
# Base PHP commune
############################
FROM php:${PHP_VERSION}-fpm-bookworm AS php-base

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        libicu-dev libzip-dev unzip \
        libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev \
        poppler-utils \
        default-mysql-client \
        ca-certificates; \
    docker-php-ext-configure gd --with-jpeg --with-webp --with-freetype; \
    docker-php-ext-install -j"$(nproc)" intl zip pdo_mysql opcache pcntl bcmath gd; \
    apt-get purge -y --auto-remove libicu-dev libzip-dev libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev; \
    apt-get install -y --no-install-recommends libicu72 libzip4 libpng16-16 libjpeg62-turbo libwebp7 libfreetype6; \
    rm -rf /var/lib/apt/lists/*

COPY deploy/docker/php/php.ini /usr/local/etc/php/conf.d/zz-holisticbooks.ini
COPY deploy/docker/php/www.conf /usr/local/etc/php-fpm.d/zz-holisticbooks.conf
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

############################
# Dépendances PHP de production
############################
FROM php-base AS vendor

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --no-scripts --no-autoloader

COPY backend/ ./
RUN composer dump-autoload --no-dev --optimize --no-scripts

############################
# Ressources front de Laravel (Vite, thèmes Filament)
############################
FROM node:${NODE_VERSION}-alpine AS assets

WORKDIR /var/www/html
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY backend/ ./
# Les thèmes Filament importent les feuilles de style de vendor/filament.
COPY --from=vendor /var/www/html/vendor ./vendor
RUN npm run build

############################
# Image de test (CI locale et vérifications)
############################
FROM php-base AS test

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-interaction --no-progress --prefer-dist --no-scripts --no-autoloader
COPY backend/ ./
RUN composer dump-autoload --optimize --no-scripts \
    && cp .env.example .env \
    && php artisan package:discover --ansi \
    && php artisan key:generate --force
CMD ["php", "artisan", "test"]

############################
# Image PHP-FPM de production
############################
FROM php-base AS app

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

COPY --from=vendor --chown=www-data:www-data /var/www/html /var/www/html
COPY --from=assets --chown=www-data:www-data /var/www/html/public/build /var/www/html/public/build
COPY --chmod=755 deploy/docker/php/entrypoint.sh /usr/local/bin/holisticbooks-entrypoint
# Fichiers d'exploitation du VPS, récupérés par deploy.sh à chaque déploiement.
COPY deploy/vps /usr/share/holisticbooks/deploy-vps

RUN set -eux; \
    rm -rf .env tests phpunit.xml node_modules; \
    php artisan package:discover --ansi; \
    mkdir -p storage/app/private/books storage/app/public storage/framework/cache/data \
             storage/framework/sessions storage/framework/views storage/logs bootstrap/cache; \
    chown -R www-data:www-data storage bootstrap/cache

USER www-data
ENTRYPOINT ["holisticbooks-entrypoint"]
CMD ["php-fpm", "--nodaemonize"]

############################
# nginx : fichiers publics + relais FastCGI
############################
FROM nginx:${NGINX_VERSION}-alpine AS nginx

COPY deploy/docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=app /var/www/html/public /var/www/html/public
RUN rm -f /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/nginx-health || exit 1
