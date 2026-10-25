#!/bin/bash
# Vérification rapide KKiaPay sur le serveur LWS
set -euo pipefail

echo "=== KKiaPay — diagnostic ==="

echo ""
echo "1. Script CDN (doit afficher HTTP/2 200 ou HTTP/1.1 200) :"
curl -sI "https://cdn.kkiapay.me/k.js" | head -3

echo ""
echo "2. Variables Node (cPanel → Setup Node.js App) :"
for v in KKIAPAY_PUBLIC_KEY KKIAPAY_PRIVATE_KEY KKIAPAY_SECRET KKIAPAY_SANDBOX; do
  if [ -n "${!v:-}" ]; then
    echo "  ✓ $v défini"
  else
    echo "  ✗ $v MANQUANT"
  fi
done

echo ""
echo "3. Test API vote (doit renvoyer une erreur JSON, pas HTML) :"
curl -sS "https://queenofexcellence.com/api/public/events?votable=true" | head -c 120
echo ""

echo ""
echo "Si des variables manquent : cPanel → Setup Node.js App → Variables → REDÉMARRER l'app"
echo "Puis purger Fastest Cache + Varnish."
