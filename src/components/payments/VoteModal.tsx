"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import { KkiapayScript, useKkiapayPayment, type KkiapayPaymentConfig } from "@/components/payments/KkiapayWidget";
import { cn, formatCurrency } from "@/lib/utils";

export interface VoteTarget {
  candidate: { id: string; name: string; number: number; photo?: string | null };
  event: { id: string; name: string; votePrice: number };
}

const PRESETS = [1, 5, 10, 20];
const MAX_VOTES = 100;

const clamp = (n: number) => (Number.isNaN(n) ? 1 : Math.min(MAX_VOTES, Math.max(1, Math.floor(n))));

interface VoteModalProps extends VoteTarget {
  open: boolean;
  onClose: () => void;
}

/** Fenêtre de vote : nombre de votes → total calculé → « Payer » ouvre KKiaPay. */
export function VoteModal({ candidate, event, open, onClose }: VoteModalProps) {
  const router = useRouter();
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSuccess = useCallback(
    async (transactionId: string, reference: string) => {
      try {
        await fetch("/api/payments/kkiapay/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, transactionId }),
        });
      } catch {
        // La page de confirmation re-vérifie côté serveur.
      }
      router.push(`/vote/confirmation?ref=${encodeURIComponent(reference)}&txn=${encodeURIComponent(transactionId)}`);
    },
    [router]
  );

  const { openPayment } = useKkiapayPayment({
    callbackPath: "/vote/confirmation",
    onSuccess,
    onFailed: () => setError("Le paiement a échoué ou a été annulé."),
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const total = count * event.votePrice;

  async function pay() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, candidateId: candidate.id, voteCount: count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      onClose();
      await openPayment(data as KkiapayPaymentConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <KkiapayScript />
      <div className={cn("fixed inset-0 z-[70] flex items-end sm:items-center justify-center", open ? "visible" : "invisible")}>
        <div
          className={cn("absolute inset-0 bg-black/50 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Voter pour ${candidate.name}`}
          className={cn(
            "relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl transition-transform duration-300",
            open ? "translate-y-0" : "translate-y-full sm:translate-y-8"
          )}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-champagne"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4 pr-8">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-onyx shrink-0">
              {candidate.photo ? (
                <Image src={candidate.photo} alt="" fill sizes="56px" className="object-cover object-top" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-gold font-semibold">
                  {candidate.number}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-muted">N° {candidate.number} • {event.name}</p>
              <h2 className="text-lg font-semibold text-foreground truncate">{candidate.name}</h2>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-foreground mb-3">Nombre de votes</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCount((c) => clamp(c - 1))}
                aria-label="Moins"
                className="w-11 h-11 rounded-lg bg-champagne flex items-center justify-center hover:bg-champagne-dark"
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_VOTES}
                value={count}
                onChange={(e) => setCount(clamp(parseInt(e.target.value, 10)))}
                className="input-field flex-1 text-center text-lg font-semibold tabular-nums"
                aria-label="Nombre de votes"
              />
              <button
                type="button"
                onClick={() => setCount((c) => clamp(c + 1))}
                aria-label="Plus"
                className="w-11 h-11 rounded-lg bg-champagne flex items-center justify-center hover:bg-champagne-dark"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-medium transition-colors",
                    count === n ? "bg-onyx text-white" : "bg-champagne text-foreground hover:bg-champagne-dark"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg bg-champagne px-4 py-3">
            <span className="text-sm text-muted">
              {count} × {formatCurrency(event.votePrice)}
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(total)}</span>
          </div>

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

          <button type="button" onClick={pay} disabled={loading} className="btn-gold w-full mt-5 !min-h-12 disabled:opacity-60">
            {loading ? "Ouverture du paiement…" : `Payer ${formatCurrency(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">Mobile Money ou carte bancaire, via KKiaPay.</p>
        </div>
      </div>
    </>
  );
}
