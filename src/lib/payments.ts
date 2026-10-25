import { paymentAmountMatches } from "@/lib/kkiapay/amount";
import { verifyKkiapayTransaction, getVoteWidgetConfig, isKkiapayConfigured } from "@/lib/kkiapay/client";
import { isLocalPaymentSandboxEnabled } from "@/lib/kkiapay/config";
import { normalizeKkiapayStatus, verifyKkiapayWebhookSecret } from "@/lib/kkiapay/config";
import { getEventForTicketing, getEventForVoting } from "@/lib/events";
import { generateReference } from "@/lib/utils";
import QRCode from "qrcode";
import {
  createPayment,
  createTicketOrder,
  createVote,
  findActiveTicket,
  findCandidateForVote,
  findPaymentById,
  findPaymentByReferenceWithRelations,
  findPaymentWithRelations,
  findOtherPaidPaymentByTransaction,
  findPaymentByTransactionId,
  findRecentPendingPayment,
  finalizePaidPaymentTx,
  findPendingVotePaymentsForReconcile,
  getVoteReconcileStats,
  markPaymentFailedTx,
  syncAllCandidateVoteCounts,
  updatePayment,
  updateTicketOrder,
  updateVote,
} from "@/lib/db/models/payments";

const DEDUP_WINDOW_MS = 3 * 60 * 1000;

export class AppError extends Error {}

type PayRow = Record<string, unknown>;

function resolveVoterEmail(voterEmail?: string, voterPhone?: string): string {
  const email = voterEmail?.trim();
  if (email) return email;
  const digits = (voterPhone ?? "").replace(/\D/g, "");
  if (digits.length >= 8) return `vote.${digits}@queenofexcellence.local`;
  throw new AppError("Téléphone invalide");
}

export async function createVotePayment({
  eventId,
  candidateId,
  voteCount,
  voterName,
  voterEmail,
  voterPhone,
}: {
  eventId: string;
  candidateId: string;
  voteCount: number;
  voterName: string;
  voterEmail?: string;
  voterPhone: string;
}) {
  const email = resolveVoterEmail(voterEmail, voterPhone);
  const { event, error } = await getEventForVoting(eventId);
  if (!event) throw new AppError(error);

  const candidate = await findCandidateForVote(candidateId, eventId);
  if (!candidate) throw new AppError("Candidate introuvable");

  const amount = voteCount * Number((event as PayRow).votePrice ?? 500);

  const recentPending = (await findRecentPendingPayment({
    type: "VOTE",
    eventId,
    customerEmail: email,
    amount,
    since: new Date(Date.now() - DEDUP_WINDOW_MS),
  })) as PayRow | null;

  if (recentPending) {
    const meta = recentPending.metadata ? JSON.parse(String(recentPending.metadata)) : {};
    if (meta.candidateId === candidateId && meta.voteCount === voteCount) {
      return {
        ...getVoteWidgetConfig(String(recentPending.reference), Number(recentPending.amount)),
        reference: recentPending.reference,
        amount: recentPending.amount,
        voteId: meta.voteId,
      };
    }
  }

  const reference = generateReference("VOTE");

  const payment = (await createPayment({
    reference,
    amount,
    type: "VOTE",
    status: "PENDING",
    customerName: voterName,
    customerEmail: email,
    customerPhone: voterPhone,
    eventId,
    metadata: JSON.stringify({ candidateId, voteCount }),
  })) as PayRow;

  const vote = (await createVote({
    eventId,
    candidateId,
    paymentId: payment!.id,
    voteCount,
    amount,
    status: "PENDING",
    voterName,
    voterEmail: email,
    voterPhone,
  })) as PayRow;

  if (!isKkiapayConfigured()) {
    if (isLocalPaymentSandboxEnabled()) {
      await updatePayment(payment!.id as string, {
        metadata: JSON.stringify({
          candidateId,
          voteCount,
          voteId: vote!.id,
          provider: "sandbox",
        }),
      });
      return {
        reference,
        amount,
        publicKey: "",
        sandbox: true,
        configured: false,
        sandboxUrl: `/api/payments/sandbox?ref=${reference}`,
        voteId: vote!.id,
      };
    }
    await updatePayment(payment!.id as string, { status: "FAILED" });
    await updateVote(vote!.id as string, { status: "FAILED" });
    throw new AppError(
      "Paiement indisponible : configurez KKIAPAY_PUBLIC_KEY, KKIAPAY_PRIVATE_KEY et KKIAPAY_SECRET."
    );
  }

  await updatePayment(payment!.id as string, {
    metadata: JSON.stringify({
      candidateId,
      voteCount,
      voteId: vote!.id,
      provider: "kkiapay",
    }),
  });

  return {
    ...getVoteWidgetConfig(reference, amount),
    reference,
    amount,
    voteId: vote!.id,
  };
}

export async function createTicketPayment({
  eventId,
  items,
  customerName,
  customerEmail,
  customerPhone,
}: {
  eventId: string;
  items: { ticketId: string; quantity: number }[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}) {
  const { event, error } = await getEventForTicketing(eventId);
  if (!event) throw new AppError(error);

  let totalAmount = 0;
  const orderItems: {
    ticketId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[] = [];

  for (const item of items) {
    const ticket = await findActiveTicket(item.ticketId, eventId);
    if (!ticket) throw new AppError(`Billet introuvable: ${item.ticketId}`);
    const t = ticket as { sold: number; quantity: number; name: string; price: number; id: string };
    if (t.sold + item.quantity > t.quantity) {
      throw new AppError(`Stock insuffisant pour ${t.name}`);
    }
    const subtotal = t.price * item.quantity;
    totalAmount += subtotal;
    orderItems.push({
      ticketId: t.id,
      quantity: item.quantity,
      unitPrice: t.price,
      subtotal,
    });
  }

  const itemsSignature = [...orderItems]
    .sort((a, b) => a.ticketId.localeCompare(b.ticketId))
    .map((i) => `${i.ticketId}:${i.quantity}`)
    .join(",");

  const recentPending = (await findRecentPendingPayment({
    type: "TICKET",
    eventId,
    customerEmail,
    amount: totalAmount,
    since: new Date(Date.now() - DEDUP_WINDOW_MS),
  })) as PayRow | null;

  if (recentPending) {
    const meta = recentPending.metadata ? JSON.parse(String(recentPending.metadata)) : {};
    const existingSignature = Array.isArray(meta.items)
      ? [...meta.items]
          .sort((a: { ticketId: string }, b: { ticketId: string }) =>
            a.ticketId.localeCompare(b.ticketId)
          )
          .map((i: { ticketId: string; quantity: number }) => `${i.ticketId}:${i.quantity}`)
          .join(",")
      : null;
    if (existingSignature === itemsSignature && meta.orderId) {
      return {
        ...getVoteWidgetConfig(String(recentPending.reference), Number(recentPending.amount)),
        reference: meta.orderRef,
        paymentReference: recentPending.reference,
        amount: recentPending.amount,
        orderId: meta.orderId,
      };
    }
  }

  const reference = generateReference("TICKET");
  const orderRef = generateReference("ORD");

  const payment = (await createPayment({
    reference,
    amount: totalAmount,
    type: "TICKET",
    status: "PENDING",
    customerName,
    customerEmail,
    customerPhone,
    eventId,
    metadata: JSON.stringify({ orderRef, items: orderItems }),
  })) as PayRow;

  const ticketOrder = (await createTicketOrder(
    {
      reference: orderRef,
      eventId,
      paymentId: payment!.id,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      status: "PENDING",
    },
    orderItems
  )) as PayRow & { items: unknown[] };

  if (!isKkiapayConfigured()) {
    await updatePayment(payment!.id as string, { status: "FAILED" });
    await updateTicketOrder(ticketOrder.id as string, { status: "FAILED" });
    throw new AppError("Paiement indisponible : KKiaPay non configuré.");
  }

  await updatePayment(payment!.id as string, {
    metadata: JSON.stringify({
      orderRef,
      items: orderItems,
      orderId: ticketOrder.id,
      provider: "kkiapay",
    }),
  });

  return {
    ...getVoteWidgetConfig(reference, totalAmount),
    reference: orderRef,
    paymentReference: reference,
    amount: totalAmount,
    orderId: ticketOrder.id,
  };
}

export async function finalizePaidPayment(paymentId: string) {
  const payment = (await findPaymentWithRelations(paymentId)) as PayRow | null;

  if (!payment || payment.status === "PAID") {
    return payment;
  }

  try {
    let qrCode: string | undefined;
    if (payment.type === "TICKET" && payment.ticketOrder) {
      const order = payment.ticketOrder as { reference: string; totalAmount: number };
      const qrData = JSON.stringify({
        ref: order.reference,
        event: payment.eventId,
        amount: order.totalAmount,
        ts: Date.now(),
      });
      qrCode = await QRCode.toDataURL(qrData);
    }

    return await finalizePaidPaymentTx(
      paymentId,
      {
        type: payment.type as string,
        eventId: payment.eventId as string | null,
        vote: payment.vote as {
          id: string;
          candidateId: string;
          voteCount: number;
        } | null,
        ticketOrder: payment.ticketOrder as {
          id: string;
          items: { ticketId: string; quantity: number }[];
        } | null,
      },
      qrCode
    );
  } catch (error) {
    console.error("finalizePaidPayment:", paymentId, error);
    return findPaymentById(paymentId);
  }
}

/** Montant KKiaPay acceptable : tolère frais/arrondis (≤ 5 %), refuse un sous-paiement. */
function isAmountAcceptable(expected: number, actual: unknown): boolean {
  if (actual === undefined || actual === null || actual === "") return true;
  if (paymentAmountMatches(expected, actual)) return true;
  const a = Number(actual);
  if (Number.isNaN(a)) return true;
  return a >= expected * 0.95;
}

export async function confirmPaymentByTransaction(
  reference: string,
  transactionId: string
) {
  const payment = (await findPaymentByReferenceWithRelations(reference)) as PayRow | null;
  if (!payment) throw new AppError("Paiement introuvable");
  if (payment.status === "PAID") {
    return { alreadyPaid: true, payment, verified: true };
  }
  if (payment.status !== "PENDING") {
    return { alreadyPaid: false, payment, verified: false };
  }

  const reused = await findOtherPaidPaymentByTransaction(transactionId, payment.id as string);
  if (reused) {
    console.warn("KKiaPay transaction déjà utilisée:", transactionId, "par", reused.reference);
    return {
      alreadyPaid: false,
      payment,
      verified: false,
      error: "Transaction déjà utilisée pour un autre paiement",
    };
  }

  // Mémoriser la transaction AVANT vérification : si KKiaPay répond encore
  // « PENDING » (fréquent en Mobile Money), la réconciliation automatique
  // pourra re-vérifier plus tard au lieu de perdre le vote.
  if (!payment.fispayRef) {
    await updatePayment(payment.id as string, { fispayRef: transactionId });
  }

  const verification = await verifyKkiapayTransaction(transactionId);
  if (verification.status !== "paid") {
    return {
      alreadyPaid: false,
      payment,
      verified: false,
      error: verification.error || "Paiement non confirmé",
    };
  }

  if (!isAmountAcceptable(Number(payment.amount), verification.amount)) {
    console.warn(
      "KKiaPay montant insuffisant:",
      payment.reference,
      "attendu",
      payment.amount,
      "reçu",
      verification.amount
    );
    return {
      alreadyPaid: false,
      payment,
      verified: false,
      error: "Montant payé insuffisant",
    };
  }

  if (payment.fispayRef && payment.fispayRef !== transactionId) {
    await updatePayment(payment.id as string, { fispayRef: transactionId });
  }

  const updated = await finalizePaidPayment(payment.id as string);
  const finalized = (updated as PayRow | null)?.status === "PAID";
  return {
    alreadyPaid: false,
    payment: updated,
    verified: finalized,
    error: finalized ? undefined : "Finalisation du paiement échouée",
  };
}

export async function confirmPayment(reference: string) {
  const payment = (await findPaymentByReferenceWithRelations(reference)) as PayRow | null;

  if (!payment) throw new AppError("Paiement introuvable");
  if (payment.status === "PAID") {
    return { alreadyPaid: true, payment, verified: true };
  }

  if (payment.status !== "PENDING") {
    return { alreadyPaid: false, payment, verified: false };
  }

  const transactionId = payment.fispayRef as string | undefined;
  if (!transactionId) {
    return { alreadyPaid: false, payment, verified: false };
  }

  return confirmPaymentByTransaction(reference, transactionId);
}

async function markPaymentFailed(reference: string, status: "FAILED" | "CANCELLED") {
  const payment = (await findPaymentByReferenceWithRelations(reference)) as PayRow | null;
  if (!payment || payment.status !== "PENDING") return;

  await markPaymentFailedTx(
    {
      id: payment.id as string,
      vote: payment.vote as { id: string } | null,
      ticketOrder: payment.ticketOrder as { id: string } | null,
    },
    status
  );
}

export async function processWebhook(
  payload: string,
  signature: string
): Promise<{ success: boolean; message: string }> {
  let data: {
    transactionId?: string;
    isPaymentSucces?: boolean;
    amount?: number;
    partnerId?: string;
    event?: string;
  };

  try {
    data = JSON.parse(payload);
  } catch {
    return { success: false, message: "Payload JSON invalide" };
  }

  const transactionId = data.transactionId;
  if (!transactionId) {
    return { success: false, message: "Transaction manquante" };
  }

  let reference = data.partnerId;
  if (!reference) {
    const byTxn = await findPaymentByTransactionId(transactionId);
    reference = byTxn?.reference as string | undefined;
  }
  if (!reference) {
    return { success: false, message: "Référence manquante" };
  }

  const signatureValid = verifyKkiapayWebhookSecret(signature || null);
  if (!signatureValid) {
    console.warn(
      "Webhook KKiaPay : secret absent/différent — vérification via l'API KKiaPay.",
      reference
    );
  }

  const status = normalizeKkiapayStatus(data.isPaymentSucces);

  // Succès (ou webhook non signé) : la décision vient TOUJOURS de l'API KKiaPay,
  // jamais du seul contenu du webhook.
  if (status === "paid" || !signatureValid) {
    const payment = await findPaymentByReferenceWithRelations(reference);
    if (!payment) {
      return { success: false, message: "Paiement introuvable" };
    }
    if (payment.status === "PAID") {
      return { success: true, message: "Déjà traité" };
    }
    const result = await confirmPaymentByTransaction(reference, transactionId);
    if (result.verified) {
      return { success: true, message: "Paiement confirmé par KKiaPay" };
    }
    if (status === "paid") {
      // Transaction mémorisée : la réconciliation automatique réessaiera.
      return { success: true, message: result.error || "En attente de confirmation KKiaPay" };
    }
    return { success: true, message: "Webhook ignoré (non signé, non payé)" };
  }

  if (status === "failed" || status === "cancelled") {
    await markPaymentFailed(reference, status === "cancelled" ? "CANCELLED" : "FAILED");
    return { success: true, message: "Statut mis à jour" };
  }

  return { success: true, message: "Événement en attente ignoré" };
}

export async function adminForceFinalizePayment(reference: string) {
  const payment = (await findPaymentByReferenceWithRelations(reference)) as PayRow | null;
  if (!payment) throw new AppError("Paiement introuvable");
  if (payment.status === "PAID") {
    return { alreadyPaid: true, payment, verified: true };
  }
  if (payment.status !== "PENDING" || payment.type !== "VOTE") {
    throw new AppError("Seuls les paiements de vote en attente peuvent être finalisés");
  }
  const updated = await finalizePaidPayment(payment.id as string);
  const verified = (updated as PayRow | null)?.status === "PAID";
  if (!verified) throw new AppError("Finalisation échouée");
  return { alreadyPaid: false, payment: updated, verified: true };
}

/**
 * Re-vérifie auprès de KKiaPay les paiements de vote PENDING dont on connaît
 * la transaction. Appelé automatiquement en tâche de fond (instrumentation.ts)
 * et par le bouton admin « Réconcilier ».
 */
export async function retryPendingVotePayments(options?: { limit?: number; since?: Date }) {
  let retried = 0;
  let confirmed = 0;
  let retryFailed = 0;

  const rows = await findPendingVotePaymentsForReconcile(options?.limit ?? 500, options?.since);
  for (const row of rows) {
    if (!row.fispayRef) continue;
    retried++;
    try {
      const result = await confirmPaymentByTransaction(row.reference, row.fispayRef);
      if (result.verified) confirmed++;
      else retryFailed++;
    } catch (error) {
      retryFailed++;
      console.error("reconcile retry:", row.reference, error);
    }
  }

  return { retried, confirmed, retryFailed };
}

export async function reconcileVotePayments(options?: {
  limit?: number;
  forceReferences?: string[];
}) {
  const limit = options?.limit ?? 500;
  const statsBefore = await getVoteReconcileStats();

  let retried = 0;
  let confirmed = 0;
  let retryFailed = 0;

  const retry = await retryPendingVotePayments({ limit });
  retried = retry.retried;
  confirmed = retry.confirmed;
  retryFailed = retry.retryFailed;

  let forceFinalized = 0;
  let forceFailed = 0;
  for (const reference of options?.forceReferences ?? []) {
    try {
      const result = await adminForceFinalizePayment(reference);
      if (result.verified) forceFinalized++;
      else forceFailed++;
    } catch (error) {
      forceFailed++;
      console.error("force finalize:", reference, error);
    }
  }

  const candidatesUpdated = await syncAllCandidateVoteCounts();
  const statsAfter = await getVoteReconcileStats();

  return {
    retried,
    confirmed,
    retryFailed,
    forceFinalized,
    forceFailed,
    candidatesUpdated,
    before: statsBefore,
    after: statsAfter,
  };
}

export { markPaymentFailed };
