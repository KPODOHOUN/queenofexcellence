#!/bin/bash
# Corrige les liens sociaux mal formatés en base (ex: "Instagram https://...")
# Usage : bash ~/queenofex/deploy/fix-social-links-db.sh
set -euo pipefail

APP="${HOME}/queenofex"
cd "$APP"

if [ ! -f .env ]; then
  echo "❌ .env absent"
  exit 1
fi

# shellcheck disable=SC1091
source .env

NODE=$(ls ~/nodevenv/queenofex/*/bin/node 2>/dev/null | head -1)
if [ -z "$NODE" ]; then
  NODE=node
fi

"$NODE" << 'NODEJS'
const fs = require("fs");
const mysql = require("mysql2/promise");

function loadEnv() {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[t.slice(0, eq).trim()] = v;
  }
}

function normalize(raw) {
  let url = String(raw || "").trim();
  if (!url) return "";
  url = url.replace(
    /^(YouTube|Facebook|TikTok|Instagram|WhatsApp|Whatsapp)(\s+groupe\s+Whatsapp)?\s+/i,
    ""
  );
  if (!/^https?:\/\//i.test(url)) url = "https://" + url.replace(/^\/+/, "");
  return url;
}

(async () => {
  loadEnv();
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME,
  });

  const [rows] = await conn.execute(
    "SELECT id, value FROM site_content WHERE `key` = 'social_links' LIMIT 1"
  );
  if (!rows.length) {
    console.log("ℹ Aucune entrée social_links en base");
    await conn.end();
    return;
  }

  const row = rows[0];
  const data = JSON.parse(row.value);
  const fixed = {};
  let changed = false;
  for (const [k, v] of Object.entries(data)) {
    const n = normalize(v);
    fixed[k] = n;
    if (n !== v) {
      console.log(`  ${k}: "${v}" → "${n}"`);
      changed = true;
    }
  }

  if (changed) {
    await conn.execute("UPDATE site_content SET value = ? WHERE id = ?", [
      JSON.stringify(fixed),
      row.id,
    ]);
    console.log("✓ Liens sociaux corrigés en base");
  } else {
    console.log("✓ Liens sociaux déjà OK");
  }
  await conn.end();
})().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
NODEJS

echo ""
echo "→ Purger Fastest Cache puis tester les icônes du footer"
