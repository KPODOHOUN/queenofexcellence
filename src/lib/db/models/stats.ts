import type { RowDataPacket } from "mysql2/promise";
import { countTable, isDatabaseConfigured, query, queryOne } from "../connection";
import { camelKeys } from "../helpers";
import { upsertByField } from "../crud";

export type PaymentSummary = {
  id: string;
  customerName: string | null;
  reference: string;
  amount: number;
  status: string;
  event: { name: string } | null;
};

export type VoteActivity = {
  id: string;
  voteCount: number;
  status: string;
  candidate: { name: string };
  event: { name: string };
};

export async function getSiteStats() {
  if (!isDatabaseConfigured()) {
    return { events: 0, candidates: 0, votes: 0, partners: 0, ticketsSold: 0 };
  }
  try {
    const [eventCount, candidateCount, voteSum, partnerCount, ticketSold] =
      await Promise.all([
        countTable("event", "published = 1 AND archived = 0"),
        countTable("candidate", "published = 1 AND status = 'APPROVED'"),
        queryOne<RowDataPacket & { total: number | null }>(
          `SELECT SUM(vote_count) AS total FROM \`vote\` WHERE status = 'PAID'`
        ),
        countTable("partner", "published = 1"),
        countTable("ticket_order", "status = 'PAID'"),
      ]);

    return {
      events: eventCount,
      candidates: candidateCount,
      votes: Number(voteSum?.total ?? 0),
      partners: partnerCount,
      ticketsSold: ticketSold,
    };
  } catch (error) {
    console.error("getSiteStats:", error);
    return { events: 0, candidates: 0, votes: 0, partners: 0, ticketsSold: 0 };
  }
}

export async function getSiteContent(key: string) {
  if (!isDatabaseConfigured()) return null;
  try {
    const row = await queryOne<RowDataPacket>(
      `SELECT * FROM \`site_content\` WHERE \`key\` = ?`,
      [key]
    );
    const content = camelKeys<{ value: string }>(row);
    if (!content) return null;
    try {
      return JSON.parse(content.value);
    } catch {
      return content.value;
    }
  } catch (error) {
    console.error(`getSiteContent("${key}"):`, error);
    return null;
  }
}

export async function setSiteContent(key: string, value: unknown) {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  return upsertByField("site_content", "key", { key, value: stringValue });
}

export async function getAdminStats() {
  if (!isDatabaseConfigured()) {
    return {
      revenue: 0,
      events: 0,
      candidates: 0,
      votes: 0,
      ticketsSold: 0,
      recentPayments: [],
      recentActivity: [],
    };
  }
  const [revenue, eventCount, candidateCount, voteSum, ticketSold, recentPayments, recentActivity] =
    await Promise.all([
      queryOne<RowDataPacket & { total: number | null }>(
        `SELECT SUM(amount) AS total FROM \`payment\` WHERE status = 'PAID'`
      ),
      countTable("event"),
      countTable("candidate"),
      queryOne<RowDataPacket & { total: number | null }>(
        `SELECT SUM(vote_count) AS total FROM \`vote\` WHERE status = 'PAID'`
      ),
      countTable("ticket_order", "status = 'PAID'"),
      query<RowDataPacket>(
        `SELECT p.*, e.name AS event_name FROM \`payment\` p
         LEFT JOIN \`event\` e ON e.id = p.event_id
         ORDER BY p.created_at DESC LIMIT 10`
      ),
      query<RowDataPacket>(
        `SELECT v.*, c.name AS candidate_name, e.name AS event_name
         FROM \`vote\` v
         JOIN \`candidate\` c ON c.id = v.candidate_id
         JOIN \`event\` e ON e.id = v.event_id
         ORDER BY v.created_at DESC LIMIT 10`
      ),
    ]);

  return {
    revenue: Number(revenue?.total ?? 0),
    events: eventCount,
    candidates: candidateCount,
    votes: Number(voteSum?.total ?? 0),
    ticketsSold: ticketSold,
    recentPayments: recentPayments.map((row) => {
      const p = camelKeys(row)! as Record<string, unknown>;
      const { eventName, ...rest } = p;
      return {
        ...rest,
        event: eventName ? { name: String(eventName) } : null,
      } as PaymentSummary;
    }),
    recentActivity: recentActivity.map((row) => {
      const v = camelKeys(row)! as Record<string, unknown>;
      const { candidateName, eventName, ...rest } = v;
      return {
        ...rest,
        candidate: { name: String(candidateName ?? "") },
        event: { name: String(eventName ?? "") },
      } as VoteActivity;
    }),
  };
}
