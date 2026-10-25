#!/usr/bin/env node
/**
 * Seed MySQL minimal — admin + contenus vides
 * Local : npm run db:seed
 * Production : importer database/seed.mysql.sql via phpMyAdmin
 */
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { randomUUID } = require("crypto");

function loadEnvFile(name) {
  const file = path.join(__dirname, "..", name);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("mysql://")) {
    console.error("DATABASE_URL mysql:// requis");
    process.exit(1);
  }
  const parsed = new URL(url);
  const conn = await mysql.createConnection({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  });

  const hash = await bcrypt.hash("admin123", 10);
  await conn.execute(
    `INSERT INTO admin (id, email, name, password_hash) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE email = email`,
    [randomUUID(), "admin@queenofexcellence.com", "Administrateur", hash]
  );

  const contents = [
    ["about", JSON.stringify({ title: "", content: "", image: "" })],
    ["social_links", JSON.stringify({ youtube: "", facebook: "", tiktok: "", instagram: "", whatsapp: "" })],
    ["contact", JSON.stringify({ email: "", phone: "", address: "", hours: "" })],
  ];
  for (const [key, value] of contents) {
    await conn.execute(
      `INSERT INTO site_content (id, \`key\`, value) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [randomUUID(), key, value]
    );
  }

  console.log("Seed minimal terminé (admin + contenus vides).");
  console.log("Admin : admin@queenofexcellence.com / admin123");
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
