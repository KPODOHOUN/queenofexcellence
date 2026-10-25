#!/bin/bash
# Fix votes true/false en production (sans redeploy zip)
# Cause : vote_count / number convertis en booléens MySQL 0/1
#
# Usage cPanel :
#   1. cPanel → Node.js → ARRÊTER l'app
#   2. Attendre 2-3 min (éviter "fork: Resource temporarily unavailable")
#   3. bash ~/queenofex/deploy/fix-votes-prod.sh
#   4. cPanel → Node.js → DÉMARRER
#   5. Fastest Cache → Purger le cache
#   6. Test curl ci-dessous
set -eu

APP="${HOME}/queenofex"
CHUNKS="${APP}/.next/server/chunks"

if [ ! -d "$CHUNKS" ]; then
  echo "❌ Dossier .next/server/chunks introuvable dans $APP"
  exit 1
fi

echo "=== 1/3 — Route API /api/public/candidates ==="
# IMPORTANT : ce n'est PAS le fichier findPublicCandidates seul (_0qxvc4c).
# C'est le chunk qui contient return t.NextResponse.json(c) après api.candidates.
API_FILE=""
while IFS= read -r F; do
  if grep -q 'return t\.NextResponse\.json(c)' "$F" 2>/dev/null; then
    API_FILE="$F"
    break
  fi
done < <(grep -rl 'api\.candidates' "$CHUNKS" --include='*.js' 2>/dev/null | grep -v '\.map')

if [ -z "$API_FILE" ]; then
  echo "⚠ Chunk API introuvable (pattern return t.NextResponse.json(c))"
  echo "  Recherche manuelle :"
  echo "  grep -rl 'return t.NextResponse.json(c)' $CHUNKS --include='*.js' | grep -v map"
else
  echo "→ $API_FILE"
  if grep -q 'c=c.map(function(x)' "$API_FILE"; then
    echo "  ✓ déjà patché"
  else
    cp "$API_FILE" "${API_FILE}.bak-votes-$(date +%Y%m%d%H%M%S)"
    sed -i 's/return t\.NextResponse\.json(c)/c=c.map(function(x){return x\&\&typeof x==="object"?(typeof x.voteCount==="boolean"\&\&(x.voteCount=x.voteCount?1:0),typeof x.number==="boolean"\&\&(x.number=x.number?1:0),x):x});return t.NextResponse.json(c)/' "$API_FILE"
    if grep -q 'c=c.map(function(x)' "$API_FILE"; then
      echo "  ✓ patch API appliqué"
    else
      echo "  ❌ sed API n'a pas matché — voir le fichier manuellement"
    fi
  fi
fi

echo ""
echo "=== 2/3 — helpers camelKeys (pages SSR + classement) ==="
HELPER_COUNT=0
while IFS= read -r F; do
  [ -f "$F" ] || continue
  if grep -q 'r\.has(n)?i:0!==(a=i)' "$F" 2>/dev/null; then
    continue
  fi
  if ! grep -q '0!==(a=i)&&(1===a||a)' "$F" 2>/dev/null; then
    continue
  fi
  cp "$F" "${F}.bak-votes-$(date +%Y%m%d%H%M%S)"
  if ! grep -q 'candidate_count' "$F" 2>/dev/null; then
    sed -i 's/function a(e){if(!e)return null;let t={};/const r=new Set(["vote_count","number","order","vote_price","amount","price","quantity","stock","max_uses","candidate_count"]);function a(e){if(!e)return null;let t={};/' "$F" 2>/dev/null || true
  fi
  sed -i 's/\]=0!==(a=i)&&(1===a||a)/]=r.has(n)?i:0!==(a=i)\&\&(1===a||a)/g' "$F"
  if grep -q 'r.has(n)?i:0!==(a=i)' "$F"; then
    echo "  ✓ $F"
    HELPER_COUNT=$((HELPER_COUNT + 1))
  fi
done < <(grep -rl '0!==(a=i)&&(1===a||a)' "$CHUNKS" --include='*.js' 2>/dev/null | grep -v '\.map')

# Ancien build avec boolFromDb explicite
while IFS= read -r F; do
  [ -f "$F" ] || continue
  if grep -q 'out\[camel\]=boolFromDb(value)' "$F" 2>/dev/null; then
    cp "$F" "${F}.bak-votebool-$(date +%Y%m%d%H%M%S)"
    sed -i 's/out\[camel\]=boolFromDb(value)/out[camel]=(key==="vote_count"||key==="number"||key==="order")?value:boolFromDb(value)/g' "$F"
    echo "  ✓ boolFromDb: $F"
    HELPER_COUNT=$((HELPER_COUNT + 1))
  fi
done < <(grep -rl 'boolFromDb' "$CHUNKS" --include='*.js' 2>/dev/null | grep -v '\.map')

if [ "$HELPER_COUNT" -eq 0 ]; then
  echo "  ℹ Aucun helper à patcher (déjà corrigé ou pattern différent)"
fi

echo ""
echo "=== 3/3 — server.js (pages HTML/RSC uniquement, pas l'API JSON) ==="
SERVER="${APP}/server.js"
if grep -q 'installResponseVoteFix' "$SERVER" 2>/dev/null; then
  N=$(grep -c 'installResponseVoteFix' "$SERVER" || true)
  echo "  ℹ installResponseVoteFix présent ($N occurrence(s))"
  if [ "$N" -lt 2 ]; then
    echo "  ⚠ Il manque probablement l'appel installResponseVoteFix(res) — voir deploy/patch-votes-response.sh"
  fi
else
  echo "  ⚠ server.js sans fix réponse — optionnel pour la page événement"
  echo "    bash ${APP}/deploy/patch-votes-response.sh"
fi

if command -v node >/dev/null 2>&1; then
  node --check "$SERVER" && echo "  ✓ server.js syntaxe OK"
fi

echo ""
echo "=== Terminé ==="
echo "→ DÉMARRER Node.js dans cPanel"
echo "→ Purger Fastest Cache"
echo ""
echo "Test :"
echo "  curl -s 'https://queenofexcellence.com/api/public/candidates?eventSlug=gala-ifsio' | tr ',' '\\n' | grep -E 'AMIDOU|voteCount|number' | head -8"
echo ""
echo "Attendu pour AMIDOU Raissa : \"voteCount\":1 et \"number\":1 (pas true/false)"
