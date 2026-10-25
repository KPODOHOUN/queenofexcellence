#!/usr/bin/env node
/**
 * Setup base MySQL locale (dev) — schéma + seed
 * Usage : npm run db:setup
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const ROOT = path.join(__dirname, "..");
const SCHEMA = path.join(ROOT, "database", "schema.mysql.sql");
const SEED = path.join(ROOT, "database", "seed.mysql.sql");

function loadEnvFile(name) {
  const file = path.join(ROOT, name);
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
loadEnvFile(".env.development");
loadEnvFile(".env");

function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username || "root"),
    password: decodeURIComponent(parsed.password || ""),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

function splitSql(content) {
  const statements = [];
  let current = "";
  let delimiter = ";";

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;

    const delimMatch = line.match(/^DELIMITER\s+(.+)$/i);
    if (delimMatch) {
      delimiter = delimMatch[1].trim();
      continue;
    }

    current += `${rawLine}\n`;
    if (line.endsWith(delimiter)) {
      const stmt = current.slice(0, -delimiter.length).trim();
      if (stmt) statements.push(stmt);
      current = "";
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function runSqlFile(conn, filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const statements = splitSql(content);
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR" || err.code === "ER_DUP_ENTRY") {
        continue;
      }
      throw new Error(`${path.basename(filePath)}: ${err.message}\n${stmt.slice(0, 120)}...`);
    }
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("mysql://")) {
    console.error("DATABASE_URL mysql:// requis dans .env.local");
    process.exit(1);
  }

  const cfg = parseDatabaseUrl(url);
  const dbName = cfg.database;

  const serverConn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
  });

  await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await serverConn.query(`USE \`${dbName}\``);

  console.log(`→ Schéma (${path.basename(SCHEMA)})...`);
  await runSqlFile(serverConn, SCHEMA);

  console.log(`→ Seed (${path.basename(SEED)})...`);
  await runSqlFile(serverConn, SEED);

  const [admins] = await serverConn.query("SELECT email FROM admin LIMIT 1");
  const [partners] = await serverConn.query("SELECT COUNT(*) AS n FROM partner WHERE published = 1");
  await serverConn.end();

  console.log("");
  console.log("Base locale prête.");
  console.log(`  Admin   : admin@queenofexcellence.com / admin123`);
  console.log(`  Login   : http://localhost:3001/admin/login`);
  console.log(`  Admins  : ${admins.length} compte(s)`);
  console.log(`  Partenaires publiés : ${partners[0].n}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
