const RECONCILE_INTERVAL_MS = 2 * 60 * 1000;
const RECONCILE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Réconciliation automatique des paiements (votes et billets) : toutes les 2 min, re-vérifie auprès
 * de KKiaPay les paiements PENDING dont la transaction est connue. Rattrape
 * les votes dont le callback navigateur ou le webhook n'a pas abouti.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VOTES_AUTO_RECONCILE === "false") return;

  const g = globalThis as typeof globalThis & { __votesReconcileTimer?: unknown };
  if (g.__votesReconcileTimer) return;

  const { isDatabaseConfigured } = await import("@/lib/db/connection");
  const { isKkiapayConfigured } = await import("@/lib/kkiapay/config");
  if (!isDatabaseConfigured() || !isKkiapayConfigured()) return;

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const { retryPendingPayments } = await import("@/lib/payments");
      const result = await retryPendingPayments({
        limit: 100,
        since: new Date(Date.now() - RECONCILE_WINDOW_MS),
      });
      if (result.confirmed > 0) {
        console.log(`[paiements] réconciliation auto : ${result.confirmed} paiement(s) confirmé(s)`);
      }
    } catch (error) {
      console.error("[paiements] réconciliation auto:", error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, RECONCILE_INTERVAL_MS);
  (timer as { unref?: () => void }).unref?.();
  g.__votesReconcileTimer = timer;
  setTimeout(tick, 15_000);
}
