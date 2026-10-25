import type { RowDataPacket } from "mysql2/promise";
import { countTable, execute, query, queryOne, withTransaction, type DbConn } from "../connection";
import { buildInsert, camelKeys, camelRows, newId } from "../helpers";
import { findByField, findById, updateRow } from "../crud";

export async function findPaymentById(id: string) {
  return findById<Record<string, unknown>>("payment", id);
}

export async function findPaymentByReference(reference: string) {
  return findByField<Record<string, unknown>>("payment", "reference", reference);
}

export async function findPaymentWithRelations(id: string): Promise<Record<string, unknown> | null> {
  const payment = await findPaymentById(id);
  if (!payment) return null;

  const vote = await queryOne<RowDataPacket>(
    `SELECT * FROM \`vote\` WHERE payment_id = ?`,
    [id]
  );
  const ticketOrder = await queryOne<RowDataPacket>(
    `SELECT * FROM \`ticket_order\` WHERE payment_id = ?`,
    [id]
  );
  let items: RowDataPacket[] = [];
  if (ticketOrder) {
    items = await query<RowDataPacket>(
      `SELECT * FROM \`ticket_order_item\` WHERE ticket_order_id = ?`,
      [ticketOrder.id]
    );
  }

  return {
    ...payment,
    vote: camelKeys(vote),
    ticketOrder: ticketOrder
      ? { ...camelKeys(ticketOrder)!, items: camelRows(items) }
      : null,
  };
}

export async function findPaymentByReferenceWithRelations(reference: string) {
  const payment = await findPaymentByReference(reference);
  if (!payment) return null;
  return findPaymentWithRelations(payment.id as string);
}

export async function createPayment(data: Record<string, unknown>, conn?: DbConn) {
  const id = newId();
  const { sql, values } = buildInsert("payment", { ...data, id });
  await execute(sql, values, conn);
  return findById("payment", id);
}

export async function createVote(data: Record<string, unknown>, conn?: DbConn) {
  const id = newId();
  const { sql, values } = buildInsert("vote", { ...data, id });
  await execute(sql, values, conn);
  return findById("vote", id);
}

export async function createTicketOrder(
  data: Record<string, unknown>,
  items: { ticketId: string; quantity: number; unitPrice: number; subtotal: number }[],
  conn?: DbConn
) {
  const orderId = newId();
  const { sql, values } = buildInsert("ticket_order", { ...data, id: orderId });
  await execute(sql, values, conn);
  for (const item of items) {
    const { sql: isql, values: ivals } = buildInsert("ticket_order_item", {
      id: newId(),
      ticketOrderId: orderId,
      ...item,
    });
    await execute(isql, ivals, conn);
  }
  const order = await findByIdConn<Record<string, unknown>>("ticket_order", orderId, conn);
  const orderItems = await query<RowDataPacket>(
    `SELECT * FROM \`ticket_order_item\` WHERE ticket_order_id = ?`,
    [orderId],
    conn
  );
  return { ...order, items: camelRows(orderItems) };
}

export async function findTicketOrderByPaymentId(paymentId: string) {
  return findByField<Record<string, unknown>>("ticket_order", "payment_id", paymentId);
}

async function findByIdConn<T>(table: string, id: string, conn?: DbConn): Promise<T | null> {
  if (!conn) return findById<T>(table, id);
  const row = await queryOne<RowDataPacket>(`SELECT * FROM \`${table}\` WHERE id = ?`, [id], conn);
  return camelKeys<T>(row);
}

export async function findRecentPendingPayment(filters: {
  type: string;
  eventId: string;
  customerEmail: string;
  amount: number;
  since: Date;
}) {
  const row = await queryOne<RowDataPacket>(
    `SELECT * FROM \`payment\`
     WHERE type = ? AND status = 'PENDING' AND event_id = ? AND customer_email = ?
       AND amount = ? AND created_at >= ?
     ORDER BY created_at DESC LIMIT 1`,
    [filters.type, filters.eventId, filters.customerEmail, filters.amount, filters.since]
  );
  return camelKeys(row);
}

export async function findCandidateForVote(candidateId: string, eventId: string) {
  const row = await queryOne<RowDataPacket>(
    `SELECT * FROM \`candidate\`
     WHERE id = ? AND event_id = ? AND published = 1 AND status = 'APPROVED'`,
    [candidateId, eventId]
  );
  return camelKeys(row);
}

export async function findActiveTicket(ticketId: string, eventId: string) {
  const row = await queryOne<RowDataPacket>(
    `SELECT * FROM \`ticket\` WHERE id = ? AND event_id = ? AND active = 1`,
    [ticketId, eventId]
  );
  return camelKeys(row);
}

export async function updatePayment(id: string, data: Record<string, unknown>, conn?: DbConn) {
  return updateRow("payment", id, data, conn);
}

export async function updateVote(id: string, data: Record<string, unknown>, conn?: DbConn) {
  return updateRow("vote", id, data, conn);
}

export async function updateTicketOrder(id: string, data: Record<string, unknown>, conn?: DbConn) {
  return updateRow("ticket_order", id, data, conn);
}

export async function finalizePaidPaymentTx(
  paymentId: string,
  payment: {
    type: string;
    eventId?: string | null;
    vote?: { id: string; candidateId: string; voteCount: number } | null;
    ticketOrder?: { id: string; items: { ticketId: string; quantity: number }[] } | null;
  },
  qrCode?: string
) {
  return withTransaction(async (conn) => {
    const [result] = await conn.execute<import("mysql2/promise").ResultSetHeader>(
      `UPDATE \`payment\` SET status = 'PAID', paid_at = ? WHERE id = ? AND status = 'PENDING'`,
      [new Date(), paymentId]
    );
    if (result.affectedRows === 0) {
      return findPaymentById(paymentId);
    }

    if (payment.type === "VOTE" && payment.vote) {
      await conn.execute(`UPDATE \`vote\` SET status = 'PAID' WHERE id = ?`, [payment.vote.id]);
      await conn.execute(
        `UPDATE \`candidate\` SET vote_count = vote_count + ? WHERE id = ?`,
        [payment.vote.voteCount, payment.vote.candidateId]
      );
    }

    if (payment.type === "TICKET" && payment.ticketOrder) {
      await conn.execute(
        `UPDATE \`ticket_order\` SET status = 'PAID', qr_code = ? WHERE id = ?`,
        [qrCode ?? null, payment.ticketOrder.id]
      );
      for (const item of payment.ticketOrder.items) {
        await conn.execute(
          `UPDATE \`ticket\` SET sold = sold + ? WHERE id = ?`,
          [item.quantity, item.ticketId]
        );
      }
    }

    return findPaymentById(paymentId);
  });
}

export async function markPaymentFailedTx(
  payment: {
    id: string;
    vote?: { id: string } | null;
    ticketOrder?: { id: string } | null;
  },
  status: "FAILED" | "CANCELLED"
) {
  return withTransaction(async (conn) => {
    await conn.execute(`UPDATE \`payment\` SET status = ? WHERE id = ?`, [status, payment.id]);
    if (payment.vote) {
      await conn.execute(`UPDATE \`vote\` SET status = ? WHERE id = ?`, [status, payment.vote.id]);
    }
    if (payment.ticketOrder) {
      await conn.execute(`UPDATE \`ticket_order\` SET status = ? WHERE id = ?`, [
        status,
        payment.ticketOrder.id,
      ]);
    }
  });
}

export async function cancelPendingPaymentsByReference(reference: string) {
  await execute(
    `UPDATE \`payment\` SET status = 'CANCELLED' WHERE reference = ? AND status = 'PENDING'`,
    [reference]
  );
}

export async function getTicketOrderForVerify(reference: string): Promise<Record<string, unknown> | null> {
  const order = await findByField<Record<string, unknown>>("ticket_order", "reference", reference);
  if (!order) return null;

  const event = await query<RowDataPacket>(
    `SELECT name, date, location FROM \`event\` WHERE id = ?`,
    [order.eventId]
  );
  const items = await query<RowDataPacket>(
    `SELECT oi.*, t.name AS ticket_name
     FROM \`ticket_order_item\` oi
     JOIN \`ticket\` t ON t.id = oi.ticket_id
     WHERE oi.ticket_order_id = ?`,
    [order.id]
  );

  return {
    ...order,
    event: camelKeys(event[0]),
    items: items.map((row) => ({
      ...(camelKeys(row) as Record<string, unknown>),
      ticket: { name: row.ticket_name },
    })),
  };
}

export async function validateTicketOrder(id: string) {
  return updateRow("ticket_order", id, {
    status: "VALIDATED",
    validatedAt: new Date(),
  });
}

export async function findPaymentsAdminList(
  skip: number,
  take: number,
  filters: { eventId?: string; status?: string }
) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  if (filters.eventId) {
    conditions.push("p.event_id = ?");
    params.push(filters.eventId);
  }
  if (filters.status) {
    conditions.push("p.status = ?");
    params.push(filters.status);
  }
  const where = conditions.join(" AND ");

  const [rows, total] = await Promise.all([
    query<RowDataPacket>(
      `SELECT p.*,
        e.name AS event_name,
        v.vote_count,
        c.name AS candidate_name,
        to_ref.reference AS ticket_order_reference
       FROM \`payment\` p
       LEFT JOIN \`event\` e ON e.id = p.event_id
       LEFT JOIN \`vote\` v ON v.payment_id = p.id
       LEFT JOIN \`candidate\` c ON c.id = v.candidate_id
       LEFT JOIN \`ticket_order\` to_ref ON to_ref.payment_id = p.id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, take, skip]
    ),
    countTable(
      "payment",
      where.replace(/p\./g, "").replace(/p\./g, ""),
      params
    ),
  ]);

  const items = rows.map((row) => {
    const payment = camelKeys(row)! as Record<string, unknown>;
    const { eventName, voteCount, candidateName, ticketOrderReference, ...rest } = payment;
    return {
      ...rest,
      event: eventName ? { name: eventName } : null,
      vote:
        voteCount != null
          ? { voteCount, candidate: candidateName ? { name: candidateName } : null }
          : null,
      ticketOrder: ticketOrderReference ? { reference: ticketOrderReference } : null,
    };
  });

  return { items, total };
}

export async function getPaymentConfirmationByReference(reference: string) {
  const payment = await findPaymentByReferenceWithRelations(reference);
  if (!payment) return null;
  if (payment.vote) {
    const candidate = await findById("candidate", (payment.vote as PayRow).candidateId as string);
    const event = payment.eventId
      ? await findById("event", payment.eventId as string)
      : null;
    return {
      ...payment,
      vote: { ...(payment.vote as object), candidate, event },
    };
  }
  return payment;
}

type PayRow = Record<string, unknown>;

/** Paiement déjà PAYÉ avec cette transaction KKiaPay (hors paiement courant) — anti-rejeu. */
export async function findOtherPaidPaymentByTransaction(transactionId: string, excludeId: string) {
  const row = await queryOne<RowDataPacket>(
    `SELECT id, reference FROM \`payment\`
     WHERE fispay_ref = ? AND id != ? AND status = 'PAID' LIMIT 1`,
    [transactionId, excludeId]
  );
  return camelKeys<{ id: string; reference: string }>(row);
}

export async function findPaymentByTransactionId(transactionId: string) {
  return findByField<Record<string, unknown>>("payment", "fispay_ref", transactionId);
}

export async function findPendingVotePaymentsForReconcile(limit = 500, since?: Date) {
  const rows = await query<RowDataPacket>(
    `SELECT p.id, p.reference, p.fispay_ref, p.amount, p.created_at
     FROM \`payment\` p
     JOIN \`vote\` v ON v.payment_id = p.id
     WHERE p.type = 'VOTE' AND p.status = 'PENDING'
       AND p.fispay_ref IS NOT NULL AND p.fispay_ref != ''
       AND p.created_at >= ?
     ORDER BY p.created_at ASC
     LIMIT ?`,
    [since ?? new Date(0), limit]
  );
  return camelRows(rows) as Array<{
    id: string;
    reference: string;
    fispayRef: string | null;
    amount: number;
    createdAt: string;
  }>;
}

export async function getVoteReconcileStats() {
  const [paidVotes, candidateSum, pendingPayments, pendingWithTxn] = await Promise.all([
    queryOne<RowDataPacket & { total: number | null }>(
      `SELECT COALESCE(SUM(vote_count), 0) AS total FROM \`vote\` WHERE status = 'PAID'`
    ),
    queryOne<RowDataPacket & { total: number | null }>(
      `SELECT COALESCE(SUM(vote_count), 0) AS total FROM \`candidate\``
    ),
    countTable("payment", "type = 'VOTE' AND status = 'PENDING'"),
    queryOne<RowDataPacket & { total: number | null }>(
      `SELECT COUNT(*) AS total FROM \`payment\`
       WHERE type = 'VOTE' AND status = 'PENDING' AND fispay_ref IS NOT NULL AND fispay_ref != ''`
    ),
  ]);

  const paidVoteTotal = Number(paidVotes?.total ?? 0);
  const candidateVoteTotal = Number(candidateSum?.total ?? 0);

  return {
    paidVoteTotal,
    candidateVoteTotal,
    voteCountDrift: candidateVoteTotal - paidVoteTotal,
    pendingPayments,
    pendingWithTransaction: Number(pendingWithTxn?.total ?? 0),
  };
}

export async function syncAllCandidateVoteCounts() {
  const result = await execute(
    `UPDATE \`candidate\` c
     SET vote_count = (
       SELECT COALESCE(SUM(v.vote_count), 0)
       FROM \`vote\` v
       WHERE v.candidate_id = c.id AND v.status = 'PAID'
     )`
  );
  return result.affectedRows ?? 0;
}

export async function getTicketOrderConfirmationByReference(orderRef: string) {
  const order = await findByField<Record<string, unknown>>("ticket_order", "reference", orderRef);
  if (!order) return null;
  const [event, items, payment] = await Promise.all([
    findById("event", order.eventId as string),
    query<RowDataPacket>(
      `SELECT oi.*, t.name AS ticket_name FROM \`ticket_order_item\` oi
       JOIN \`ticket\` t ON t.id = oi.ticket_id WHERE oi.ticket_order_id = ?`,
      [order.id]
    ),
    findById("payment", order.paymentId as string),
  ]);
  return {
    ...order,
    event,
    payment,
    items: items.map((row) => ({
      ...(camelKeys(row) as object),
      ticket: { name: row.ticket_name },
    })),
  };
}
