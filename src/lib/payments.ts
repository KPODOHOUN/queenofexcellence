import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { feexpay } from "@/lib/feexpay/client";
import { normalizePaymentStatus } from "@/lib/feexpay/config";
import { getEventForTicketing, getEventForVoting } from "@/lib/events";
import { generateReference } from "@/lib/utils";
import QRCode from "qrcode";

const DEDUP_WINDOW_MS = 3 * 60 * 1000;

/**
 * Erreur "métier" volontaire (stock insuffisant, candidate introuvable, ...) —
 * son message est sûr à renvoyer tel quel au client, contrairement aux
 * erreurs système/Prisma imprévues.
 */
export class AppError extends Error {}

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
  voterEmail: string;
  voterPhone?: string;
}) {
  const { event, error } = await getEventForVoting(eventId);
  if (!event) throw new AppError(error);

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, eventId, published: true, status: "APPROVED" },
  });
  if (!candidate) throw new AppError("Candidate introuvable");

  const amount = voteCount * event.votePrice;

  const recentPending = await prisma.payment.findFirst({
    where: {
      type: "VOTE",
      status: "PENDING",
      eventId,
      customerEmail: voterEmail,
      amount,
      createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentPending) {
    const meta = recentPending.metadata ? JSON.parse(recentPending.metadata) : {};
    if (meta.candidateId === candidateId && meta.voteCount === voteCount && meta.paymentUrl) {
      return {
        paymentUrl: meta.paymentUrl,
        reference: recentPending.reference,
        amount: recentPending.amount,
        voteId: meta.voteId,
      };
    }
  }

  const reference = generateReference("VOTE");

  const payment = await prisma.payment.create({
    data: {
      reference,
      amount,
      type: "VOTE",
      status: "PENDING",
      customerName: voterName,
      customerEmail: voterEmail,
      customerPhone: voterPhone,
      eventId,
      metadata: JSON.stringify({ candidateId, voteCount }),
    },
  });

  const vote = await prisma.vote.create({
    data: {
      eventId,
      candidateId,
      paymentId: payment.id,
      voteCount,
      amount,
      status: "PENDING",
      voterName,
      voterEmail,
      voterPhone,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const fispayResult = await feexpay.initiatePayment({
    amount,
    reference,
    description: `${voteCount} vote(s) pour ${candidate.name} - ${event.name}`,
    customerName: voterName,
    customerEmail: voterEmail,
    customerPhone: voterPhone,
    returnUrl: `${baseUrl}/vote/confirmation?ref=${reference}`,
    cancelUrl: `${baseUrl}/vote/confirmation?ref=${reference}&status=cancelled`,
    metadata: {
      type: "VOTE",
      paymentId: payment.id,
      voteId: vote.id,
      candidateId,
      eventId,
    },
  });

  if (!fispayResult.success) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    await prisma.vote.update({
      where: { id: vote.id },
      data: { status: "FAILED" },
    });
    throw new AppError(fispayResult.error || "Erreur de paiement");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      fispayRef: fispayResult.transactionId,
      metadata: JSON.stringify({
        candidateId,
        voteCount,
        voteId: vote.id,
        paymentUrl: fispayResult.paymentUrl,
      }),
    },
  });

  return {
    paymentUrl: fispayResult.paymentUrl,
    reference,
    amount,
    voteId: vote.id,
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
    const ticket = await prisma.ticket.findFirst({
      where: { id: item.ticketId, eventId, active: true },
    });
    if (!ticket) throw new AppError(`Billet introuvable: ${item.ticketId}`);
    if (ticket.sold + item.quantity > ticket.quantity) {
      throw new AppError(`Stock insuffisant pour ${ticket.name}`);
    }
    const subtotal = ticket.price * item.quantity;
    totalAmount += subtotal;
    orderItems.push({
      ticketId: ticket.id,
      quantity: item.quantity,
      unitPrice: ticket.price,
      subtotal,
    });
  }

  const itemsSignature = [...orderItems]
    .sort((a, b) => a.ticketId.localeCompare(b.ticketId))
    .map((i) => `${i.ticketId}:${i.quantity}`)
    .join(",");

  const recentPending = await prisma.payment.findFirst({
    where: {
      type: "TICKET",
      status: "PENDING",
      eventId,
      customerEmail,
      amount: totalAmount,
      createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentPending) {
    const meta = recentPending.metadata ? JSON.parse(recentPending.metadata) : {};
    const existingSignature = Array.isArray(meta.items)
      ? [...meta.items]
          .sort((a: { ticketId: string }, b: { ticketId: string }) => a.ticketId.localeCompare(b.ticketId))
          .map((i: { ticketId: string; quantity: number }) => `${i.ticketId}:${i.quantity}`)
          .join(",")
      : null;
    if (existingSignature === itemsSignature && meta.paymentUrl && meta.orderId) {
      return {
        paymentUrl: meta.paymentUrl,
        reference: meta.orderRef,
        paymentReference: recentPending.reference,
        amount: recentPending.amount,
        orderId: meta.orderId,
      };
    }
  }

  const reference = generateReference("TICKET");
  const orderRef = generateReference("ORD");

  const payment = await prisma.payment.create({
    data: {
      reference,
      amount: totalAmount,
      type: "TICKET",
      status: "PENDING",
      customerName,
      customerEmail,
      customerPhone,
      eventId,
      metadata: JSON.stringify({ orderRef, items: orderItems }),
    },
  });

  const ticketOrder = await prisma.ticketOrder.create({
    data: {
      reference: orderRef,
      eventId,
      paymentId: payment.id,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      status: "PENDING",
      items: { create: orderItems },
    },
    include: { items: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const fispayResult = await feexpay.initiatePayment({
    amount: totalAmount,
    reference,
    description: `Billets - ${event.name}`,
    customerName,
    customerEmail,
    customerPhone,
    returnUrl: `${baseUrl}/billetterie/confirmation?ref=${orderRef}`,
    cancelUrl: `${baseUrl}/billetterie/confirmation?ref=${orderRef}&status=cancelled`,
    metadata: {
      type: "TICKET",
      paymentId: payment.id,
      orderId: ticketOrder.id,
      eventId,
    },
  });

  if (!fispayResult.success) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    await prisma.ticketOrder.update({
      where: { id: ticketOrder.id },
      data: { status: "FAILED" },
    });
    throw new AppError(fispayResult.error || "Erreur de paiement");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      fispayRef: fispayResult.transactionId,
      metadata: JSON.stringify({
        orderRef,
        items: orderItems,
        orderId: ticketOrder.id,
        paymentUrl: fispayResult.paymentUrl,
      }),
    },
  });

  return {
    paymentUrl: fispayResult.paymentUrl,
    reference: orderRef,
    paymentReference: reference,
    amount: totalAmount,
    orderId: ticketOrder.id,
  };
}

export async function finalizePaidPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { vote: true, ticketOrder: { include: { items: true } } },
  });

  if (!payment || payment.status === "PAID") {
    return payment;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date() },
      });

    if (payment.type === "VOTE" && payment.vote) {
      await tx.vote.update({
        where: { id: payment.vote.id },
        data: { status: "PAID" },
      });
      await tx.candidate.update({
        where: { id: payment.vote.candidateId },
        data: { voteCount: { increment: payment.vote.voteCount } },
      });
    }

    if (payment.type === "TICKET" && payment.ticketOrder) {
      const qrData = JSON.stringify({
        ref: payment.ticketOrder.reference,
        event: payment.eventId,
        amount: payment.ticketOrder.totalAmount,
        ts: Date.now(),
      });
      const qrCode = await QRCode.toDataURL(qrData);

      await tx.ticketOrder.update({
        where: { id: payment.ticketOrder.id },
        data: { status: "PAID", qrCode },
      });

      for (const item of payment.ticketOrder.items) {
        await tx.ticket.update({
          where: { id: item.ticketId },
          data: { sold: { increment: item.quantity } },
        });
      }
    }

    return updatedPayment;
    });
  } catch (err) {
    // Une autre requête concurrente (webhook + vérification manuelle, par ex.)
    // a déjà fait passer ce paiement à PAID entre-temps : traiter comme un succès idempotent.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return prisma.payment.findUnique({ where: { id: paymentId } });
    }
    throw err;
  }
}

export async function confirmPayment(reference: string) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { vote: true, ticketOrder: true },
  });

  if (!payment) throw new AppError("Paiement introuvable");
  if (payment.status === "PAID") {
    return { alreadyPaid: true, payment, verified: true };
  }

  if (payment.status !== "PENDING") {
    return { alreadyPaid: false, payment, verified: false };
  }

  const verification = await feexpay.verifyPayment(reference);

  if (!verification.success) {
    return { alreadyPaid: false, payment, verified: false, error: verification.error };
  }

  const status = normalizePaymentStatus(verification.status);

  if (status === "paid") {
    if (
      verification.amount !== undefined &&
      verification.amount !== payment.amount
    ) {
      return {
        alreadyPaid: false,
        payment,
        verified: false,
        error: "Montant FeexPay ne correspond pas à la transaction",
      };
    }

    const updated = await finalizePaidPayment(payment.id);
    return { alreadyPaid: false, payment: updated, verified: true };
  }

  if (status === "failed" || status === "cancelled") {
    await markPaymentFailed(reference, status === "cancelled" ? "CANCELLED" : "FAILED");
    return { alreadyPaid: false, payment, verified: false };
  }

  return { alreadyPaid: false, payment, verified: false };
}

async function markPaymentFailed(
  reference: string,
  status: "FAILED" | "CANCELLED"
) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { vote: true, ticketOrder: true },
  });
  if (!payment || payment.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status },
    });
    if (payment.vote) {
      await tx.vote.update({
        where: { id: payment.vote.id },
        data: { status },
      });
    }
    if (payment.ticketOrder) {
      await tx.ticketOrder.update({
        where: { id: payment.ticketOrder.id },
        data: { status },
      });
    }
  });
}

export async function processWebhook(
  payload: string,
  signature: string
): Promise<{ success: boolean; message: string }> {
  // Si un secret est configuré, la signature est obligatoire et doit être valide.
  // Sans secret configuré (sandbox/dev), on accepte sans vérification.
  if (process.env.FEEXPAY_WEBHOOK_SECRET && !feexpay.verifyWebhookSignature(payload, signature)) {
    return { success: false, message: "Signature webhook invalide" };
  }

  let data: {
    reference?: string;
    status?: string;
    amount?: number;
    callback_info?: { custom_reference?: string };
  };

  try {
    data = JSON.parse(payload);
  } catch {
    return { success: false, message: "Payload JSON invalide" };
  }

  const reference =
    data.callback_info?.custom_reference || data.reference;
  if (!reference) {
    return { success: false, message: "Référence manquante" };
  }

  const status = normalizePaymentStatus(data.status);

  if (status === "paid") {
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) {
      return { success: false, message: "Paiement introuvable" };
    }
    if (payment.status === "PAID") {
      return { success: true, message: "Déjà traité" };
    }
    if (data.amount !== undefined && data.amount !== payment.amount) {
      return { success: false, message: "Montant invalide" };
    }

    await finalizePaidPayment(payment.id);
    return { success: true, message: "Paiement confirmé par FeexPay" };
  }

  if (status === "failed" || status === "cancelled") {
    await markPaymentFailed(
      reference,
      status === "cancelled" ? "CANCELLED" : "FAILED"
    );
    return { success: true, message: "Statut mis à jour" };
  }

  return { success: true, message: "Événement en attente ignoré" };
}
