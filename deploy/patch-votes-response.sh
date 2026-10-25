#!/bin/bash
# Fix votes true/false — intercepte les réponses HTTP (100% fiable)
# ARRÊTER Node → 3 min → bash patch-votes-response.sh → DÉMARRER
set -eu

S="${HOME}/queenofex/server.js"

if grep -q 'installResponseVoteFix' "$S"; then
  echo "ℹ Déjà patché (installResponseVoteFix)"
  exit 0
fi

cp "$S" "${S}.bak-votes2-$(date +%Y%m%d%H%M%S)"

awk '
  /const \{ parse \} = require\("url"\);/ && !d {
    print
    print ""
    print "function patchVoteBoolsInText(text) {"
    print "  const keys = [\"voteCount\", \"number\", \"order\", \"votePrice\", \"candidateCount\"];"
    print "  for (const k of keys) {"
    print "    text = text.replace(new RegExp(\"\\\"\" + k + \"\\\":true\", \"g\"), \"\\\"\" + k + \"\\\":1\");"
    print "    text = text.replace(new RegExp(\"\\\"\" + k + \"\\\":false\", \"g\"), \"\\\"\" + k + \"\\\":0\");"
    print "    text = text.replace(new RegExp(\"\\\\\\\\\\\"\" + k + \"\\\\\\\\\\\":true\", \"g\"), \"\\\\\\\"\" + k + \"\\\\\\\":1\");"
    print "    text = text.replace(new RegExp(\"\\\\\\\\\\\"\" + k + \"\\\\\\\\\\\":false\", \"g\"), \"\\\\\\\"\" + k + \"\\\\\\\":0\");"
    print "  }"
    print "  return text;"
    print "}"
    print "function installResponseVoteFix(res) {"
    print "  if (res.__voteFixInstalled) return;"
    print "  res.__voteFixInstalled = true;"
    print "  const chunks = [];"
    print "  const origWrite = res.write.bind(res);"
    print "  const origEnd = res.end.bind(res);"
    print "  res.write = function (chunk, encoding, cb) {"
    print "    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));"
    print "    if (typeof encoding === \"function\") encoding(); else if (typeof cb === \"function\") cb();"
    print "    return true;"
    print "  };"
    print "  res.end = function (chunk, encoding, cb) {"
    print "    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));"
    print "    let body = chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);"
    print "    if (body.length > 0 && body.length < 15 * 1024 * 1024) {"
    print "      const text = body.toString(\"utf8\");"
    print "      if (text.includes(\"voteCount\")) {"
    print "        body = Buffer.from(patchVoteBoolsInText(text), \"utf8\");"
    print "        try { res.removeHeader(\"Transfer-Encoding\"); res.setHeader(\"Content-Length\", String(body.length)); } catch (e) {}"
    print "      }"
    print "    }"
    print "    res.write = origWrite; res.end = origEnd;"
    print "    if (typeof encoding === \"function\") return origEnd(body, encoding);"
    print "    return origEnd(body, encoding, cb);"
    print "  };"
    print "}"
    d=1; next
  }
  { print }
' "$S" > "${S}.new" && mv "${S}.new" "$S"

grep -q 'installResponseVoteFix(res)' "$S" || \
  sed -i '/const pathname = parsedUrl.pathname || "";/a\    if (!pathname.startsWith("/_next/static") \&\& !pathname.startsWith("/uploads/")) installResponseVoteFix(res);' "$S"

echo "✓ server.js patché (fix réponses HTTP)"
echo "→ DÉMARRER Node"
echo "→ Test: curl -s 'https://queenofexcellence.com/api/public/candidates?eventSlug=gala-ifsio' | grep AMIDOU"
