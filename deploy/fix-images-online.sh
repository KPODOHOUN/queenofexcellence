#!/bin/bash
# Images plus rapides — 100 % terminal cPanel, SANS redeploy zip
# Usage : bash fix-images-online.sh
# (collez ce fichier entier dans le terminal, ou : bash ~/queenofex/fix-images-online.sh)
set -euo pipefail

APP="${HOME}/queenofex"
SERVER="${APP}/server.js"
UPLOADS="${APP}/public/uploads"
WEB="${HOME}/public_html/uploads"
NODE="${HOME}/nodevenv/queenofex/18/bin/node"
command -v "$NODE" >/dev/null 2>&1 || NODE="$(command -v node)"

echo "=== Fix images en ligne (sans redeploy) ==="

mkdir -p "$UPLOADS"
cat > "${UPLOADS}/.htaccess" << 'HTACCESS'
<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable"
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
</IfModule>
HTACCESS
chmod 644 "${UPLOADS}/.htaccess" 2>/dev/null || true
echo "✓ Cache Apache 1 an sur /uploads/"

rm -rf "$WEB"
ln -sfn "$UPLOADS" "$WEB"
echo "✓ Symlink public_html/uploads OK"

if [ ! -f "$SERVER" ]; then
  echo "✗ server.js introuvable : $SERVER"
  exit 1
fi

cp "$SERVER" "${SERVER}.bak-images-$(date +%Y%m%d%H%M%S)"

"$NODE" << 'NODEPATCH'
const fs = require("fs");
const serverPath = process.env.HOME + "/queenofex/server.js";
let s = fs.readFileSync(serverPath, "utf8");

s = s.replace(/max-age=86400/g, "max-age=31536000, immutable");

const FN = `function tryServeNextImageUpload(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname || "";
  if (pathname !== "/_next/image") return false;
  const src = parsedUrl.query?.url;
  if (typeof src !== "string" || !src.startsWith("/uploads/")) return false;
  return tryServeUpload(req, res, src);
}`;

if (!s.includes("tryServeNextImageUpload")) {
  const inserted = s.replace(
    /(function tryServeUpload[\s\S]*?\n\})\n+(\/\/ ── \.env)/,
    `$1\n\n${FN}\n\n$2`
  );
  if (inserted === s) {
    console.error("✗ Impossible de patcher server.js — structure inattendue");
    process.exit(1);
  }
  s = inserted;

  if (!s.includes("if (tryServeNextImageUpload(req, res, parsedUrl)) return;")) {
    s = s.replace(
      "if (tryServeUpload(req, res, pathname)) return;\n    await handle(req, res, parsedUrl);",
      "if (tryServeUpload(req, res, pathname)) return;\n    if (tryServeNextImageUpload(req, res, parsedUrl)) return;\n    await handle(req, res, parsedUrl);"
    );
  }
  fs.writeFileSync(serverPath, s);
  console.log("✓ server.js patché — /_next/image?url=/uploads/… servi en direct");
} else {
  console.log("ℹ server.js déjà patché");
}
NODEPATCH

"$NODE" --check "$SERVER"
echo "✓ Syntaxe server.js OK"

echo ""
echo "=== Terminé ==="
echo "→ cPanel : Setup Node.js → ARRÊTER → 2 min → DÉMARRER"
echo "→ Ctrl+F5 sur le site"
FILE="$(ls "$UPLOADS" 2>/dev/null | grep -E '\.(jpg|jpeg|png|webp|gif)$' | head -1 || true)"
if [ -n "$FILE" ]; then
  echo ""
  echo "Test : https://queenofexcellence.com/_next/image?url=%2Fuploads%2F${FILE}&w=640&q=75"
fi
