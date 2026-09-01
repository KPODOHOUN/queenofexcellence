import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createVotePayment,
  createTicketPayment,
  finalizePaidPayment,
} from "@/lib/payments";
import {
  resetDb,
  createTestEvent,
  createTestCandidate,
  createTestTicket,
} from "./helpers";

beforeEach(async () => {
  await resetDb();
});

describe("createVotePayment — protection contre les doubles soumissions", () => {
  it("renvoie le même paiement pour une soumission identique dans la fenêtre de dédup", async () => {
    const event = await createTestEvent({ votePrice: 100 });
    const candidate = await createTestCandidate(event.id);

    const first = await createVotePayment({
      eventId: event.id,
      candidateId: candidate.id,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    const second = await createVotePayment({
      eventId: event.id,
      candidateId: candidate.id,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    expect(second.reference).toBe(first.reference);
    expect(second.paymentUrl).toBe(first.paymentUrl);

    const payments = await prisma.payment.findMany({ where: { eventId: event.id } });
    expect(payments).toHaveLength(1);
    const votes = await prisma.vote.findMany({ where: { eventId: event.id } });
    expect(votes).toHaveLength(1);
  });

  it("crée un nouveau paiement si le nombre de votes diffère", async () => {
    const event = await createTestEvent({ votePrice: 100 });
    const candidate = await createTestCandidate(event.id);

    const first = await createVotePayment({
      eventId: event.id,
      candidateId: candidate.id,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    const second = await createVotePayment({
      eventId: event.id,
      candidateId: candidate.id,
      voteCount: 10,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    expect(second.reference).not.toBe(first.reference);
    const payments = await prisma.payment.findMany({ where: { eventId: event.id } });
    expect(payments).toHaveLength(2);
  });

  it("crée un nouveau paiement si la candidate diffère", async () => {
    const event = await createTestEvent({ votePrice: 100 });
    const candidateA = await createTestCandidate(event.id);
    const candidateB = await createTestCandidate(event.id);

    const first = await createVotePayment({
      eventId: event.id,
      candidateId: candidateA.id,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    const second = await createVotePayment({
      eventId: event.id,
      candidateId: candidateB.id,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    expect(second.reference).not.toBe(first.reference);
  });
});

describe("createTicketPayment — protection contre les doubles soumissions", () => {
  it("renvoie la même commande pour un panier identique dans la fenêtre de dédup", async () => {
    const event = await createTestEvent();
    const ticket = await createTestTicket(event.id, { price: 2000, quantity: 50 });

    const first = await createTicketPayment({
      eventId: event.id,
      items: [{ ticketId: ticket.id, quantity: 2 }],
      customerName: "Bob",
      customerEmail: "bob@example.com",
    });

    const second = await createTicketPayment({
      eventId: event.id,
      items: [{ ticketId: ticket.id, quantity: 2 }],
      customerName: "Bob",
      customerEmail: "bob@example.com",
    });

    expect(second.orderId).toBe(first.orderId);
    expect(second.paymentUrl).toBe(first.paymentUrl);

    const orders = await prisma.ticketOrder.findMany({ where: { eventId: event.id } });
    expect(orders).toHaveLength(1);
  });

  it("crée une nouvelle commande si le panier diffère", async () => {
    const event = await createTestEvent();
    const ticket = await createTestTicket(event.id, { price: 2000, quantity: 50 });

    const first = await createTicketPayment({
      eventId: event.id,
      items: [{ ticketId: ticket.id, quantity: 1 }],
      customerName: "Bob",
      customerEmail: "bob@example.com",
    });

    const second = await createTicketPayment({
      eventId: event.id,
      items: [{ ticketId: ticket.id, quantity: 3 }],
      customerName: "Bob",
      customerEmail: "bob@example.com",
    });

    expect(second.orderId).not.toBe(first.orderId);
  });
});

describe("finalizePaidPayment — idempotence", () => {
  async function createPendingVotePayment(voteCount = 4) {
    const event = await createTestEvent({ votePrice: 100 });
    const candidate = await createTestCandidate(event.id);
    const amount = voteCount * event.votePrice;

    const payment = await prisma.payment.create({
      data: {
        reference: `TEST-${Date.now()}-${Math.random()}`,
        amount,
        type: "VOTE",
        status: "PENDING",
        customerEmail: "alice@example.com",
        eventId: event.id,
      },
    });
    const vote = await prisma.vote.create({
      data: {
        eventId: event.id,
        candidateId: candidate.id,
        paymentId: payment.id,
        voteCount,
        amount,
        status: "PENDING",
        voterName: "Alice",
        voterEmail: "alice@example.com",
      },
    });
    return { payment, vote, candidate };
  }

  it("n'incrémente le compteur de votes qu'une seule fois si appelé deux fois d'affilée", async () => {
    const { payment, vote, candidate } = await createPendingVotePayment(4);

    await finalizePaidPayment(payment.id);
    await finalizePaidPayment(payment.id);

    const updatedCandidate = await prisma.candidate.findUniqueOrThrow({ where: { id: candidate.id } });
    expect(updatedCandidate.voteCount).toBe(vote.voteCount);

    const updatedPayment = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(updatedPayment.status).toBe("PAID");
  });

  it("ne double-incrémente pas et ne rejette pas quand les deux appels sont concurrents", async () => {
    const { payment, vote, candidate } = await createPendingVotePayment(7);

    const results = await Promise.allSettled([
      finalizePaidPayment(payment.id),
      finalizePaidPayment(payment.id),
    ]);

    for (const result of results) {
      expect(result.status).toBe("fulfilled");
    }

    const updatedCandidate = await prisma.candidate.findUniqueOrThrow({ where: { id: candidate.id } });
    expect(updatedCandidate.voteCount).toBe(vote.voteCount);
  });

  it("n'incrémente le stock de billets vendus qu'une seule fois (type TICKET)", async () => {
    const event = await createTestEvent();
    const ticket = await createTestTicket(event.id, { price: 1500, quantity: 20, sold: 0 });

    const payment = await prisma.payment.create({
      data: {
        reference: `TEST-TICKET-${Date.now()}`,
        amount: 3000,
        type: "TICKET",
        status: "PENDING",
        customerEmail: "bob@example.com",
        eventId: event.id,
      },
    });
    const order = await prisma.ticketOrder.create({
      data: {
        reference: `ORD-TEST-${Date.now()}`,
        eventId: event.id,
        paymentId: payment.id,
        customerName: "Bob",
        customerEmail: "bob@example.com",
        totalAmount: 3000,
        status: "PENDING",
        items: {
          create: [{ ticketId: ticket.id, quantity: 2, unitPrice: 1500, subtotal: 3000 }],
        },
      },
    });

    await finalizePaidPayment(payment.id);
    await finalizePaidPayment(payment.id);

    const updatedTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
    expect(updatedTicket.sold).toBe(2);

    const updatedOrder = await prisma.ticketOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.status).toBe("PAID");
  });
});
