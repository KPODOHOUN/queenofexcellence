import type { RowDataPacket } from "mysql2/promise";
import {
  findCategoriesByEventId,
  findCategoriesWithCandidates,
  syncEventCategories,
} from "./categories";
import { countTable, query, queryOne } from "../connection";
import { camelKeys, camelRows } from "../helpers";
import { createRow, deleteRow, findById, listPaged, updateRow } from "../crud";

type EventRow = Record<string, unknown>;

function withCounts(row: EventRow) {
  return {
    ...row,
    _count: {
      candidates: Number(row.candidateCount ?? 0),
      votes: Number(row.voteCount ?? 0),
    },
  };
}

function stripCountFields(row: EventRow) {
  const { candidateCount, voteCount, galleryCount, ...rest } = row;
  return rest;
}

export async function findEventsAdminList(
  skip: number,
  take: number
): Promise<{ items: unknown[]; total: number }> {
  const [rows, total] = await Promise.all([
    query<RowDataPacket>(
      `SELECT e.*,
        (SELECT COUNT(*) FROM \`candidate\` c WHERE c.event_id = e.id) AS candidate_count,
        (SELECT COUNT(*) FROM \`vote\` v WHERE v.event_id = e.id) AS vote_count
       FROM \`event\` e
       ORDER BY e.date DESC
       LIMIT ? OFFSET ?`,
      [take, skip]
    ),
    countTable("event"),
  ]);
  const items = camelRows<EventRow>(rows).map((row) =>
    withCounts(stripCountFields(row))
  );
  return { items, total };
}

export async function getEventAdminDetail(id: string) {
  const event = await findById<EventRow>("event", id);
  if (!event) return null;

  const [candidates, tickets, voteCount, galleryCount, categories] = await Promise.all([
    query<RowDataPacket>(
      `SELECT c.*, cat.name AS category_name
       FROM \`candidate\` c
       LEFT JOIN \`event_category\` cat ON cat.id = c.category_id
       WHERE c.event_id = ? ORDER BY c.\`number\` ASC`,
      [id]
    ),
    query<RowDataPacket>(
      `SELECT * FROM \`ticket\` WHERE event_id = ? ORDER BY price ASC`,
      [id]
    ),
    countTable("vote", "event_id = ?", [id]),
    countTable("gallery_item", "event_id = ?", [id]),
    findCategoriesByEventId(id),
  ]);

  return {
    ...event,
    candidates: camelRows(candidates),
    tickets: camelRows(tickets),
    categories,
    _count: { votes: voteCount, gallery: galleryCount },
  };
}

export async function createEventAdmin(
  data: Record<string, unknown>,
  categoryNames: string[] = []
) {
  const event = await createRow<EventRow>("event", data);
  const eventId = event.id as string;
  if (categoryNames.length > 0) {
    await syncEventCategories(eventId, categoryNames);
  }
  const detail = await getEventAdminDetail(eventId);
  return detail ?? { ...event, _count: { candidates: 0, votes: 0 }, categories: [] };
}

export async function updateEvent(id: string, data: Record<string, unknown>) {
  return updateRow("event", id, data);
}

export async function deleteEvent(id: string) {
  return deleteRow("event", id);
}

export async function findEventBySlug(slug: string, publishedOnly = false) {
  const where = publishedOnly
    ? `slug = ? AND published = 1`
    : `slug = ?`;
  const row = await queryOne<RowDataPacket>(
    `SELECT * FROM \`event\` WHERE ${where}`,
    [slug]
  );
  return camelKeys(row);
}

export async function getEventPublicDetail(slug: string) {
  const event = await findEventBySlug(slug, true);
  if (!event) return null;

  const id = (event as { id: string }).id;
  const [categoriesWithCandidates, gallery, candidateCount] = await Promise.all([
    findCategoriesWithCandidates(id),
    query<RowDataPacket>(
      `SELECT * FROM \`gallery_item\` WHERE event_id = ? AND published = 1 ORDER BY \`order\` ASC`,
      [id]
    ),
    countTable("candidate", "event_id = ? AND published = 1 AND status = 'APPROVED'", [id]),
  ]);

  const uncategorizedRows = await query<RowDataPacket>(
    `SELECT c.*, e.slug AS event_slug, e.name AS event_name
     FROM \`candidate\` c
     JOIN \`event\` e ON e.id = c.event_id
     WHERE c.event_id = ? AND c.published = 1 AND c.status = 'APPROVED' AND c.category_id IS NULL
     ORDER BY c.vote_count DESC, c.\`number\` ASC`,
    [id]
  );

  const uncategorizedCandidates = camelRows<Record<string, unknown>>(uncategorizedRows).map(
    (row, index) => ({
      ...row,
      event: { slug: row.eventSlug, name: row.eventName },
      rank: index + 1,
    })
  );

  const flatCandidates = [
    ...categoriesWithCandidates.flatMap((cat) => cat.candidates),
    ...uncategorizedCandidates,
  ];

  return {
    ...event,
    categories: categoriesWithCandidates,
    candidates: flatCandidates,
    uncategorizedCandidates,
    gallery: camelRows(gallery),
    _count: { candidates: candidateCount },
  };
}

export async function findOngoingEvents(limit = 6) {
  const sql = limit
    ? `SELECT e.*,
        (SELECT COUNT(*) FROM \`candidate\` c WHERE c.event_id = e.id) AS candidate_count
       FROM \`event\` e
       WHERE e.published = 1 AND e.archived = 0 AND e.status = 'ONGOING'
       ORDER BY e.date ASC LIMIT ?`
    : `SELECT e.*,
        (SELECT COUNT(*) FROM \`candidate\` c WHERE c.event_id = e.id) AS candidate_count
       FROM \`event\` e
       WHERE e.published = 1 AND e.archived = 0 AND e.status = 'ONGOING'
       ORDER BY e.date ASC`;
  const rows = await query<RowDataPacket>(sql, limit ? [limit] : []);
  return camelRows<EventRow>(rows).map((row) =>
    withCounts(stripCountFields(row))
  );
}

export async function findPublishedEvents(limit?: number) {
  const sql = limit
    ? `SELECT e.*,
        (SELECT COUNT(*) FROM \`candidate\` c WHERE c.event_id = e.id) AS candidate_count
       FROM \`event\` e
       WHERE e.published = 1 AND e.archived = 0
       ORDER BY e.date ASC LIMIT ?`
    : `SELECT e.*,
        (SELECT COUNT(*) FROM \`candidate\` c WHERE c.event_id = e.id) AS candidate_count
       FROM \`event\` e
       WHERE e.published = 1 AND e.archived = 0
       ORDER BY e.date ASC`;
  const rows = await query<RowDataPacket>(sql, limit ? [limit] : []);
  return camelRows<EventRow>(rows).map((row) =>
    withCounts(stripCountFields(row))
  );
}

export async function findPublicEvents(votableOnly: boolean) {
  const where = votableOnly
    ? "published = 1 AND archived = 0 AND blocked = 0"
    : "published = 1 AND archived = 0";
  const rows = await query<RowDataPacket>(
    `SELECT id, name, slug, vote_price, date, location, status
     FROM \`event\` WHERE ${where}
     ORDER BY date DESC`
  );
  return camelRows(rows);
}
