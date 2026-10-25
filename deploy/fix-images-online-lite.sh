#!/bin/bash
# Fix images — SANS node (évite "fork: Resource temporarily unavailable")
# IMPORTANT : arrêtez l'app Node dans cPanel AVANT de lancer ce script !
set -euo pipefail

APP="${HOME}/queenofex"
SERVER="${APP}/server.js"
UPLOADS="${APP}/public/uploads"
WEB="${HOME}/public_html/uploads"

echo "=== Fix images lite (bash/awk uniquement) ==="

# ── 1) Cache Apache (déjà fait si ✓ affiché la dernière fois — idempotent) ──
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
rm -rf "$WEB"
ln -sfn "$UPLOADS" "$WEB"
echo "✓ Cache + symlink /uploads/"

# ── 2) Patch server.js avec awk (pas de fork node) ──
if grep -q 'tryServeNextImageUpload' "$SERVER" 2>/dev/null; then
  echo "ℹ server.js déjà patché (tryServeNextImageUpload OK)"
else
  cp "$SERVER" "${SERVER}.bak-images-$(date +%Y%m%d%H%M%S)"
  sed -i 's/max-age=86400/max-age=31536000, immutable/g' "$SERVER"

  awk '
    BEGIN { inserted=0; added_call=0 }
    {
      if (added_call && $0 ~ /await handle\(req, res, parsedUrl\)/) {
        print "    if (tryServeNextImageUpload(req, res, parsedUrl)) return;"
        added_call=0
      }
      print
      if (!inserted && $0 ~ /^function tryServeUpload/) { in_upload=1 }
      if (in_upload && $0 ~ /^}$/) {
        print ""
        print "function tryServeNextImageUpload(req, res, parsedUrl) {"
        print "  const pathname = parsedUrl.pathname || \"\";"
        print "  if (pathname !== \"/_next/image\") return false;"
        print "  const src = parsedUrl.query?.url;"
        print "  if (typeof src !== \"string\" || !src.startsWith(\"/uploads/\")) return false;"
        print "  return tryServeUpload(req, res, src);"
        print "}"
        inserted=1
        in_upload=0
      }
      if ($0 ~ /if \(tryServeUpload\(req, res, pathname\)\) return;/) { added_call=1 }
    }
  ' "$SERVER" > "${SERVER}.new" && mv "${SERVER}.new" "$SERVER"
  echo "✓ server.js patché (awk)"
fi

grep -q 'tryServeNextImageUpload' "$SERVER" && echo "✓ Vérification OK" || echo "✗ Patch échoué — voir édition manuelle ci-dessous"

echo ""
echo "→ cPanel : Setup Node.js → DÉMARRER (si arrêté)"
echo "→ Ctrl+F5 sur le site"
