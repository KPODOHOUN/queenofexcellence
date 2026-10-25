import { findByField, createRow } from "../crud";
import { execute, queryOne } from "../connection";
import type { RowDataPacket } from "mysql2/promise";
import { camelKeys } from "../helpers";

export async function findAdminByEmail(email: string) {
  return findByField<{ id: string; email: string; name: string | null; passwordHash: string }>(
    "admin",
    "email",
    email
  );
}

export async function countRecentLoginFailures(email: string, since: Date): Promise<number> {
  const row = await queryOne<RowDataPacket & { c: number }>(
    `SELECT COUNT(*) AS c FROM \`login_attempt\`
     WHERE email = ? AND success = 0 AND created_at >= ?`,
    [email, since]
  );
  return Number(row?.c ?? 0);
}

export async function createLoginAttempt(email: string, success: boolean) {
  return createRow("login_attempt", { email, success });
}

export async function upsertAdmin(data: {
  email: string;
  name?: string;
  passwordHash: string;
}) {
  const existing = await findAdminByEmail(data.email);
  if (existing) return existing;
  return createRow("admin", data);
}
