# Plan de réalignement de l'historique des migrations Supabase

> Préparé le 14/10/2026. **Rien n'est exécuté** : chaque commande marquée « écrit en prod » attend l'accord explicite du propriétaire.
> Projet : `wgsvzhhzsmioihjwcwcs` (ESS).

## Le problème

| | Contenu |
|---|---|
| **Historique distant** (`supabase_migrations.schema_migrations`) | 11 versions du 13/10/2026, appliquées depuis le tableau de bord ou le MCP. Aucune n'a de fichier local du même nom. |
| **Fichiers locaux** (`supabase/migrations/`) | 42 fichiers : `0001_…` à `0032_…` (appliqués à la main via l'éditeur SQL, non enregistrés), 9 fichiers `20261013_xxxx_…` et la baseline `20261014_0900_…`. |
| **Lecture par la CLI** | La CLI prend comme version tout ce qui précède le premier `_`. Les 9 fichiers `20261013_…` ont donc **la même version `20261013`**, et la baseline la version `20261014`. Un `supabase db push` échouerait ou rejouerait des migrations déjà appliquées. |

## La cible

Une seule migration de référence, la baseline du 14/10/2026, marquée « appliquée ». Tout ce qui précède est archivé : la baseline en décrit déjà l'effet complet. Les migrations suivantes portent un horodatage complet `AAAAMMJJHHMMSS`.

```
supabase/migrations/
  20261014090000_baseline_schema.sql          ← « applied » en prod (aucune exécution)
  20261014100000_security_hardening.sql       ← plus tard, après accord (aujourd'hui dans pending/)
supabase/migrations_archive/                  ← historique, ignoré par la CLI
  0001_initial.sql … 0032_professional_author_profiles.sql
  20261013_1200_… … 20261013_secure_payments_server_owned_orders.sql
```

## Étape 1 — Renommage local (sans effet sur la prod)

```bash
mkdir -p supabase/migrations_archive
git mv supabase/migrations/0*.sql supabase/migrations_archive/
git mv supabase/migrations/20261013_*.sql supabase/migrations_archive/
git mv supabase/migrations/20261014_0900_baseline_schema.sql \
       supabase/migrations/20261014090000_baseline_schema.sql
```

Un fichier `supabase/migrations_archive/README.md` expliquera que ces fichiers sont l'historique d'avant la baseline et ne doivent jamais être rejoués.

## Étape 2 — Contrôle avant réparation (lecture seule)

```bash
supabase migration list --linked
```

Résultat attendu : 11 versions présentes **seulement à distance**, et `20261014090000` présente **seulement en local**.

## Étape 3 — Réparation de l'historique distant (⚠️ écrit en prod, accord requis)

`migration repair` ne modifie **que** la table `supabase_migrations.schema_migrations`. Aucun SQL de migration n'est exécuté, aucune donnée ni aucun schéma applicatif n'est touché.

```bash
# 3a. Retirer de l'historique les 11 versions sans fichier local
supabase migration repair --linked --status reverted \
  20261013115238 20261013121518 20261013121807 20261013121914 20261013125855 \
  20261013130616 20261013130931 20261013142744 20261013143708 20261013160932 \
  20261013163448

# 3b. Enregistrer la baseline comme appliquée (sans l'exécuter)
supabase migration repair --linked --status applied 20261014090000
```

Les 11 versions retirées, pour mémoire (nom enregistré) :

| Version | Nom |
|---|---|
| 20261013115238 | secure_profile_role_against_self_escalation_20261013 |
| 20261013121518 | holisticbooks_catalog_academic_editorial_parity |
| 20261013121807 | holisticbooks_laravel_business_parity |
| 20261013121914 | holisticbooks_harden_book_storage_entitlements |
| 20261013125855 | holisticbooks_rdc_education_catalog_seed_v2 |
| 20261013130616 | holisticbooks_academic_editor_and_avatar |
| 20261013130931 | holisticbooks_profile_backfill_and_internal_rpc_grants |
| 20261013142744 | holisticbooks_admin_editorial_transitions_20261013 |
| 20261013143708 | holisticbooks_editorial_event_admin_insert_policy |
| 20261013160932 | holisticbooks_reviews_favorites_secure_20261013 |
| 20261013163448 | holisticbooks_payment_state_server_owned_20261013 |

## Étape 4 — Vérification (lecture seule)

```bash
supabase migration list --linked      # attendu : 20261014090000 en local ET à distance, rien d'autre
supabase db push --linked --dry-run   # attendu : « Remote database is up to date »
```

## Retour arrière (si besoin)

```bash
supabase migration repair --linked --status reverted 20261014090000
supabase migration repair --linked --status applied \
  20261013115238 20261013121518 20261013121807 20261013121914 20261013125855 \
  20261013130616 20261013130931 20261013142744 20261013143708 20261013160932 \
  20261013163448
```

La colonne `name` des 11 versions sera vide après un retour arrière, car leurs fichiers n'existent pas en local. Les noms sont conservés dans le tableau ci-dessus.

## Ensuite

La migration de sécurité passera de `supabase/pending/` à `supabase/migrations/20261014100000_security_hardening.sql`, puis sera appliquée par `supabase db push --linked` après ton accord. Elle sera ainsi enregistrée normalement dans l'historique.
