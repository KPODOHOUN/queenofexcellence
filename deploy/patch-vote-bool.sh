#!/bin/bash
# Fix affichage true/false au lieu du nombre de votes (sans redeploy zip)
# Cause : vote_count=1 converti en booléen true
# Usage : bash ~/queenofex/patch-vote-bool.sh
set -euo pipefail

APP="${HOME}/queenofex"
HELPERS=$(grep -rl "boolFromDb" "$APP/.next/server/chunks" 2>/dev/null | grep -v '\.map' | grep '\.js$' | head -3)

if [ -z "$HELPERS" ]; then
  echo "❌ helpers compilé introuvable"
  exit 1
fi

for FILE in $HELPERS; do
  echo "→ $FILE"
  cp "$FILE" "${FILE}.bak-vote"
  # Ne plus convertir vote_count en booléen
  sed -i 's/out\[camel\]=boolFromDb(value)/out[camel]=(key==="vote_count"||key==="number"||key==="order")?value:boolFromDb(value)/g' "$FILE" 2>/dev/null || true
done

# Fix affichage classement : true/false → nombre
for FILE in $(grep -rl "Votes reçus\|voteCount??0" "$APP/.next/server/chunks" 2>/dev/null | grep '\.js$' | grep -v '\.map'); do
  sed -i 's/(candidate\.voteCount??0)/(typeof candidate.voteCount==="boolean"?candidate.voteCount?1:0:Number(candidate.voteCount??0))/g' "$FILE" 2>/dev/null || true
  sed -i 's/(\([a-z]\)\.voteCount??0)/(typeof \1.voteCount==="boolean"?\1.voteCount?1:0:Number(\1.voteCount??0))/g' "$FILE" 2>/dev/null || true
done

echo ""
echo "✓ Patch terminé."
echo "cPanel → ARRÊTER → 2 min → DÉMARRER → Ctrl+F5"
