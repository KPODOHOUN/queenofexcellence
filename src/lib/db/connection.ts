import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type QueryValues = Parameters<Pool["execute"]>[1];

let pool: Pool | null = null;

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

export function getPoolConfig() {
  // Variables séparées (.env) — priorité sur DATABASE_URL (cPanel)
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
    return parseDatabaseUrl(url);
  }
  return {
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  };
}

export function isDatabaseConfigured(): boolean {
  const cfg = getPoolConfig();
  return Boolean(cfg.user && cfg.database);
}

export function getPool(): Pool {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "Base de données non configurée. Exemple : DATABASE_URL=mysql://user:pass@localhost:3306/queenofex"
    );
  }
  if (!pool) {
    const cfg = getPoolConfig();
    pool = mysql.createPool({
      ...cfg,
      waitForConnections: true,
      connectionLimit: 3,
      timezone: "Z",
      dateStrings: false,
    });
  }
  return pool;
}

export type DbConn = Pool | PoolConnection;

export async function query<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  conn?: DbConn
): Promise<T[]> {
  const db = conn ?? getPool();
  const [rows] = await db.execute<T[]>(sql, params as QueryValues);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  conn?: DbConn
): Promise<T | null> {
  const rows = await query<T>(sql, params, conn);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params: unknown[] = [],
  conn?: DbConn
): Promise<ResultSetHeader> {
  const db = conn ?? getPool();
  const [result] = await db.execute<ResultSetHeader>(sql, params as QueryValues);
  return result;
}

export async function withTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function countTable(table: string, where = "1=1", params: unknown[] = []): Promise<number> {
  const row = await queryOne<RowDataPacket & { c: number }>(
    `SELECT COUNT(*) AS c FROM \`${table}\` WHERE ${where}`,
    params
  );
  return Number(row?.c ?? 0);
}
