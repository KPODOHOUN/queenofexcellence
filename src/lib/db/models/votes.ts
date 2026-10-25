import type { RowDataPacket } from "mysql2/promise";
import { countTable, query } from "../connection";
import { camelKeys } from "../helpers";

export async function findVotesAdminList(
  skip: number,
  take: number,
  filters: { eventId?: string; candidateId?: string }
) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  if (filters.eventId) {
    conditions.push("v.event_id = ?");
    params.push(filters.eventId);
  }
  if (filters.candidateId) {
    conditions.push("v.candidate_id = ?");
    params.push(filters.candidateId);
  }
  const where = conditions.join(" AND ");

  const [rows, total] = await Promise.all([
    query<RowDataPacket>(
      `SELECT v.*,
        c.name AS candidate_name, c.\`number\` AS candidate_number,
        e.name AS event_name,
        p.reference AS payment_reference, p.status AS payment_status
       FROM \`vote\` v
       JOIN \`candidate\` c ON c.id = v.candidate_id
       JOIN \`event\` e ON e.id = v.event_id
       JOIN \`payment\` p ON p.id = v.payment_id
       WHERE ${where}
       ORDER BY v.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, take, skip]
    ),
    countTable(
      "vote",
      where.replace(/\bv\./g, ""),
      params
    ),
  ]);

  const items = rows.map((row) => {
    const vote = camelKeys(row)! as Record<string, unknown>;
    const {
      candidateName,
      candidateNumber,
      eventName,
      paymentReference,
      paymentStatus,
      ...rest
    } = vote;
    return {
      ...rest,
      candidate: { name: candidateName, number: candidateNumber },
      event: { name: eventName },
      payment: { reference: paymentReference, status: paymentStatus },
    };
  });

  return { items, total };
}
