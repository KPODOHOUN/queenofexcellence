import type { RowDataPacket } from "mysql2/promise";
import { query } from "../connection";
import { camelRows } from "../helpers";

/** Événement public enrichi : candidates, billets (prix mini, capacité, vendus). */
export type ShowcaseEvent = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  shortDesc: string | null;
  description: string;
  date: Date | string;
  time: string | null;
  location: string;
  status: string;
  votePrice: number;
  blocked: boolean;
  candidateCount: number;
  minTicketPrice: number | null;
  ticketCapacity: number;
  ticketsSold: number;
  attendanceFrame: string | null;
};

export type ShowcaseCandidate = {
  id: string;
  name: string;
  slug: string;
  number: number;
  photo: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  voteCount: number;
  categoryId: string | null;
  categoryName: string | null;
  event: { id: string; slug: string; name: string; votePrice: number };
};

const EVENT_SELECT = `SELECT e.*,
  (SELECT COUNT(*) FROM \`candidate\` c
     WHERE c.event_id = e.id AND c.published = 1 AND c.status = 'APPROVED') AS candidate_count,
  (SELECT MIN(t.price) FROM \`ticket\` t WHERE t.event_id = e.id AND t.active = 1) AS min_ticket_price,
  (SELECT COALESCE(SUM(t.quantity), 0) FROM \`ticket\` t WHERE t.event_id = e.id AND t.active = 1) AS ticket_capacity,
  (SELECT COALESCE(SUM(t.sold), 0) FROM \`ticket\` t WHERE t.event_id = e.id AND t.active = 1) AS tickets_sold
  FROM \`event\` e`;

function toEvent(row: Record<string, unknown>): ShowcaseEvent {
  return {
    ...(row as unknown as ShowcaseEvent),
    blocked: Boolean(row.blocked),
    votePrice: Number(row.votePrice ?? 500),
    candidateCount: Number(row.candidateCount ?? 0),
    minTicketPrice: row.minTicketPrice == null ? null : Number(row.minTicketPrice),
    ticketCapacity: Number(row.ticketCapacity ?? 0),
    ticketsSold: Number(row.ticketsSold ?? 0),
    attendanceFrame: (row.attendanceFrame as string | null) ?? null,
  };
}

/** Tous les événements publiés, du plus proche au plus lointain. */
export async function findShowcaseEvents(): Promise<ShowcaseEvent[]> {
  const rows = await query<RowDataPacket>(
    `${EVENT_SELECT} WHERE e.published = 1 AND e.archived = 0 ORDER BY e.date ASC`
  );
  return camelRows<Record<string, unknown>>(rows).map(toEvent);
}

/** Événement mis en avant : en cours, sinon le prochain à venir, sinon le plus récent. */
export function pickFeaturedEvent(events: ShowcaseEvent[]): ShowcaseEvent | null {
  const now = Date.now();
  return (
    events.find((e) => e.status === "ONGOING") ??
    events.find((e) => e.status === "UPCOMING" && new Date(e.date).getTime() >= now) ??
    [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ??
    null
  );
}

function toCandidate(row: Record<string, unknown>): ShowcaseCandidate {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    number: Number(row.number),
    photo: (row.photo as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    voteCount: Number(row.voteCount ?? 0),
    categoryId: (row.categoryId as string | null) ?? null,
    categoryName: (row.categoryName as string | null) ?? null,
    event: {
      id: row.eventId as string,
      slug: row.eventSlug as string,
      name: row.eventName as string,
      votePrice: Number(row.eventVotePrice ?? 500),
    },
  };
}

const CANDIDATE_SELECT = `SELECT c.*, e.slug AS event_slug, e.name AS event_name, e.vote_price AS event_vote_price, cat.name AS category_name
  FROM \`candidate\` c
  JOIN \`event\` e ON e.id = c.event_id
  LEFT JOIN \`event_category\` cat ON cat.id = c.category_id
  WHERE c.published = 1 AND c.status = 'APPROVED' AND e.published = 1 AND e.archived = 0`;

/** Candidates d'un événement (ordre : dossard). */
export async function findEventCandidates(eventId: string): Promise<ShowcaseCandidate[]> {
  const rows = await query<RowDataPacket>(`${CANDIDATE_SELECT} AND c.event_id = ? ORDER BY c.\`number\` ASC`, [
    eventId,
  ]);
  return camelRows<Record<string, unknown>>(rows).map(toCandidate);
}

/** Candidates les plus soutenues d'un événement. */
export async function findTopCandidates(eventId: string, limit = 3): Promise<ShowcaseCandidate[]> {
  const rows = await query<RowDataPacket>(
    `${CANDIDATE_SELECT} AND c.event_id = ? ORDER BY c.vote_count DESC, c.\`number\` ASC LIMIT ?`,
    [eventId, limit]
  );
  return camelRows<Record<string, unknown>>(rows).map(toCandidate);
}
