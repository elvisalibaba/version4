# Projet Supabase abandonné

**Date :** 10 novembre 2026.

Le projet Supabase utilisé pendant la période d'essai (`wgsvzhhzsmioihjwcwcs.supabase.co`)
ne contenait que des essais, sans données réelles. Il est mis en pause, puis supprimé.

## Conséquences pour le site

- Le site (`origin/main`) n'utilise plus Supabase : toutes les données et l'authentification
  passent par l'API Laravel (`API_URL` / `NEXT_PUBLIC_API_URL`).
- **Aucune variable Supabase n'est attendue** par le front ni par l'API :
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `NEXT_PUBLIC_HOLISTIC_SUPABASE_URL`, `HOLISTIC_DATA_SOURCE` et `SUPABASE_SERVICE_ROLE_KEY`
  ne doivent plus être renseignées, ni sur le VPS, ni chez un hébergeur.
- Le test de fumée `scripts/check-guest-preview.mjs`, qui interrogeait une fonction de ce
  projet, est retiré de la CI.

## Ce qui reste volontairement en place

- `supabase/` (migrations, diagnostics, scripts) et les documents d'audit
  `docs/DEV-ANCIEN-SUPABASE-REPRISE.md`, `docs/supabase-migration-repair-plan.md`,
  `docs/supabase-security-baseline.md` : archives historiques, sans effet sur le déploiement.
- `mobile/` : l'application Flutter s'appuie encore sur un projet Supabase fourni au build
  (`--dart-define=SUPABASE_URL=…`, voir `mobile/lib/main.dart` et
  `mobile/lib/src/core/config/app_config.dart`). Elle sera branchée sur l'API Laravel dans un
  chantier séparé.

## Secrets

Les clés de ce projet publiées par erreur dans l'historique Git (`.env.local`, `.env.example`)
ont été invalidées avec la suppression du projet. Aucune clé ne doit être recopiée dans le dépôt.
