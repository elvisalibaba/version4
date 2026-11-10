# syntax=docker/dockerfile:1.7
#
# Front Next.js de HolisticBooks pour le VPS (contexte : racine du dépôt).
#
# Les variables NEXT_PUBLIC_* sont figées dans le code au moment du build : on
# construit donc une image par environnement (noms de test, puis production).
# Les secrets (SMTP, FRONTEND_PROXY_SECRET, EasyPay) ne sont lus qu'au
# démarrage, depuis env/web.env sur le serveur.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ANDROID_APK_URL=""
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_ANDROID_APK_URL=${NEXT_PUBLIC_ANDROID_APK_URL} \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_APP_URL" && test -n "$NEXT_PUBLIC_API_URL"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/home || exit 1
CMD ["node", "server.js"]
