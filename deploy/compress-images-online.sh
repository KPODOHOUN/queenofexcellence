#!/bin/bash
# Compresse les JPG/PNG existants (sans redeploy) — réduit le poids ~60-80%
# Usage : bash ~/queenofex/compress-images-online.sh
# Arrêtez l'app Node avant si fork errors
set -euo pipefail

UPLOADS="${HOME}/queenofex/public/uploads"
cd "$UPLOADS"

echo "=== Compression images uploads ==="
echo "Avant :"
du -sh . 2>/dev/null || true

if command -v convert >/dev/null 2>&1; then
  echo "→ ImageMagick convert"
  for f in *.jpg *.jpeg *.JPG *.JPEG 2>/dev/null; do
    [ -f "$f" ] || continue
    sz=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
    [ "$sz" -lt 200000 ] && continue
    cp "$f" "${f}.bak-compress"
    convert "$f" -strip -interlace Plane -quality 82 -resize '1920x1920>' "$f"
    echo "  ✓ $f"
  done
  for f in *.png *.PNG 2>/dev/null; do
    [ -f "$f" ] || continue
    sz=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
    [ "$sz" -lt 200000 ] && continue
    cp "$f" "${f}.bak-compress"
    convert "$f" -strip -resize '1920x1920>' "$f"
    echo "  ✓ $f"
  done
elif command -v jpegoptim >/dev/null 2>&1; then
  echo "→ jpegoptim"
  jpegoptim --size=250k --strip-all *.jpg *.jpeg 2>/dev/null || true
else
  echo "⚠ Ni convert ni jpegoptim disponibles sur ce serveur."
  echo "  Compressez manuellement via Admin (images < 500 Ko recommandé)."
  exit 0
fi

echo ""
echo "Après :"
du -sh .
echo "✓ Terminé — Ctrl+F5 sur le site"
