#!/bin/bash
# Diagnostic + fix déploiement LWS — Queen of Excellence
# Usage sur le serveur : bash ~/queenofex/deploy/fix-lws.sh
set -euo pipefail

APP_ROOT="${HOME}/queenofex"
HTACCESS="${HOME}/public_html/.htaccess"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Queen of Excellence — Fix déploiement LWS  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# --- Trouver Node ---
NODE=""
for candidate in \
  "${HOME}/nodevenv/queenofex/20/bin/node" \
  "${HOME}/nodevenv/queenofex/18/bin/node" \
  "${HOME}/nodevenv/queenofexcellence/20/bin/node" \
  "${HOME}/nodevenv/queenofexcellence/18/bin/node"
do
  if [ -x "$candidate" ]; then
    NODE="$candidate"
    break
  fi
done

if [ -z "$NODE" ]; then
  echo "❌ Node introuvable. Créez l'app dans Setup Node.js App (racine: queenofex)"
  find "${HOME}/nodevenv" -name node -type f 2>/dev/null | head -5
  exit 1
fi

echo "✓ Node : $NODE"
"$NODE" --version

# --- Vérifier fichiers ---
if [ ! -d "$APP_ROOT/.next" ]; then
  echo "❌ $APP_ROOT/.next absent — extrayez queenofex-deploy.zip dans ~/queenofex"
  exit 1
fi
echo "✓ .next : $(du -sh "$APP_ROOT/.next" | cut -f1)"

if [ ! -f "$APP_ROOT/.env" ] || [ ! -s "$APP_ROOT/.env" ]; then
  echo "❌ .env absent ou vide"
  exit 1
fi
echo "✓ .env : $(wc -c < "$APP_ROOT/.env") octets"

if [ ! -f "$APP_ROOT/server.js" ]; then
  echo "❌ server.js absent"
  exit 1
fi
echo "✓ server.js présent"

# --- npm install ---
NPM="$(dirname "$NODE")/npm"
echo ""
echo "→ npm install..."
cd "$APP_ROOT"
"$NPM" install --omit=dev --no-audit --no-fund 2>&1 | tail -3

# --- .htaccess ---
echo ""
echo "→ Écriture $HTACCESS"
cat > "$HTACCESS" << EOF
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "${APP_ROOT}"
PassengerBaseURI "/"
PassengerNodejs "${NODE}"
PassengerAppType node
PassengerStartupFile server.js
PassengerStartTimeout 300
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
EOF
chmod 644 "$HTACCESS"
echo "✓ .htaccess :"
grep Passenger "$HTACCESS"

# --- Test démarrage (5 s) ---
echo ""
echo "→ Test démarrage Next.js (5 s)..."
timeout 8 "$NODE" server.js &
PID=$!
sleep 6
if kill -0 "$PID" 2>/dev/null; then
  echo "✓ Next.js démarre correctement"
  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
else
  echo "⚠ Vérifiez startup-error.log :"
  cat "$APP_ROOT/startup-error.log" 2>/dev/null || true
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   DERNIÈRE ÉTAPE (cPanel)                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  1. Setup Node.js App → racine: queenofex"
echo "  2. Mode: Production | Démarrage: server.js"
echo "  3. ARRÊTER → attendre 2 min → DÉMARRER"
echo ""
echo "  Puis testez : https://queenofexcellence.com"
echo "  Santé DB    : https://queenofexcellence.com/api/health/db"
echo "  Admin       : https://queenofexcellence.com/admin/login"
echo ""
