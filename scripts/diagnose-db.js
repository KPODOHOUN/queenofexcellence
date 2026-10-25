#!/usr/bin/env node
/**
 * Test connexion MySQL (serveur LWS ou local).
 * Usage : node scripts/diagnose-db.js
 * Lit ~/queenofex/.env ou .env du dossier courant.
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function getPoolConfig() {
  if (process.env.DATABASE_USER && process.env.DATABASE_NAME) {
    return {
      host: process.env.DATABASE_HOST || "localhost",
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME,
    };
  }
  const url = process.env.DATABASE_URL?.trim();
  if (url?.startsWith("mysql://")) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ""),
    };
  }
  return null;
}

async function main() {
  loadEnvFile();
  const cfg = getPoolConfig();

  if (!cfg?.user || !cfg?.database) {
    console.error("❌ Base non configurée.");
    console.error("   Créez ~/queenofex/.env avec DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME");
    process.exit(1);
  }

  console.log("→ Test connexion MySQL…");
  console.log(`   Host : ${cfg.host}:${cfg.port}`);
  console.log(`   User : ${cfg.user}`);
  console.log(`   Base : ${cfg.database}`);

  try {
    const conn = await mysql.createConnection(cfg);
    const [ping] = await conn.execute("SELECT 1 AS ok");
    const [admins] = await conn.execute("SELECT email FROM admin LIMIT 5");
    const [events] = await conn.execute("SELECT COUNT(*) AS c FROM event");
    await conn.end();

    console.log("✓ Connexion OK — ping:", ping[0].ok);
    console.log("  Admins :", admins.map((r) => r.email).join(", ") || "(aucun — importez seed.mysql.sql)");
    console.log("  Événements :", events[0].c);
  } catch (err) {
    console.error("❌ Échec :", err.message);
    if (err.message.includes("Access denied")) {
      console.error("   → Mot de passe incorrect dans .env");
    }
    if (err.message.includes("Unknown database")) {
      console.error("   → Nom de base incorrect — vérifiez dans cPanel → MySQL → Bases de données");
      console.error("   → Souvent : c2852916c_queenofex (pas queenofexcellence)");
    }
    process.exit(1);
  }
}

main();
