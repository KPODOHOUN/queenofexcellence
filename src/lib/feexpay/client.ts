/**
 * FeexPay — intégration production
 * @see https://docs.feexpay.me/api_rest.html
 * @see docs/FEEXPAY.md
 */

import {
  isFeexPayConfigured,
  isSandboxEnabled,
  normalizePaymentStatus,
} from "@/lib/feexpay/config";

export interface FeexPayInitiateParams {
  amount: number;
  currency?: string;
  reference: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface FeexPayInitiateResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  reference: string;
  error?: string;
}

export interface FeexPayVerifyResponse {
  success: boolean;
  status: "pending" | "paid" | "failed" | "cancelled";
  transactionId?: string;
  reference?: string;
  amount?: number;
  paidAt?: string;
  error?: string;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function normalizePhone(phone?: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length >= 10) return digits;
  return `237${digits.padStart(9, "0").slice(-9)}`;
}

class FeexPayClient {
  private apiUrl: string;
  private apiKey: string;
  private shopId: string;

  constructor() {
    this.apiUrl = process.env.FEEXPAY_API_URL || "https://api.feexpay.me";
    this.apiKey = process.env.FEEXPAY_API_KEY || "";
    this.shopId = process.env.FEEXPAY_SHOP_ID || "";
  }

  isConfigured(): boolean {
    return isFeexPayConfigured();
  }

  verifyWebhookSignature(_payload: string, signature: string): boolean {
    const secret = process.env.FEEXPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    return signature === secret;
  }

  async initiatePayment(
    params: FeexPayInitiateParams
  ): Promise<FeexPayInitiateResponse> {
    if (!this.isConfigured()) {
      if (isSandboxEnabled()) {
        return this.sandboxInitiate(params);
      }
      return {
        success: false,
        reference: params.reference,
        error:
          "Paiement indisponible : configurez FEEXPAY_API_KEY et FEEXPAY_SHOP_ID.",
      };
    }

    const { firstName, lastName } = splitName(params.customerName);
    const description = params.description
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .trim()
      .slice(0, 120);

    try {
      const response = await fetch(
        `${this.apiUrl}/api/transactions/public/initcard`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            amount: params.amount,
            shop: this.shopId,
            first_name: firstName,
            last_name: lastName,
            email: params.customerEmail,
            phone: normalizePhone(params.customerPhone),
            type_card: "VISA",
            description: description || "Paiement Queen of Excellence",
            success_redirect_url: params.returnUrl,
            error_redirect_url: params.cancelUrl,
            currency: params.currency || "XAF",
            callback_info: {
              custom_reference: params.reference,
              ...params.metadata,
            },
          }),
        }
      );

      const responseText = await response.text();
      let data: { url?: string; reference?: string; message?: string };

      try {
        data = JSON.parse(responseText) as typeof data;
      } catch {
        return {
          success: false,
          reference: params.reference,
          error: `Réponse FeexPay invalide (${response.status})`,
        };
      }

      if (!response.ok || !data.url) {
        return {
          success: false,
          reference: params.reference,
          error:
            data.message ||
            `Erreur FeexPay (${response.status}): ${responseText.slice(0, 200)}`,
        };
      }

      return {
        success: true,
        transactionId: data.reference,
        paymentUrl: data.url,
        reference: params.reference,
      };
    } catch (error) {
      return {
        success: false,
        reference: params.reference,
        error: `Erreur de connexion FeexPay: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      };
    }
  }

  async verifyPayment(reference: string): Promise<FeexPayVerifyResponse> {
    if (!this.isConfigured()) {
      if (isSandboxEnabled()) {
        return {
          success: false,
          status: "pending",
          reference,
          error: "Sandbox : confirmez via la page sandbox",
        };
      }
      return {
        success: false,
        status: "failed",
        error: "FeexPay non configuré",
      };
    }

    const feexpayRef = await this.resolveFeexPayReference(reference);
    if (!feexpayRef) {
      return {
        success: false,
        status: "failed",
        error: "Référence FeexPay introuvable",
      };
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/api/transactions/public/single/status/${encodeURIComponent(feexpayRef)}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const responseText = await response.text();
      if (!response.ok) {
        return {
          success: false,
          status: "failed",
          error: `Vérification FeexPay échouée (${response.status})`,
        };
      }

      const data = JSON.parse(responseText) as {
        status?: string;
        reference?: string;
        amount?: number;
        paid_at?: string;
        transref?: string;
      };

      return {
        success: true,
        status: normalizePaymentStatus(data.status),
        transactionId: data.transref || data.reference,
        reference: data.reference || feexpayRef,
        amount: data.amount,
        paidAt: data.paid_at,
      };
    } catch (error) {
      return {
        success: false,
        status: "failed",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  private async resolveFeexPayReference(
    ourReference: string
  ): Promise<string | null> {
    const { prisma } = await import("@/lib/prisma");
    const payment = await prisma.payment.findUnique({
      where: { reference: ourReference },
      select: { fispayRef: true },
    });
    return payment?.fispayRef || ourReference;
  }

  private sandboxInitiate(
    params: FeexPayInitiateParams
  ): FeexPayInitiateResponse {
    const transactionId = `SANDBOX-${Date.now()}`;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return {
      success: true,
      transactionId,
      paymentUrl: `${baseUrl}/api/payments/sandbox?ref=${params.reference}&txn=${transactionId}`,
      reference: params.reference,
    };
  }
}

export const feexpay = new FeexPayClient();
