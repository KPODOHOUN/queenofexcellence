#!/bin/bash
# Installe node_modules sur LWS (fix "Cannot find module 'next'")
# Usage : bash ~/queenofex/install-deps.sh
set -euo pipefail

APP="${HOME}/queenofex"
cd "$APP"

NPM=""
for candidate in \
  "${HOME}/nodevenv/queenofex/18/bin/npm" \
  "${HOME}/nodevenv/queenofex/20/bin/npm" \
  "${HOME}/nodevenv/queenofexcellence/18/bin/npm"
do
  if [ -x "$candidate" ]; then
    NPM="$candidate"
    break
  fi
done

if [ -z "$NPM" ]; then
  echo "❌ npm introuvable."
  echo "   cPanel → Setup Node.js App → bouton « Run NPM Install »"
  exit 1
fi

echo "→ npm : $NPM"
echo "→ Installation des dépendances (2–5 min)..."
export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"
"$NPM" install --omit=dev --no-audit --no-fund

if [ -f "$APP/node_modules/next/package.json" ]; then
  echo ""
  echo "✓ next installé : $(node -p "require('$APP/node_modules/next/package.json').version" 2>/dev/null || echo OK)"
  echo ""
  echo "Maintenant : cPanel → Setup Node.js App → ARRÊTER → 2 min → DÉMARRER"
  echo "Puis test  : curl -s https://queenofexcellence.com/api/health/db"
else
  echo "❌ Échec — node_modules/next toujours absent"
  exit 1
fi
