#!/bin/bash
# Fix 404 sur /uploads/* — LWS sert public_html, pas queenofex/public
# Usage : bash ~/queenofex/fix-uploads.sh
set -euo pipefail

APP="${HOME}/queenofex"
PUBLIC_UPLOADS="${APP}/public/uploads"
WEB_UPLOADS="${HOME}/public_html/uploads"

mkdir -p "$PUBLIC_UPLOADS"
chmod 777 "$PUBLIC_UPLOADS" 2>/dev/null || chmod 755 "$PUBLIC_UPLOADS"

# Cache navigateur 1 an (Apache sert /uploads/ depuis public_html)
cat > "$PUBLIC_UPLOADS/.htaccess" << 'HTACCESS'
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
chmod 644 "$PUBLIC_UPLOADS/.htaccess" 2>/dev/null || true

# Lien symbolique : Apache lit public_html/uploads → queenofex/public/uploads
rm -rf "$WEB_UPLOADS"
ln -sfn "$PUBLIC_UPLOADS" "$WEB_UPLOADS"

HTACCESS="${HOME}/public_html/.htaccess"
if [ -f "$HTACCESS" ] && ! grep -q 'Queen of Excellence — servir /uploads/' "$HTACCESS" 2>/dev/null; then
  TMP="${HTACCESS}.bak-uploads-$(date +%Y%m%d%H%M%S)"
  cp "$HTACCESS" "$TMP"
  {
    echo "# Queen of Excellence — servir /uploads/ directement (AVANT Passenger)"
    echo "<IfModule mod_rewrite.c>"
    echo "RewriteEngine On"
    echo "RewriteCond %{REQUEST_FILENAME} -f"
    echo "RewriteRule ^ - [L]"
    echo "</IfModule>"
    echo ""
    cat "$HTACCESS"
  } > "${HTACCESS}.new" && mv "${HTACCESS}.new" "$HTACCESS"
  echo "✓ .htaccess mis à jour (fichiers statiques avant Node)"
fi

echo "✓ Lien créé :"
ls -la "$WEB_UPLOADS"
echo ""
echo "Fichiers uploadés :"
ls -la "$PUBLIC_UPLOADS" | head -10
echo ""
echo "Test (remplacez par un vrai fichier si présent) :"
FILE="$(ls "$PUBLIC_UPLOADS" 2>/dev/null | head -1 || true)"
if [ -n "$FILE" ]; then
  echo "  https://queenofexcellence.com/uploads/${FILE}"
else
  echo "  (aucun fichier — uploadez une image dans l'admin puis retestez)"
fi
