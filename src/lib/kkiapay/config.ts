export function isKkiapayConfigured(): boolean {
  return Boolean(
    process.env.KKIAPAY_PUBLIC_KEY &&
      process.env.KKIAPAY_PRIVATE_KEY &&
      process.env.KKIAPAY_SECRET
  );
}

export function isKkiapaySandbox(): boolean {
  return process.env.KKIAPAY_SANDBOX === "true";
}

/** Sandbox fictif — jamais en production. Dev local sans clés KKiaPay uniquement. */
export function isLocalPaymentSandboxEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (isKkiapayConfigured()) return false;
  return process.env.PAYMENTS_DEV_SANDBOX !== "false";
}

export function getKkiapayPublicConfig() {
  return {
    publicKey: process.env.KKIAPAY_PUBLIC_KEY || "",
    sandbox: isKkiapaySandbox(),
    configured: isKkiapayConfigured(),
  };
}

export function normalizeKkiapayStatus(
  status?: string | boolean
): "pending" | "paid" | "failed" | "cancelled" {
  if (status === true || status === "SUCCESS" || status === "success") return "paid";
  if (status === "FAILED" || status === "failed") return "failed";
  if (status === "CANCELLED" || status === "cancelled") return "cancelled";
  return "pending";
}

export function verifyKkiapayWebhookSecret(headerSecret: string | null): boolean {
  const expected = process.env.KKIAPAY_WEBHOOK_SECRET || process.env.KKIAPAY_SECRET;
  if (!expected || !headerSecret) return false;
  return headerSecret === expected;
}
