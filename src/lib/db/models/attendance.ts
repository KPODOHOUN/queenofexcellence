import type { RowDataPacket } from "mysql2/promise";
import { execute, queryOne } from "../connection";
import { newId } from "../helpers";

/** L'événement accepte-t-il des « J'y serai » ? (publié, non archivé, non terminé) */
export async function isEventOpenForAttendance(eventId: string) {
  const row = await queryOne<RowDataPacket>(
    "SELECT id FROM `event` WHERE id = ? AND published = 1 AND archived = 0 AND status <> 'COMPLETED'",
    [eventId]
  );
  return Boolean(row);
}

export async function getAttendance(eventId: string, visitorToken?: string) {
  const [countRow, mine] = await Promise.all([
    queryOne<RowDataPacket & { c: number }>("SELECT COUNT(*) AS c FROM `event_attendance` WHERE event_id = ?", [eventId]),
    visitorToken
      ? queryOne<RowDataPacket>(
          "SELECT id FROM `event_attendance` WHERE event_id = ? AND visitor_token = ?",
          [eventId, visitorToken]
        )
      : Promise.resolve(null),
  ]);
  return { count: Number(countRow?.c ?? 0), attending: Boolean(mine) };
}

export async function addAttendance(eventId: string, visitorToken: string) {
  await execute(
    "INSERT IGNORE INTO `event_attendance` (id, event_id, visitor_token) VALUES (?, ?, ?)",
    [newId(), eventId, visitorToken]
  );
}

export async function removeAttendance(eventId: string, visitorToken: string) {
  await execute("DELETE FROM `event_attendance` WHERE event_id = ? AND visitor_token = ?", [eventId, visitorToken]);
}
