import type { RowDataPacket } from "mysql2/promise";
import { countTable, query } from "../connection";
import { camelKeys, camelRows } from "../helpers";
import { createRow, deleteRow, updateRow } from "../crud";

export async function findCandidatesAdminList(
  skip: number,
  take: number,
  eventId?: string | null
) {
  const where = eventId ? "c.event_id = ?" : "1=1";
  const params = eventId ? [eventId] : [];

  const [rows, total] = await Promise.all([
    query<RowDataPacket>(
      `SELECT c.*, e.name AS event_name, e.slug AS event_slug
       FROM \`candidate\` c
       JOIN \`event\` e ON e.id = c.event_id
       WHERE ${where}
       ORDER BY c.event_id ASC, c.\`number\` ASC
       LIMIT ? OFFSET ?`,
      [...params, take, skip]
    ),
    countTable("candidate", eventId ? "event_id = ?" : "1=1", params),
  ]);

  const items = rows.map((row) => {
    const item = camelKeys(row)! as Record<string, unknown>;
    const { eventName, eventSlug, ...rest } = item;
    return {
      ...rest,
      event: { name: eventName, slug: eventSlug },
    };
  });

  return { items, total };
}

export async function findPublicCandidates(
  eventId?: string | null,
  eventSlug?: string | null,
  categoryId?: string | null
) {
  if (eventId) {
    const where = categoryId
      ? "published = 1 AND status = 'APPROVED' AND event_id = ? AND category_id = ?"
      : "published = 1 AND status = 'APPROVED' AND event_id = ?";
    const params = categoryId ? [eventId, categoryId] : [eventId];
    const rows = await query<RowDataPacket>(
      `SELECT id, name, slug, \`number\`, photo, vote_count, category_id
       FROM \`candidate\`
       WHERE ${where}
       ORDER BY vote_count DESC, \`number\` ASC`,
      params
    );
    return camelRows(rows);
  }

  const rows = await query<RowDataPacket>(
    `SELECT c.id, c.name, c.slug, c.\`number\`, c.photo, c.vote_count
     FROM \`candidate\` c
     JOIN \`event\` e ON e.id = c.event_id
     WHERE c.published = 1 AND c.status = 'APPROVED'
       AND e.slug = ? AND e.published = 1
     ORDER BY c.\`number\` ASC`,
    [eventSlug]
  );
  return camelRows(rows);
}

export async function createCandidate(data: Record<string, unknown>) {
  return createRow("candidate", data);
}

export async function updateCandidate(id: string, data: Record<string, unknown>) {
  return updateRow("candidate", id, data);
}

export async function deleteCandidate(id: string) {
  return deleteRow("candidate", id);
}
