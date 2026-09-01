import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function resetDb() {
  await prisma.loginAttempt.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.ticketOrderItem.deleteMany();
  await prisma.ticketOrder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.event.deleteMany();
  await prisma.admin.deleteMany();
}

let eventCounter = 0;
let candidateCounter = 0;
let ticketCounter = 0;

export async function createTestEvent(overrides: Partial<{
  published: boolean;
  archived: boolean;
  blocked: boolean;
  votePrice: number;
}> = {}) {
  eventCounter += 1;
  return prisma.event.create({
    data: {
      name: `Test Event ${eventCounter}`,
      slug: `test-event-${eventCounter}-${Date.now()}`,
      description: "Un événement de test avec une description suffisamment longue.",
      date: new Date(),
      location: "Cotonou",
      votePrice: overrides.votePrice ?? 100,
      published: overrides.published ?? true,
      archived: overrides.archived ?? false,
      blocked: overrides.blocked ?? false,
    },
  });
}

export async function createTestCandidate(
  eventId: string,
  overrides: Partial<{ published: boolean; status: string }> = {}
) {
  candidateCounter += 1;
  return prisma.candidate.create({
    data: {
      eventId,
      name: `Candidate ${candidateCounter}`,
      slug: `candidate-${candidateCounter}-${Date.now()}`,
      number: candidateCounter,
      published: overrides.published ?? true,
      status: overrides.status ?? "APPROVED",
    },
  });
}

export async function createTestTicket(
  eventId: string,
  overrides: Partial<{ price: number; quantity: number; sold: number; active: boolean }> = {}
) {
  ticketCounter += 1;
  return prisma.ticket.create({
    data: {
      eventId,
      name: `Ticket ${ticketCounter}`,
      price: overrides.price ?? 1000,
      quantity: overrides.quantity ?? 100,
      sold: overrides.sold ?? 0,
      active: overrides.active ?? true,
    },
  });
}

export async function createTestAdmin(email: string, password: string) {
  return prisma.admin.create({
    data: {
      email,
      name: "Admin de test",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
}
