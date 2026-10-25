import type { RowDataPacket } from "mysql2/promise";
import { countTable, query } from "../connection";
import { camelKeys, camelRows } from "../helpers";
import { createRow, deleteRow, updateRow } from "../crud";

export async function findGalleryAdminList(skip: number, take: number) {
  const [rows, total] = await Promise.all([
    query<RowDataPacket>(
      `SELECT g.*, e.name AS event_name, c.name AS candidate_name
       FROM \`gallery_item\` g
       LEFT JOIN \`event\` e ON e.id = g.event_id
       LEFT JOIN \`candidate\` c ON c.id = g.candidate_id
       ORDER BY g.\`order\` ASC
       LIMIT ? OFFSET ?`,
      [take, skip]
    ),
    countTable("gallery_item"),
  ]);

  const items = rows.map((row) => {
    const item = camelKeys(row)! as Record<string, unknown>;
    const { eventName, candidateName, ...rest } = item;
    return {
      ...rest,
      event: eventName ? { name: eventName } : null,
      candidate: candidateName ? { name: candidateName } : null,
    };
  });

  return { items, total };
}

export async function createGalleryItem(data: Record<string, unknown>) {
  return createRow("gallery_item", data);
}

export async function updateGalleryItem(id: string, data: Record<string, unknown>) {
  return updateRow("gallery_item", id, data);
}

export async function deleteGalleryItem(id: string) {
  return deleteRow("gallery_item", id);
}
