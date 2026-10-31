import type { RowDataPacket } from "mysql2/promise";
import { execute, queryOne } from "../connection";

export async function saveMedia(filename: string, mime: string, data: Buffer) {
  // INSERT IGNORE : réimporter une image déjà en base ne change rien.
  const result = await execute(
    "INSERT IGNORE INTO `media` (filename, mime, size, data) VALUES (?, ?, ?, ?)",
    [filename, mime, data.length, data]
  );
  return result.affectedRows > 0;
}

export async function findMedia(filename: string) {
  const row = await queryOne<RowDataPacket>("SELECT mime, data FROM `media` WHERE filename = ?", [filename]);
  return row ? { mime: row.mime as string, data: row.data as Buffer } : null;
}

export async function getMediaStats() {
  const row = await queryOne<RowDataPacket>("SELECT COUNT(*) AS c, COALESCE(SUM(size), 0) AS s FROM `media`");
  return { count: Number(row?.c ?? 0), bytes: Number(row?.s ?? 0) };
}
