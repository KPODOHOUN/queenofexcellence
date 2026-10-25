"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Recharge les données serveur de la page à intervalle régulier (ex. paiement en attente). */
export function AutoRefresh({ intervalMs = 5000, maxAttempts = 24 }: { intervalMs?: number; maxAttempts?: number }) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= maxAttempts) return;
    const timer = window.setTimeout(() => {
      setAttempts((n) => n + 1);
      router.refresh();
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [attempts, intervalMs, maxAttempts, router]);

  return null;
}
