#!/bin/bash
# FIX DÉFINITIF votes true/false — sans redeploy, sans node
# 1) cPanel → ARRÊTER Node → attendre 3 min
# 2) bash fix-votes-final.sh
# 3) cPanel → LiteSpeed Cache → Tout purger (si disponible)
# 4) DÉMARRER Node
set -eu

APP="${HOME}/queenofex"
echo "=== Fix votes FINAL ==="

# ── A) Corriger camelKeys dans TOUS les chunks .next ──
fixed=0
while IFS= read -r -d '' f; do
  grep -q 'vote_count","number","order' "$f" 2>/dev/null && continue
  grep -q 'Object.entries' "$f" 2>/dev/null || continue
  grep -q '1===.*||' "$f" 2>/dev/null || continue
  grep -qE '\]=0!==\(|0===.*\?!1:1===' "$f" 2>/dev/null || continue

  cp "$f" "${f}.bakck"
  changed=0

  # Injecter Set NUMERIC_COLUMNS
  if grep -q 'for(let\[r,i\]of Object.entries' "$f" 2>/dev/null; then
    sed -i 's/function \([a-z]\)(\([a-z]\)){if(!\2)return null;let \([a-z]\)={};/function \1(\2){if(!\2)return null;let n=new Set(["vote_count","number","order","vote_price","amount","price","quantity","stock","max_uses","candidate_count"]),\3={};/g' "$f" && changed=1
    sed -i 's/\]=0!==(\([a-z]\)=\([a-z]\))&&(1===\1||\1)/]=n.has(r)?\2:0!==(\1=\2)\&\&(1===\1||\1)/g' "$f" && changed=1
    sed -i 's/\]=0===\([a-z]\)?!1:1===\1?!0:\1/]=n.has(r)?i:0===\1?!1:1===\1?!0:\1/g' "$f" 2>/dev/null && changed=1
  fi

  if [ "$changed" = 1 ] && ! cmp -s "$f" "${f}.bakck"; then
    echo "✓ camelKeys $(basename "$f")"
    fixed=$((fixed + 1))
  else
    mv "${f}.bakck" "$f" 2>/dev/null || true
  fi
done < <(find "${APP}/.next/server/chunks" -name '*.js' ! -name '*.map*' ! -name '*.bak*' -print0 2>/dev/null)

echo "→ $fixed chunk(s) camelKeys corrigé(s)"

# ── B) server.js : fix réponses HTTP (secours) ──
S="${APP}/server.js"
if ! grep -q 'installResponseVoteFix' "$S"; then
  cp "$S" "${S}.bak-final"
  awk '
    /const \{ parse \} = require\("url"\);/ && !d {
      print
      print ""
      print "function patchVoteBoolsInText(t){for(const k of[\"voteCount\",\"number\",\"order\",\"votePrice\",\"candidateCount\"]){t=t.split(\"\\\"\"+k+\"\\\":true\").join(\"\\\"\"+k+\"\\\":1\");t=t.split(\"\\\"\"+k+\"\\\":false\").join(\"\\\"\"+k+\"\\\":0\");t=t.split(\"\\\\\\\"\"+k+\"\\\\\\\":true\").join(\"\\\\\\\"\"+k+\"\\\\\\\":1\");t=t.split(\"\\\\\\\"\"+k+\"\\\\\\\":false\").join(\"\\\\\\\"\"+k+\"\\\\\\\":0\");}return t;}"
      print "function installResponseVoteFix(res){if(res.__vf)return;res.__vf=1;const c=[],ow=res.write.bind(res),oe=res.end.bind(res);res.write=function(x,e,cb){if(x)c.push(Buffer.isBuffer(x)?x:Buffer.from(String(x)));if(typeof e===\"function\")e();else if(typeof cb===\"function\")cb();return true;};res.end=function(x,e,cb){if(x)c.push(Buffer.isBuffer(x)?x:Buffer.from(String(x)));let b=c.length?Buffer.concat(c):Buffer.alloc(0);if(b.length&&b.length<15000000){const s=b.toString(\"utf8\");if(s.includes(\"voteCount\"))b=Buffer.from(patchVoteBoolsInText(s));}res.write=ow;res.end=oe;return typeof e===\"function\"?oe(b,e):oe(b,e,cb);};}"
      d=1; next
    }
    { print }
  ' "$S" > "${S}.new" && mv "${S}.new" "$S"
  grep -q 'installResponseVoteFix(res)' "$S" || \
    sed -i '/const pathname = parsedUrl.pathname || "";/a\    if (pathname.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");\n    if (!pathname.startsWith("/_next/static") \&\& !pathname.startsWith("/uploads/")) installResponseVoteFix(res);' "$S"
  echo "✓ server.js patché"
else
  echo "ℹ server.js déjà patché"
fi

echo ""
echo "=== Vérification locale (sans cache CDN) ==="
echo "curl -s -H 'Cache-Control: no-cache' 'http://127.0.0.1:\${PORT:-3000}/api/public/candidates?eventSlug=gala-ifsio' | grep -o 'voteCount[^,]*' | sort -u | head -5"
echo ""
echo "→ Purger cache LWS (LiteSpeed / Varnish) si possible"
echo "→ DÉMARRER Node → Ctrl+F5"
