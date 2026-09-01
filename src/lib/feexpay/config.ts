/**
 * Configuration FeexPay — mode production par défaut.
 * Sandbox local uniquement si FEEXPAY_ENABLE_SANDBOX=true (dev).
 */

export function isFeexPayConfigured(): boolean {
  return !!(
    process.env.FEEXPAY_API_KEY &&
    process.env.FEEXPAY_SHOP_ID
  );
}

export function isSandboxEnabled(): boolean {
  if (process.env.FEEXPAY_ENABLE_SANDBOX !== "true") return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

export function getFeexPayMode(): "LIVE" | "SANDBOX" {
  return process.env.FEEXPAY_MODE === "SANDBOX" ? "SANDBOX" : "LIVE";
}

export function assertFeexPayProductionReady(): void {
  if (!isFeexPayConfigured()) {
    throw new Error(
      "FeexPay non configuré. Définissez FEEXPAY_API_KEY et FEEXPAY_SHOP_ID."
    );
  }
}

export function normalizePaymentStatus(
  status: string | undefined
): "pending" | "paid" | "failed" | "cancelled" {
  const s = (status || "").toUpperCase();
  if (["SUCCESSFUL", "SUCCESS", "PAID", "COMPLETED", "APPROVED"].includes(s)) {
    return "paid";
  }
  if (["FAILED", "FAILURE", "DECLINED", "REJECTED"].includes(s)) {
    return "failed";
  }
  if (["CANCELLED", "CANCELED", "ABORTED"].includes(s)) {
    return "cancelled";
  }
  return "pending";
}
