#!/bin/bash
# Fix votes true/false — modifie UNIQUEMENT server.js (bash/awk, pas de node)
# ARRÊTER Node → 3 min → bash patch-votes-server.sh → DÉMARRER
set -eu

SERVER="${HOME}/queenofex/server.js"

if grep -q 'patchAllCamelKeysModules' "$SERVER"; then
  echo "ℹ Déjà patché"
  exit 0
fi

cp "$SERVER" "${SERVER}.bak-votes-$(date +%Y%m%d%H%M%S)"

# 1) Insérer les fonctions après "const { parse } = require(\"url\");"
awk '
  /const \{ parse \} = require\("url"\);/ && !done {
    print
    print ""
    print "const NUMERIC_BOOL_KEYS = new Set([\"voteCount\",\"number\",\"order\",\"votePrice\",\"amount\",\"price\",\"quantity\",\"stock\",\"maxUses\",\"candidateCount\"]);"
    print "function fixRowNumericBools(row) {"
    print "  if (!row || typeof row !== \"object\" || Array.isArray(row)) return row;"
    print "  for (const k of Object.keys(row)) {"
    print "    const v = row[k];"
    print "    if (typeof v === \"boolean\" && (NUMERIC_BOOL_KEYS.has(k) || k.endsWith(\"Count\"))) row[k] = v ? 1 : 0;"
    print "  }"
    print "  return row;"
    print "}"
    print "function patchCamelKeysExport(exp) {"
    print "  if (!exp || exp.__voteBoolFix || typeof exp.camelKeys !== \"function\") return false;"
    print "  const origKeys = exp.camelKeys;"
    print "  const origRows = exp.camelRows;"
    print "  exp.camelKeys = function (row) { return fixRowNumericBools(origKeys(row)); };"
    print "  if (typeof origRows === \"function\") {"
    print "    exp.camelRows = function (rows) { return origRows(rows).map((r) => fixRowNumericBools(r)); };"
    print "  }"
    print "  exp.__voteBoolFix = true;"
    print "  return true;"
    print "}"
    print "function patchAllCamelKeysModules() {"
    print "  let count = 0;"
    print "  for (const mod of Object.values(require.cache)) {"
    print "    if (mod?.exports && patchCamelKeysExport(mod.exports)) count++;"
    print "  }"
    print "  return count;"
    print "}"
    done=1
    next
  }
  { print }
' "$SERVER" > "${SERVER}.new" && mv "${SERVER}.new" "$SERVER"

# 2) Au démarrage Next
sed -i 's/isReady = true;/const __pv = patchAllCamelKeysModules(); logStartup("Patch votes: " + __pv + " module(s)"); isReady = true;/' "$SERVER"

# 3) À chaque requête (modules chargés à la demande)
grep -q 'patchAllCamelKeysModules();' "$SERVER" || \
  sed -i '/const parsedUrl = parse(req.url, true);/i\    patchAllCamelKeysModules();' "$SERVER"

echo "✓ server.js patché"
echo "→ DÉMARRER Node"
echo "→ Test: curl -s 'https://queenofexcellence.com/api/public/candidates?eventSlug=gala-ifsio' | tr ',' '\\n' | grep -E 'AMIDOU|voteCount' | head -6"
