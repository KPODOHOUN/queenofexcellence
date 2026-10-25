import { describe, it, expect, beforeEach } from "vitest";
import { findById, findMany } from "@/lib/db/crud";
import {
  createPayment,
  createVote,
  createTicketOrder,
} from "@/lib/db/models/payments";
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
    const candidate = await createTestCandidate(event.id as string);

    const first = await createVotePayment({
      eventId: event.id as string,
      candidateId: candidate.id as string,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    const second = await createVotePayment({
      eventId: event.id as string,
      candidateId: candidate.id as string,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    expect(second.reference).toBe(first.reference);
    expect(second.paymentUrl).toBe(first.paymentUrl);

    const payments = await findMany("payment", "event_id = ?", [event.id]);
    expect(payments).toHaveLength(1);
    const votes = await findMany("vote", "event_id = ?", [event.id]);
    expect(votes).toHaveLength(1);
  });

  it("crée un nouveau paiement si le nombre de votes diffère", async () => {
    const event = await createTestEvent({ votePrice: 100 });
    const candidate = await createTestCandidate(event.id as string);

    await createVotePayment({
      eventId: event.id as string,
      candidateId: candidate.id as string,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    await createVotePayment({
      eventId: event.id as string,
      candidateId: candidate.id as string,
      voteCount: 10,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    const payments = await findMany("payment", "event_id = ?", [event.id]);
    expect(payments).toHaveLength(2);
  });

  it("crée un nouveau paiement si la candidate diffère", async () => {
    const event = await createTestEvent({ votePrice: 100 });
    const candidateA = await createTestCandidate(event.id as string);
    const candidateB = await createTestCandidate(event.id as string);

    const first = await createVotePayment({
      eventId: event.id as string,
      candidateId: candidateA.id as string,
      voteCount: 5,
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });

    const second = await createVotePayment({
      eventId: event.id as string,
      candidateId: candidateB.id as string,
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
    const ticket = await createTestTicket(event.id as string, { price: 2000, quantity: 50 });

    const first = await createTicketPayment({
      eventId: event.id as string,
      items: [{ ticketId: ticket.id as string, quantity: 2 }],
      customerName: "Bob",
      customerEmail: "bob@example.com",
    });

    const second = await createTicketPayment({
      eventId: event.id as string,
      items: [{ ticketId: ticket.id as string, quantity: 2 }],
      customerName: "Bob",
      customerEmail: "bob@example.com",
    });

    expect(second.orderId).toBe(first.orderId);
    expect(second.paymentUrl).toBe(first.paymentUrl);

    const orders = await findMany("ticket_order", "event_id = ?", [event.id]);
    expect(orders).toHaveLength(1);
  });

  it("crée une nouvelle commande si le panier diffère", async () => {
    const event = await createTestEvent();
    const ticket = await createTestTicket(event.id as string, { price: 2000, quantity: 50 });

    const first = await createTicketPayment({
      eventId: event.id as string,
      items: [{ ticketId: ticket.id as string, quantity: 1 }],
      customerName: "Bob",
      customerEmail: "bob@example.com",
    });

    const second = await createTicketPayment({
      eventId: event.id as string,
      items: [{ ticketId: ticket.id as string, quantity: 3 }],
      customerName: "Bob",
      customerEmail: "bob@example.com",
    });

    expect(second.orderId).not.toBe(first.orderId);
  });
});

describe("finalizePaidPayment — idempotence", () => {
  async function createPendingVotePayment(voteCount = 4) {
    const event = await createTestEvent({ votePrice: 100 });
    const candidate = await createTestCandidate(event.id as string);
    const amount = voteCount * (event.votePrice as number);

    const payment = await createPayment({
      reference: `TEST-${Date.now()}-${Math.random()}`,
      amount,
      type: "VOTE",
      status: "PENDING",
      customerEmail: "alice@example.com",
      eventId: event.id,
    });
    const vote = await createVote({
      eventId: event.id,
      candidateId: candidate.id,
      paymentId: payment!.id,
      voteCount,
      amount,
      status: "PENDING",
      voterName: "Alice",
      voterEmail: "alice@example.com",
    });
    return { payment: payment!, vote: vote!, candidate };
  }

  it("n'incrémente le compteur de votes qu'une seule fois si appelé deux fois d'affilée", async () => {
    const { payment, vote, candidate } = await createPendingVotePayment(4);

    await finalizePaidPayment(payment.id as string);
    await finalizePaidPayment(payment.id as string);

    const updatedCandidate = await findById<{ voteCount: number }>(
      "candidate",
      candidate.id as string
    );
    expect(updatedCandidate!.voteCount).toBe(vote.voteCount as number);

    const updatedPayment = await findById<{ status: string }>("payment", payment.id as string);
    expect(updatedPayment!.status).toBe("PAID");
  });

  it("ne double-incrémente pas et ne rejette pas quand les deux appels sont concurrents", async () => {
    const { payment, vote, candidate } = await createPendingVotePayment(7);

    const results = await Promise.allSettled([
      finalizePaidPayment(payment.id as string),
      finalizePaidPayment(payment.id as string),
    ]);

    for (const result of results) {
      expect(result.status).toBe("fulfilled");
    }

    const updatedCandidate = await findById<{ voteCount: number }>(
      "candidate",
      candidate.id as string
    );
    expect(updatedCandidate!.voteCount).toBe(vote.voteCount as number);
  });

  it("n'incrémente le stock de billets vendus qu'une seule fois (type TICKET)", async () => {
    const event = await createTestEvent();
    const ticket = await createTestTicket(event.id as string, {
      price: 1500,
      quantity: 20,
      sold: 0,
    });

    const payment = await createPayment({
      reference: `TEST-TICKET-${Date.now()}`,
      amount: 3000,
      type: "TICKET",
      status: "PENDING",
      customerEmail: "bob@example.com",
      eventId: event.id,
    });
    const order = await createTicketOrder(
      {
        reference: `ORD-TEST-${Date.now()}`,
        eventId: event.id,
        paymentId: payment!.id,
        customerName: "Bob",
        customerEmail: "bob@example.com",
        totalAmount: 3000,
        status: "PENDING",
      },
      [{ ticketId: ticket.id as string, quantity: 2, unitPrice: 1500, subtotal: 3000 }]
    );

    await finalizePaidPayment(payment!.id as string);
    await finalizePaidPayment(payment!.id as string);

    const updatedTicket = await findById<{ sold: number }>("ticket", ticket.id as string);
    expect(updatedTicket!.sold).toBe(2);

    const updatedOrder = await findById<{ status: string }>(
      "ticket_order",
      order.id as string
    );
    expect(updatedOrder!.status).toBe("PAID");
  });
});
