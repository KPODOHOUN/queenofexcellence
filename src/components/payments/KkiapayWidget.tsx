"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    openKkiapayWidget?: (options: Record<string, unknown>) => void;
    addSuccessListener?: (cb: (response: { transactionId?: string }) => void) => void;
    addFailedListener?: (cb: (error: unknown) => void) => void;
  }
}

const KKIAPAY_SCRIPT = "https://cdn.kkiapay.me/k.js";

export type KkiapayPaymentConfig = {
  reference: string;
  amount: number;
  publicKey: string;
  sandbox: boolean;
  configured: boolean;
  sandboxUrl?: string;
};

function isWidgetAvailable() {
  return typeof window !== "undefined" && typeof window.openKkiapayWidget === "function";
}

/** Attend que openKkiapayWidget soit disponible (script parfois lent sur mobile). */
export function waitForKkiapayWidget(timeoutMs = 20000): Promise<boolean> {
  if (isWidgetAvailable()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (isWidgetAvailable()) {
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, 150);
    };
    tick();
  });
}

interface UseKkiapayOptions {
  name?: string;
  email?: string;
  phone?: string;
  /** Page vers laquelle KKiaPay redirige après succès (ex. /vote/confirmation). */
  callbackPath?: string;
  onSuccess: (transactionId: string, reference: string) => void | Promise<void>;
  onFailed?: (error: unknown) => void;
}

type KkiapayListenerWindow = Window & {
  addKkiapayListener?: (event: string, cb: (response: unknown) => void) => void;
};

function extractTransactionId(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const r = response as Record<string, unknown>;
  const nested = (r.data ?? r.detail) as Record<string, unknown> | undefined;
  const id = r.transactionId ?? r.transaction_id ?? nested?.transactionId ?? nested?.transaction_id;
  return id ? String(id) : undefined;
}

export function useKkiapayPayment({
  name,
  email,
  phone,
  callbackPath,
  onSuccess,
  onFailed,
}: UseKkiapayOptions) {
  const pendingRef = useRef<KkiapayPaymentConfig | null>(null);
  const handledTxn = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onFailedRef.current = onFailed;
  }, [onSuccess, onFailed]);

  // Enregistre les listeners UNE seule fois, dès que le script KKiaPay est chargé
  // (il se charge après le montage : un enregistrement immédiat serait perdu).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const handleSuccess = async (response: unknown) => {
      const ref = pendingRef.current?.reference;
      const txn = extractTransactionId(response);
      if (!ref || !txn || handledTxn.current === txn) return;
      handledTxn.current = txn;
      await onSuccessRef.current(txn, ref);
    };
    const handleFailed = (error: unknown) => onFailedRef.current?.(error);

    waitForKkiapayWidget(60000).then((ok) => {
      if (cancelled || !ok) return;
      const w = window as KkiapayListenerWindow;
      if (typeof w.addSuccessListener === "function") {
        w.addSuccessListener(handleSuccess);
        w.addFailedListener?.(handleFailed);
      } else if (typeof w.addKkiapayListener === "function") {
        w.addKkiapayListener("success", handleSuccess);
        w.addKkiapayListener("failed", handleFailed);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function openPayment(config: KkiapayPaymentConfig) {
    if (config.sandboxUrl) {
      window.location.href = config.sandboxUrl;
      return;
    }
    if (!config.configured || !config.publicKey) {
      throw new Error("KKiaPay n'est pas configuré sur le serveur.");
    }

    const ready = await waitForKkiapayWidget();
    if (!ready || !window.openKkiapayWidget) {
      throw new Error(
        "Impossible de charger KKiaPay. Vérifiez votre connexion et réessayez dans quelques secondes."
      );
    }

    pendingRef.current = config;
    handledTxn.current = null;
    window.openKkiapayWidget({
      amount: String(config.amount),
      key: config.publicKey,
      sandbox: config.sandbox,
      partnerId: config.reference,
      data: config.reference,
      position: "center",
      theme: "#C9A45C",
      name,
      email,
      phone,
      // Secours : si le listener JS ne se déclenche pas (mobile, onglet fermé…),
      // KKiaPay redirige ici avec ?transaction_id=… et le serveur confirme le vote.
      ...(callbackPath
        ? {
            callback: `${window.location.origin}${callbackPath}?ref=${encodeURIComponent(
              config.reference
            )}`,
          }
        : {}),
    });
  }

  return { openPayment };
}

export function KkiapayScript({
  onReady,
  onError,
}: {
  onReady?: () => void;
  onError?: () => void;
}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const readyNotified = useRef(false);

  const notifyReady = useCallback(() => {
    if (readyNotified.current) return;
    readyNotified.current = true;
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (isWidgetAvailable()) {
      notifyReady();
      return;
    }
    if (!scriptLoaded) return;

    let cancelled = false;
    waitForKkiapayWidget(20000).then((ok) => {
      if (cancelled) return;
      if (ok) notifyReady();
      else onError?.();
    });
    return () => {
      cancelled = true;
    };
  }, [scriptLoaded, notifyReady, onError]);

  return (
    <Script
      src={KKIAPAY_SCRIPT}
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
      onError={() => onError?.()}
    />
  );
}
