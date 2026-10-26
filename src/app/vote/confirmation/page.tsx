import { PublicLayout } from "@/components/layout/PublicLayout";
import { getPaymentConfirmationByReference } from "@/lib/db/models/payments";
import { confirmPayment, confirmPaymentByTransaction } from "@/lib/payments";
import Link from "next/link";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Confirmation de vote" };

export default async function VoteConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{
    ref?: string;
    status?: string;
    txn?: string;
    transaction_id?: string;
    transactionId?: string;
  }>;
}) {
  const params = await searchParams;
  const { status } = params;
  // KKiaPay (callback) peut ajouter « ?transaction_id=… » à une URL qui a déjà « ?ref=… ».
  const [rawRef, glued] = (params.ref ?? "").split("?");
  const ref = rawRef || undefined;
  const gluedTxn = glued ? new URLSearchParams(glued).get("transaction_id") : null;
  const txn = params.txn || params.transaction_id || params.transactionId || gluedTxn || undefined;

  let payment: Awaited<ReturnType<typeof getPaymentConfirmationByReference>> = null;
  let verified = false;

  if (ref) {
    const result = txn
      ? await confirmPaymentByTransaction(ref, txn).catch(() => null)
      : await confirmPayment(ref).catch(() => null);
    verified = result?.verified === true || result?.alreadyPaid === true;
    payment = await getPaymentConfirmationByReference(ref);
  }

  const p = payment as {
    status?: string;
    vote?: { voteCount?: number; candidate?: { name?: string } };
  } | null;

  const isSuccess = p?.status === "PAID";
  const isCancelled =
    status === "cancelled" ||
    p?.status === "CANCELLED" ||
    p?.status === "FAILED";

  return (
    <PublicLayout>
      <section className="py-32">
        <div className="max-w-lg mx-auto px-4 text-center animate-fade-in">
          {isSuccess ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
                <span className="text-3xl text-green-600">✓</span>
              </div>
              <h1 className="font-serif text-3xl text-foreground mb-4">
                Vote confirmé !
              </h1>
              <p className="text-muted mb-2">
                Paiement validé par KKiaPay. Merci pour votre soutien à{" "}
                <strong>{p?.vote?.candidate?.name}</strong>
              </p>
              <p className="text-sm text-muted mb-8">
                {p?.vote?.voteCount} vote(s) — Réf: {ref}
              </p>
            </>
          ) : isCancelled ? (
            <>
              <h1 className="font-serif text-3xl text-foreground mb-4">
                Paiement annulé
              </h1>
              <p className="text-muted mb-8">
                Votre paiement a été annulé ou a échoué. Aucun vote n&apos;a été
                enregistré.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-foreground mb-4">
                Vérification en cours
              </h1>
              <p className="text-muted mb-4">
                Nous attendons la confirmation de KKiaPay. Les votes ne sont
                comptabilisés qu&apos;après validation du paiement.
              </p>
              {ref && !verified && (
                <>
                  <p className="text-xs text-muted mb-8">
                    Référence : {ref} — vérification automatique en cours, ne fermez pas cette page.
                  </p>
                  <AutoRefresh intervalMs={5000} maxAttempts={24} />
                </>
              )}
            </>
          )}
          <Link
            href="/candidats"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white gold-gradient rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/30"
          >
            Retour aux candidates
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
