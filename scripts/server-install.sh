#!/bin/bash
# À lancer SUR LE SERVEUR LWS après extraction du zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "=== Installation Queen of Excellence (MySQL) ==="
echo "→ Dossier : $ROOT"

if [ ! -f "$ROOT/package.json" ]; then
  echo ""
  echo "❌ package.json introuvable dans $ROOT"
  echo "   Vérifiez que le zip est bien extrait dans ~/queenofex"
  echo "   (pas seulement dans un sous-dossier release/)"
  exit 1
fi

if [ ! -f "$ROOT/server.js" ]; then
  echo "❌ server.js introuvable — zip incomplet"
  exit 1
fi

if [ ! -d "$ROOT/.next" ]; then
  echo "❌ Dossier .next absent — le build doit être fait sur ton PC (npm run deploy:pack)"
  exit 1
fi

export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"

# Trouver npm (LWS : souvent hors PATH sans activate)
if command -v npm >/dev/null 2>&1; then
  NPM="npm"
else
  for candidate in \
    "${HOME}/nodevenv/queenofex/18/bin/npm" \
    "${HOME}/nodevenv/queenofex/20/bin/npm" \
    "${HOME}/nodevenv/queenofexcellence/18/bin/npm" \
    "${HOME}/nodevenv/queenofexcellence/20/bin/npm" \
    "/home/c2852916c/nodevenv/queenofex/18/bin/npm" \
    "/home/c2852916c/nodevenv/queenofex/20/bin/npm"
  do
    if [ -x "$candidate" ]; then
      NPM="$candidate"
      break
    fi
  done
fi

if [ -z "${NPM:-}" ]; then
  echo "❌ npm introuvable. Utilise le chemin complet depuis Setup Node.js App."
  exit 1
fi

echo "→ npm : $NPM"
echo "→ npm install (prod uniquement)..."
"$NPM" install --omit=dev --no-audit --no-fund

echo "→ Dossier uploads (images admin)..."
mkdir -p "$ROOT/public/uploads"
chmod 777 "$ROOT/public/uploads" 2>/dev/null || chmod 755 "$ROOT/public/uploads"

# LWS : Apache sert public_html/uploads — lien vers queenofex/public/uploads
PUBLIC_HTML="${HOME}/public_html/uploads"
if [ -d "${HOME}/public_html" ]; then
  if [ -d "$PUBLIC_HTML" ] && [ ! -L "$PUBLIC_HTML" ]; then
    echo "→ Fusion public_html/uploads (dossier existant) vers queenofex/public/uploads..."
    cp -an "$PUBLIC_HTML/." "$ROOT/public/uploads/" 2>/dev/null || true
    rm -rf "$PUBLIC_HTML"
  fi
  ln -sfn "$ROOT/public/uploads" "$PUBLIC_HTML"
  echo "✓ Lien : public_html/uploads → queenofex/public/uploads"
fi

if [ ! -f "$ROOT/src/lib/image-loader.ts" ]; then
  echo "❌ src/lib/image-loader.ts absent — zip incomplet, relancez npm run deploy:pack"
  exit 1
fi
echo "✓ image-loader.ts présent"

echo ""
echo "✓ Installation terminée !"
echo ""
echo "  1. Copier deploy/public_html.htaccess → ~/public_html/.htaccess"
echo "  2. Variables cPanel : DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, NODE_ENV"
echo "  3. phpMyAdmin : schema.mysql.sql + seed.mysql.sql"
echo "  4. Setup Node.js App → ARRÊTER 2 min → REDÉMARRER"
echo ""
