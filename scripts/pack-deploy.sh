#!/bin/bash
# ============================================================
#  DÉPLOIEMENT SIMPLE LWS — à lancer sur TON PC
#  Usage : npm run deploy:pack
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Queen of Excellence — Préparation deploy   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Charger .env.local si présent, sinon SQLite par défaut
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
  echo "✓ Variables chargées depuis .env.local"
fi

export DATABASE_URL="${DATABASE_URL:-file:./prisma/data.db}"
echo "→ Base de données : $DATABASE_URL"

echo "→ Installation des dépendances (incl. build)..."
npm install --no-audit --no-fund

echo "→ Build Next.js (1–3 min sur ton PC)..."
NODE_ENV=production npm run build

echo "→ Préparation du dossier release/..."
rm -rf release queenofex-deploy.zip
mkdir -p release

# Fichiers nécessaires sur le serveur (PAS de build sur LWS)
cp -R .next public prisma release/
cp package.json package-lock.json next.config.ts server.js release/
cp scripts/server-install.sh release/install.sh
chmod +x release/install.sh

# Guide rapide inclus dans le zip
cat > release/LISEZMOI.txt << 'EOF'
DÉPLOIEMENT LWS — 4 ÉTAPES
==========================

1. UPLOAD
   - Extraire ce zip dans public_html/ (via Gestionnaire de fichiers cPanel)

2. VARIABLES (cPanel → Variables d'environnement)
   DATABASE_URL = file:./prisma/data.db
   AUTH_SECRET  = (openssl rand -base64 32)
   NEXTAUTH_URL = https://queenofexcellence.com
   NODE_ENV     = production

3. INSTALLATION (cPanel → Terminal)
   cd ~/public_html
   bash install.sh

4. NODE.JS APP (cPanel → Setup Node.js App)
   - Racine : public_html
   - Commande : node server.js
   - Cliquer "Restart"

C'est tout ! Pas besoin de GitHub.
EOF

echo "→ Création de queenofex-deploy.zip..."
(cd release && zip -r -q ../queenofex-deploy.zip .)
SIZE=$(du -h queenofex-deploy.zip | cut -f1)

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║              ✓ PRÊT À ENVOYER                ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Fichier : queenofex-deploy.zip ($SIZE)"
echo ""
echo "  Prochaines étapes :"
echo "  1. cPanel LWS → Gestionnaire de fichiers → public_html"
echo "  2. Upload queenofex-deploy.zip → Extraire"
echo "  3. cPanel → Terminal → cd public_html && bash install.sh"
echo "  4. cPanel → Setup Node.js App → node server.js → Restart"
echo ""
