import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";

export function newId(): string {
  return randomUUID();
}

/** Colonnes numériques — ne pas convertir 0/1 en booléen (vote_count, number, etc.) */
const NUMERIC_COLUMNS = new Set([
  "vote_count",
  "number",
  "order",
  "vote_price",
  "amount",
  "price",
  "quantity",
  "stock",
  "max_uses",
  "candidate_count",
]);

export function camelKeys<T>(row: RowDataPacket | null): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = NUMERIC_COLUMNS.has(key) ? value : boolFromDb(value);
  }
  return out as T;
}

export function camelRows<T>(rows: RowDataPacket[]): T[] {
  return rows.map((r) => camelKeys<T>(r)!);
}

function boolFromDb(value: unknown): unknown {
  if (value === 0) return false;
  if (value === 1) return true;
  return value;
}

export function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Construit SET col = ? à partir d'un objet partiel (clés camelCase). */
export function buildUpdateSet(
  data: Record<string, unknown>,
  skip: string[] = ["id", "createdAt"]
): { clause: string; values: unknown[] } {
  const entries = Object.entries(data).filter(
    ([k, v]) => !skip.includes(k) && v !== undefined
  );
  if (entries.length === 0) return { clause: "", values: [] };
  const clause = entries.map(([k]) => `\`${toSnake(k)}\` = ?`).join(", ");
  const values = entries.map(([, v]) => v);
  return { clause, values };
}

/** INSERT INTO table (cols) VALUES (?) */
export function buildInsert(
  table: string,
  data: Record<string, unknown>
): { sql: string; values: unknown[] } {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const cols = entries.map(([k]) => `\`${toSnake(k)}\``).join(", ");
  const placeholders = entries.map(() => "?").join(", ");
  return {
    sql: `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
    values: entries.map(([, v]) => v),
  };
}

export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  return new Date(String(value));
}
