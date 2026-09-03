#!/bin/bash
# À lancer SUR LE SERVEUR LWS après extraction du zip
set -euo pipefail

echo "=== Installation Queen of Excellence (SQLite) ==="

export NODE_ENV=production
export DATABASE_URL="${DATABASE_URL:-file:./prisma/data.db}"

echo "→ DATABASE_URL = $DATABASE_URL"
echo "→ npm install (prod uniquement)..."
npm install --omit=dev --ignore-scripts --no-audit --no-fund

echo "→ Prisma generate..."
npx prisma generate

echo "→ Création / mise à jour de la base SQLite..."
npx prisma db push

echo "→ Données initiales (admin, contenu demo)..."
npx prisma db seed || echo "(seed ignoré si déjà fait)"

echo ""
echo "✓ Installation terminée !"
echo "  Variables cPanel : DATABASE_URL=file:./prisma/data.db"
echo "  Setup Node.js App → Restart → node server.js"
echo ""
