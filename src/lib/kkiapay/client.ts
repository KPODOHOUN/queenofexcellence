import {
  getKkiapayPublicConfig,
  isKkiapayConfigured,
  isKkiapaySandbox,
  normalizeKkiapayStatus,
} from "@/lib/kkiapay/config";

export interface KkiapayVerifyResult {
  success: boolean;
  status: "pending" | "paid" | "failed" | "cancelled";
  transactionId?: string;
  amount?: number;
  error?: string;
}

type KkiapaySdk = {
  verify: (transactionId: string) => Promise<{
    status?: string;
    amount?: number;
    transactionId?: string;
  }>;
};

let sdkPromise: Promise<KkiapaySdk | null> | null = null;

async function getSdk(): Promise<KkiapaySdk | null> {
  if (!isKkiapayConfigured()) return null;
  if (!sdkPromise) {
    sdkPromise = import("@kkiapay-org/nodejs-sdk")
      .then(({ kkiapay }) =>
        kkiapay({
          publickey: process.env.KKIAPAY_PUBLIC_KEY!,
          privatekey: process.env.KKIAPAY_PRIVATE_KEY!,
          secretkey: process.env.KKIAPAY_SECRET!,
          sandbox: isKkiapaySandbox(),
        })
      )
      .catch((err) => {
        console.error("KKiaPay SDK init:", err);
        return null;
      });
  }
  return sdkPromise;
}

export async function verifyKkiapayTransaction(
  transactionId: string
): Promise<KkiapayVerifyResult> {
  const sdk = await getSdk();
  if (!sdk) {
    return { success: false, status: "failed", error: "KKiaPay non configuré" };
  }

  try {
    const response = await sdk.verify(transactionId);
    const status = normalizeKkiapayStatus(response.status);
    return {
      success: status === "paid",
      status,
      transactionId: response.transactionId || transactionId,
      amount: response.amount,
    };
  } catch (error) {
    return {
      success: false,
      status: "failed",
      error: error instanceof Error ? error.message : "Vérification échouée",
    };
  }
}

export function getVoteWidgetConfig(reference: string, amount: number) {
  const cfg = getKkiapayPublicConfig();
  return {
    reference,
    amount,
    publicKey: cfg.publicKey,
    sandbox: cfg.sandbox,
    configured: cfg.configured,
  };
}

export { getKkiapayPublicConfig, isKkiapayConfigured, isKkiapaySandbox };
