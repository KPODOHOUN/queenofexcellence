import type { RowDataPacket } from "mysql2/promise";
import { countTable, execute, query, queryOne, type DbConn } from "./connection";
import { buildInsert, buildUpdateSet, camelKeys, camelRows, newId } from "./helpers";

export async function listPaged<T>(
  table: string,
  orderBy: string,
  skip: number,
  take: number,
  where = "1=1",
  params: unknown[] = []
): Promise<{ items: T[]; total: number }> {
  const [items, total] = await Promise.all([
    query<RowDataPacket>(
      `SELECT * FROM \`${table}\` WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, take, skip]
    ),
    countTable(table, where, params),
  ]);
  return { items: camelRows<T>(items), total };
}

export async function findById<T>(table: string, id: string): Promise<T | null> {
  const row = await queryOne<RowDataPacket>(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
  return camelKeys<T>(row);
}

export async function findByField<T>(
  table: string,
  field: string,
  value: unknown
): Promise<T | null> {
  const row = await queryOne<RowDataPacket>(
    `SELECT * FROM \`${table}\` WHERE \`${field}\` = ?`,
    [value]
  );
  return camelKeys<T>(row);
}

export async function findMany<T>(
  table: string,
  where = "1=1",
  params: unknown[] = [],
  orderBy = "`created_at` DESC"
): Promise<T[]> {
  const rows = await query<RowDataPacket>(
    `SELECT * FROM \`${table}\` WHERE ${where} ORDER BY ${orderBy}`,
    params
  );
  return camelRows<T>(rows);
}

export async function createRow<T>(
  table: string,
  data: Record<string, unknown>,
  conn?: DbConn
): Promise<T> {
  const id = (data.id as string) ?? newId();
  const payload = { ...data, id };
  const { sql, values } = buildInsert(table, payload);
  await execute(sql, values, conn);
  const row = await findById<T>(table, id);
  return row!;
}

export async function updateRow<T>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  conn?: DbConn
): Promise<T | null> {
  const { clause, values } = buildUpdateSet(data);
  if (!clause) return findById<T>(table, id);
  await execute(`UPDATE \`${table}\` SET ${clause} WHERE id = ?`, [...values, id], conn);
  return findById<T>(table, id);
}

export async function deleteRow(table: string, id: string, conn?: DbConn): Promise<void> {
  await execute(`DELETE FROM \`${table}\` WHERE id = ?`, [id], conn);
}

export async function upsertByField<T>(
  table: string,
  uniqueField: string,
  data: Record<string, unknown>
): Promise<T> {
  const existing = await findByField<Record<string, unknown>>(table, uniqueField, data[uniqueField]);
  if (existing?.id) {
    return (await updateRow<T>(table, existing.id as string, data))!;
  }
  return createRow<T>(table, data);
}

export { newId };
