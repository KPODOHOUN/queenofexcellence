#!/bin/bash
# ============================================================
#  DÉPLOIEMENT LWS — à lancer sur TON PC
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

echo "→ Tests votes (camelKeys)..."
npx vitest run tests/db-helpers.test.ts

echo "→ Build Next.js (1–3 min sur ton PC)..."
NODE_ENV=production npm run build

echo "→ Vérification fix votes dans le build..."
if ! grep -rl 'r\.has(n)?i:0!==(a=i)' .next/server/chunks --include='*.js' 2>/dev/null | grep -v '\.map' | grep -q .; then
  echo "❌ Le build ne contient pas le fix vote_count/number (camelKeys)."
  echo "   Vérifiez src/lib/db/helpers.ts puis relancez npm run deploy:pack"
  exit 1
fi
echo "  ✓ camelKeys OK"

echo "→ Préparation du dossier release/..."
rm -rf release queenofex-deploy.zip
mkdir -p release

cp -R .next public database deploy release/
mkdir -p release/public/uploads
touch release/public/uploads/.gitkeep
# Cache et artefacts dev inutiles en production (~1 Go en moins)
rm -rf release/.next/dev release/.next/cache release/.next/diagnostics release/.next/trace 2>/dev/null || true
cp package.json package-lock.json next.config.ts server.js release/
mkdir -p release/src/lib
cp src/lib/image-loader.ts release/src/lib/image-loader.ts
cp deploy/LISEZMOI.txt release/LISEZMOI.txt
cp deploy/lws-boot.sh release/lws-boot.sh
cp deploy/fix-apache-500.sh release/fix-apache-500.sh
cp deploy/apply-migrations.sh release/apply-migrations.sh
cp deploy/fix-uploads.sh release/fix-uploads.sh
cp deploy/check-kkiapay.sh release/check-kkiapay.sh
cp deploy/install-deps.sh release/install-deps.sh
cp scripts/server-install.sh release/install.sh
mkdir -p release/scripts
cp scripts/diagnose-db.js release/scripts/diagnose-db.js
chmod +x release/install.sh

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
echo "  Sur le serveur LWS :"
echo "    1. Node.js → ARRÊTER"
echo "    2. Uploader queenofex-deploy.zip dans ~/"
echo "    3. cd ~ && unzip -o queenofex-deploy.zip -d ~/queenofex"
echo "    4. bash ~/queenofex/install.sh"
echo "    5. Node.js → DÉMARRER + Purger Fastest Cache"
echo ""
