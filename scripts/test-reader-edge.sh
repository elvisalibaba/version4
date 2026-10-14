#!/usr/bin/env bash
# Vérifie le contrôle d'accès de l'Edge Function holistic-reader-page (lecture seule).
#
# Variables requises :
#   HB_SUPABASE_URL, HB_SUPABASE_PUBLISHABLE_KEY   (valeurs publiques)
# Variables facultatives (compte lecteur SANS achat, jamais écrites sur disque) :
#   HB_TEST_EMAIL, HB_TEST_PASSWORD
#
# Usage : HB_SUPABASE_URL=… HB_SUPABASE_PUBLISHABLE_KEY=… bash scripts/test-reader-edge.sh
set -euo pipefail

: "${HB_SUPABASE_URL:?HB_SUPABASE_URL manquant}"
: "${HB_SUPABASE_PUBLISHABLE_KEY:?HB_SUPABASE_PUBLISHABLE_KEY manquant}"

PAID_BOOK="${HB_PAID_BOOK:-9bf7c453-f6c5-41b6-9b21-37d85876f724}"  # « Au-delà du temple », PDF 192 p., 5 $
FREE_BOOK="${HB_FREE_BOOK:-2f5b80e3-73c9-433f-8772-e99fb19a00b5}"  # « Rêvez, Osez, Créez ! », PDF 64 p., 0 $
FN="$HB_SUPABASE_URL/functions/v1/holistic-reader-page"
failures=0

status_of() { # $1 = livre, $2 = page, $3 = jeton (facultatif)
  local auth=()
  [[ -n "${3:-}" ]] && auth=(-H "Authorization: Bearer $3")
  curl -s -o /dev/null -w '%{http_code}' -H "apikey: $HB_SUPABASE_PUBLISHABLE_KEY" ${auth[@]+"${auth[@]}"} \
    "$FN?bookId=$1&page=$2"
}

check() { # $1 = libellé, $2 = attendu, $3 = obtenu
  if [[ "$2" == "$3" ]]; then echo "OK    $1 → $3"; else echo "ÉCHEC $1 → $3 (attendu $2)"; failures=$((failures + 1)); fi
}

echo "== Invité"
check "invité, livre payant, page 1"  200 "$(status_of "$PAID_BOOK" 1)"
check "invité, livre payant, page 11" 401 "$(status_of "$PAID_BOOK" 11)"
check "invité, livre gratuit, page 11" 401 "$(status_of "$FREE_BOOK" 11)"

if [[ -n "${HB_TEST_EMAIL:-}" && -n "${HB_TEST_PASSWORD:-}" ]]; then
  echo "== Compte connecté sans achat"
  token=$(curl -s -X POST "$HB_SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $HB_SUPABASE_PUBLISHABLE_KEY" -H "Content-Type: application/json" \
    -d "$(printf '{"email":"%s","password":"%s"}' "$HB_TEST_EMAIL" "$HB_TEST_PASSWORD")" \
    | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))')
  [[ -n "$token" ]] || { echo "Connexion du compte de test impossible"; exit 1; }
  check "connecté sans achat, livre payant, page 10" 200 "$(status_of "$PAID_BOOK" 10 "$token")"
  check "connecté sans achat, livre payant, page 11" 403 "$(status_of "$PAID_BOOK" 11 "$token")"
  check "connecté, livre gratuit, page 11"           200 "$(status_of "$FREE_BOOK" 11 "$token")"
  check "connecté, livre gratuit, page 64"           200 "$(status_of "$FREE_BOOK" 64 "$token")"
else
  echo "(tests connectés ignorés : HB_TEST_EMAIL / HB_TEST_PASSWORD absents)"
fi

exit "$failures"
