import type { RowDataPacket } from "mysql2/promise";
import { countTable, query } from "../connection";
import { camelKeys, camelRows } from "../helpers";
import { createRow, deleteRow, findByField, updateRow } from "../crud";

export async function findTicketsAdminList(
  skip: number,
  take: number,
  eventId?: string | null
) {
  const where = eventId ? "t.event_id = ?" : "1=1";
  const params = eventId ? [eventId] : [];

  const [rows, total] = await Promise.all([
    query<RowDataPacket>(
      `SELECT t.*, e.name AS event_name
       FROM \`ticket\` t
       JOIN \`event\` e ON e.id = t.event_id
       WHERE ${where}
       ORDER BY t.price ASC
       LIMIT ? OFFSET ?`,
      [...params, take, skip]
    ),
    countTable("ticket", eventId ? "event_id = ?" : "1=1", params),
  ]);

  const items = rows.map((row) => {
    const item = camelKeys(row)! as Record<string, unknown>;
    const { eventName, ...rest } = item;
    return { ...rest, event: { name: eventName } };
  });

  return { items, total };
}

export async function findPublicTickets(eventId: string) {
  const rows = await query<RowDataPacket>(
    `SELECT id, name, description, price, quantity, sold
     FROM \`ticket\`
     WHERE event_id = ? AND active = 1
     ORDER BY price ASC`,
    [eventId]
  );
  return camelRows(rows);
}

export async function createTicket(data: Record<string, unknown>) {
  return createRow("ticket", data);
}

export async function updateTicket(id: string, data: Record<string, unknown>) {
  return updateRow("ticket", id, data);
}

export async function deleteTicket(id: string) {
  return deleteRow("ticket", id);
}
