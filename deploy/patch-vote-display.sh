#!/bin/bash
# Affiche le nombre de votes sur les fiches candidates (sans redeploy zip)
# Usage : bash ~/queenofex/patch-vote-display.sh
set -euo pipefail

APP="${HOME}/queenofex"
cd "$APP"

echo "→ Recherche des fichiers compilés..."
FILES=$(grep -rl "Votes reçus" "$APP/.next/server/chunks" 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "❌ Fichier compilé introuvable dans .next/server/chunks"
  exit 1
fi

for FILE in $FILES; do
  echo "  Patch : $FILE"
  cp "$FILE" "${FILE}.bak.$(date +%s)"
  sed -i \
    -e 's/text-4xl text-gold",children:\([a-zA-Z_$][a-zA-Z0-9_$]*\)\.voteCount/text-4xl text-gold-dark tabular-nums",children:Number(\1.voteCount??0).toLocaleString("fr-FR")/g' \
    -e 's/text-2xl text-gold leading-none",children:\([a-zA-Z_$][a-zA-Z0-9_$]*\)\.voteCount/text-2xl text-gold-dark tabular-nums leading-none",children:Number(\1.voteCount??0).toLocaleString("fr-FR")/g' \
    "$FILE"
done

echo ""
echo "✓ Patch appliqué."
echo ""
echo "Maintenant : cPanel → Setup Node.js App → ARRÊTER → 2 min → DÉMARRER"
echo "Puis rechargez la fiche candidate (Ctrl+F5)."
