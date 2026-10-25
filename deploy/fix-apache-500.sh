#!/bin/bash
# Répare l'erreur Apache 500 (Passenger / .htaccess)
# Sur le serveur : bash ~/queenofex/deploy/fix-apache-500.sh
set -euo pipefail

APP="${HOME}/queenofex"
HTACCESS="${HOME}/public_html/.htaccess"

echo ""
echo "=== Diagnostic Apache / Passenger ==="
echo ""

# ── Node : préférer la version 18 (celle qui marchait) ──
NODE=""
for candidate in \
  "${HOME}/nodevenv/queenofex/18/bin/node" \
  "${HOME}/nodevenv/queenofex/20/bin/node" \
  "${HOME}/nodevenv/queenofexcellence/18/bin/node"
do
  if [ -x "$candidate" ]; then
    NODE="$candidate"
    break
  fi
done

if [ -z "$NODE" ]; then
  NODE="$(find "${HOME}/nodevenv" -path '*/queenofex/*/bin/node' -type f 2>/dev/null | head -1 || true)"
fi

echo "App root  : $APP"
echo "Htaccess  : $HTACCESS"
echo "Node      : ${NODE:-ABSENT}"
echo ".next     : $([ -f "$APP/.next/BUILD_ID" ] && echo OK || echo ABSENT)"
echo "server.js : $([ -f "$APP/server.js" ] && echo OK || echo ABSENT)"
echo ""

if [ -z "$NODE" ]; then
  echo "❌ Node introuvable."
  echo "   cPanel → Setup Node.js App → créer app (racine: queenofex)"
  find "${HOME}/nodevenv" -name node -type f 2>/dev/null | head -5 || true
  exit 1
fi

if [ ! -f "$APP/.next/BUILD_ID" ]; then
  echo "❌ .next absent — extrayez le zip :"
  echo "   cd ~ && unzip -o queenofex-deploy.zip -d ~/queenofex"
  exit 1
fi

# ── Sauvegarde .htaccess ──
if [ -f "$HTACCESS" ]; then
  cp "$HTACCESS" "${HTACCESS}.bak.$(date +%s)"
  echo "✓ Sauvegarde .htaccess créée"
fi

# ── Écrire .htaccess minimal (format CloudLinux LWS) ──
cat > "$HTACCESS" << EOF
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "${APP}"
PassengerBaseURI "/"
PassengerNodejs "${NODE}"
PassengerAppType node
PassengerStartupFile server.js
PassengerStartTimeout 300
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
EOF
chmod 644 "$HTACCESS"

echo ""
echo "✓ .htaccess réécrit :"
grep Passenger "$HTACCESS"
echo ""

# ── uploads ──
mkdir -p "$APP/public/uploads"
chmod 777 "$APP/public/uploads" 2>/dev/null || true

echo "╔══════════════════════════════════════════════════╗"
echo "║  MAINTENANT (cPanel) — obligatoire               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  1. Setup Node.js App"
echo "     - Racine application : queenofex"
echo "     - URL                : queenofexcellence.com"
echo "     - Fichier démarrage  : server.js"
echo "     - Mode               : Production"
echo "     - Variables d'env    : VIDE"
echo ""
echo "  2. Cliquez ENREGISTRER (cPanel peut réécrire .htaccess — c'est OK)"
echo ""
echo "  3. ARRÊTER → attendre 3 min → DÉMARRER"
echo ""
echo "  4. Test : curl -sI https://queenofexcellence.com | head -3"
echo ""
