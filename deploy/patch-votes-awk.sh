#!/bin/bash
# Fix affichage votes (true/false → nombres) — sans node
# ARRÊTER app Node → attendre 3 min → bash patch-votes-awk.sh → DÉMARRER
set -eu

APP="${HOME}/queenofex"
count=0

patch_file() {
  local f="$1"
  grep -q 'voteCount' "$f" || return 0

  local tmp="${f}.pvtmp"
  cp "$f" "${f}.bakvotes"

  awk '
    BEGIN { helper=0 }
    {
      line=$0
      if (index($0,"voteCount") && index($0,"toLocaleString") && !helper) {
        print "function __vn(v){return typeof v===\"boolean\"?(v?1:0):Number(v??0)}"
        helper=1
      }
      gsub(/\(([a-z])\.voteCount\)\.toLocaleString/, "(__vn(\\1.voteCount)).toLocaleString")
      gsub(/\(([a-z])\.voteCount\?\?0\)\.toLocaleString/, "(__vn(\\1.voteCount)).toLocaleString")
      gsub(/__voteN\(/, "__vn(")
      print line
    }
  ' "$f" > "$tmp" && mv "$tmp" "$f"

  # N° candidat vide quand number=true
  sed -i \
    -e 's/"N°",\([a-z]\)\.number/"N°",__vn(\1.number)/g' \
    -e 's/N°{\([a-z]\)\.number}/N°{__vn(\1.number)}/g' \
    "$f" 2>/dev/null || true

  # Tri classement
  sed -i \
    -e 's/(\([a-z]\)\.voteCount)-(\([a-z]\)\.voteCount)/(__vn(\1.voteCount)-__vn(\2.voteCount))/g' \
    -e 's/(\([a-z]\)\.voteCount??0)-(\([a-z]\)\.voteCount??0)/(__vn(\1.voteCount)-__vn(\2.voteCount))/g' \
    "$f" 2>/dev/null || true
}

echo "=== Patch votes affichage ==="

for dir in "${APP}/.next/server/chunks/ssr" "${APP}/.next/server/chunks"; do
  [ -d "$dir" ] || continue
  while IFS= read -r f; do
    before=$(wc -c < "$f")
    patch_file "$f"
    after=$(wc -c < "$f")
    if [ "$before" != "$after" ]; then
      echo "✓ ${f#$APP/}"
      count=$((count + 1))
    fi
  done < <(find "$dir" -name '*.js' ! -name '*.map*' ! -name '*.bak*' 2>/dev/null)
done

# Fix source données (vote_count=1 → true) dans chunks API
for dir in "${APP}/.next/server/chunks"; do
  while IFS= read -r f; do
    grep -q 'vote_count","number","order' "$f" && continue
    grep -q 'Object.entries' "$f" || continue
    grep -q '0!==\|0===' "$f" || continue
    cp "$f" "${f}.bakvotes2"
    sed -i 's/function \([a-z]\)(\([a-z]\)){if(!\2)return null;let \([a-z]\)={};/function \1(\2){if(!\2)return null;let n=new Set(["vote_count","number","order","vote_price","amount","price","quantity","stock","max_uses","candidate_count"]),\3={};/' "$f" 2>/dev/null || true
    sed -i 's/\]=0!==(\([a-z]\)=\([a-z]\))&&(1===\1||\1)/]=n.has(r)?\2:0!==(\1=\2)\&\&(1===\1||\1)/g' "$f" 2>/dev/null || true
    if ! cmp -s "$f" "${f}.bakvotes2"; then
      echo "✓ camelKeys ${f#$APP/}"
      count=$((count + 1))
    fi
    rm -f "${f}.bakvotes2"
  done < <(find "$dir" -maxdepth 1 -name '*.js' ! -name '*.map*' 2>/dev/null)
done

echo ""
[ "$count" -eq 0 ] && echo "⚠ Aucun changement (déjà OK ?)" || echo "✓ $count fichier(s) patché(s)"
echo "→ DÉMARRER Node → Ctrl+F5 sur /events/gala-ifsio"
