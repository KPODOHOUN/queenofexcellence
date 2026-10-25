import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({
  payments: new Map<string, Record<string, unknown>>(),
  finalized: [] as string[],
}));
const verify = vi.hoisted(() => vi.fn());

vi.mock("@/lib/kkiapay/client", () => ({
  verifyKkiapayTransaction: verify,
  getVoteWidgetConfig: vi.fn(),
  isKkiapayConfigured: () => true,
}));

vi.mock("@/lib/db/models/payments", () => {
  const byRef = (ref: string) => [...db.payments.values()].find((p) => p.reference === ref) ?? null;
  return {
    findPaymentByReferenceWithRelations: async (ref: string) => {
      const p = byRef(ref);
      return p ? { ...p, vote: { id: "v1", candidateId: "c1", voteCount: 2 } } : null;
    },
    findPaymentWithRelations: async (id: string) => ({
      ...db.payments.get(id),
      vote: { id: "v1", candidateId: "c1", voteCount: 2 },
    }),
    findPaymentById: async (id: string) => db.payments.get(id) ?? null,
    findPaymentByTransactionId: async (txn: string) =>
      [...db.payments.values()].find((p) => p.fispayRef === txn) ?? null,
    findOtherPaidPaymentByTransaction: async (txn: string, excludeId: string) =>
      [...db.payments.values()].find(
        (p) => p.fispayRef === txn && p.id !== excludeId && p.status === "PAID"
      ) ?? null,
    updatePayment: async (id: string, data: Record<string, unknown>) => {
      db.payments.set(id, { ...db.payments.get(id), ...data });
    },
    finalizePaidPaymentTx: async (id: string) => {
      const p = db.payments.get(id)!;
      if (p.status === "PENDING") {
        p.status = "PAID";
        db.finalized.push(id);
      }
      return p;
    },
    findPendingVotePaymentsForReconcile: async () =>
      [...db.payments.values()].filter((p) => p.status === "PENDING" && p.fispayRef),
    markPaymentFailedTx: vi.fn(),
    getVoteReconcileStats: vi.fn(),
    syncAllCandidateVoteCounts: vi.fn(),
  };
});

import { confirmPaymentByTransaction, processWebhook, retryPendingVotePayments } from "@/lib/payments";

function addPayment(id: string, extra: Record<string, unknown> = {}) {
  db.payments.set(id, {
    id,
    reference: `VOTE-${id}`,
    amount: 1000,
    type: "VOTE",
    status: "PENDING",
    fispayRef: null,
    ...extra,
  });
}

beforeEach(() => {
  db.payments.clear();
  db.finalized.length = 0;
  verify.mockReset();
  process.env.KKIAPAY_SECRET = "good-secret";
  delete process.env.KKIAPAY_WEBHOOK_SECRET;
});

describe("confirmation des votes KKiaPay", () => {
  it("garde la transaction quand KKiaPay répond PENDING, puis la réconciliation attribue le vote", async () => {
    addPayment("p1");
    verify.mockResolvedValueOnce({ status: "pending" });

    const first = await confirmPaymentByTransaction("VOTE-p1", "TXN1");
    expect(first.verified).toBe(false);
    expect(db.payments.get("p1")!.fispayRef).toBe("TXN1");

    verify.mockResolvedValueOnce({ status: "paid", amount: 1000 });
    const retry = await retryPendingVotePayments();
    expect(retry.confirmed).toBe(1);
    expect(db.payments.get("p1")!.status).toBe("PAID");
  });

  it("refuse de réutiliser une transaction déjà payée pour un autre vote", async () => {
    addPayment("p1", { status: "PAID", fispayRef: "TXN1" });
    addPayment("p2");
    verify.mockResolvedValue({ status: "paid", amount: 1000 });

    const res = await confirmPaymentByTransaction("VOTE-p2", "TXN1");
    expect(res.verified).toBe(false);
    expect(db.payments.get("p2")!.status).toBe("PENDING");
  });

  it("refuse un sous-paiement", async () => {
    addPayment("p1");
    verify.mockResolvedValue({ status: "paid", amount: 100 });
    const res = await confirmPaymentByTransaction("VOTE-p1", "TXN1");
    expect(res.verified).toBe(false);
  });

  it("webhook avec mauvais secret : confirme quand même si l'API KKiaPay dit payé", async () => {
    addPayment("p1");
    verify.mockResolvedValue({ status: "paid", amount: 1000 });
    const res = await processWebhook(
      JSON.stringify({ transactionId: "TXN1", isPaymentSucces: true, partnerId: "VOTE-p1" }),
      "wrong-secret"
    );
    expect(res.success).toBe(true);
    expect(db.payments.get("p1")!.status).toBe("PAID");
  });

  it("webhook avec mauvais secret : n'attribue rien si l'API KKiaPay ne confirme pas", async () => {
    addPayment("p1");
    verify.mockResolvedValue({ status: "failed" });
    await processWebhook(
      JSON.stringify({ transactionId: "FAKE", isPaymentSucces: true, partnerId: "VOTE-p1" }),
      "wrong-secret"
    );
    expect(db.payments.get("p1")!.status).toBe("PENDING");
    expect(db.finalized).toHaveLength(0);
  });

  it("n'attribue les votes qu'une seule fois (callback + webhook)", async () => {
    addPayment("p1");
    verify.mockResolvedValue({ status: "paid", amount: 1000 });
    await confirmPaymentByTransaction("VOTE-p1", "TXN1");
    await processWebhook(
      JSON.stringify({ transactionId: "TXN1", isPaymentSucces: true, partnerId: "VOTE-p1" }),
      "good-secret"
    );
    expect(db.finalized).toEqual(["p1"]);
  });
});
