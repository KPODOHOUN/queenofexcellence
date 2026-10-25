#!/bin/bash
# Diagnostic images — compatible cPanel bash (sans source /dev/fd)
set -eu

APP="${HOME}/queenofex"
UPLOADS="${APP}/public/uploads"
ENV="${APP}/.env"

echo "=== Fichiers sur disque ($UPLOADS) ==="
ls -lh "$UPLOADS" 2>/dev/null | grep -E '\.(jpg|jpeg|png|webp|gif)$' || echo "(vide)"
echo ""

if [ ! -f "$ENV" ]; then
  echo "✗ .env introuvable"
  exit 1
fi

DB_HOST=$(grep '^DATABASE_HOST=' "$ENV" | cut -d= -f2- | tr -d "\"'" || echo localhost)
DB_USER=$(grep '^DATABASE_USER=' "$ENV" | cut -d= -f2- | tr -d "\"'")
DB_PASS=$(grep '^DATABASE_PASSWORD=' "$ENV" | cut -d= -f2- | tr -d "\"'")
DB_NAME=$(grep '^DATABASE_NAME=' "$ENV" | cut -d= -f2- | tr -d "\"'")

echo "=== Images en base vs disque ==="
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -B -e "
SELECT 'hero', image FROM hero_slide WHERE image LIKE '/uploads/%'
UNION ALL SELECT 'about', JSON_UNQUOTE(JSON_EXTRACT(value,'\$.image')) FROM site_content WHERE \`key\`='about' AND JSON_EXTRACT(value,'\$.image') IS NOT NULL
UNION ALL SELECT 'candidate', photo FROM candidate WHERE photo LIKE '/uploads/%'
UNION ALL SELECT 'event', image FROM event WHERE image LIKE '/uploads/%'
UNION ALL SELECT 'gallery', image_url FROM gallery_item WHERE image_url LIKE '/uploads/%'
UNION ALL SELECT 'partner', logo FROM partner WHERE logo LIKE '/uploads/%';
" 2>/dev/null | while IFS=$'\t' read -r src url; do
  [ -z "$url" ] || [ "$url" = "NULL" ] && continue
  f="${UPLOADS}/$(basename "$url")"
  if [ -f "$f" ]; then
    echo "  OK  [$src] $(basename "$url")"
  else
    echo "  MANQUANT [$src] $url"
  fi
done

echo ""
echo "=== Fichiers lourds (> 400 Ko) ==="
find "$UPLOADS" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.png' \) -size +400k -exec ls -lh {} \; 2>/dev/null | awk '{print "  "$5, $9}'

echo ""
echo "Si MANQUANT → ré-uploadez dans Admin (Hero slides / Contenu / Candidates)"
echo "Si lourd → compressez avant upload (< 400 Ko)"
