import { PublicLayout } from "@/components/layout/PublicLayout";
import { prisma } from "@/lib/prisma";
import { confirmPayment } from "@/lib/payments";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confirmation de vote" };

export default async function VoteConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; status?: string }>;
}) {
  const { ref, status } = await searchParams;

  let payment = null;
  let verified = false;

  if (ref) {
    const result = await confirmPayment(ref).catch(() => null);
    verified = result?.verified === true || result?.alreadyPaid === true;

    payment = await prisma.payment.findUnique({
      where: { reference: ref },
      include: {
        vote: {
          include: {
            candidate: { select: { name: true, number: true } },
            event: { select: { name: true } },
          },
        },
      },
    });
  }

  const isSuccess = payment?.status === "PAID";
  const isCancelled =
    status === "cancelled" ||
    payment?.status === "CANCELLED" ||
    payment?.status === "FAILED";

  return (
    <PublicLayout>
      <section className="py-32">
        <div className="max-w-lg mx-auto px-4 text-center animate-fade-in">
          {isSuccess ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center animate-[gold-glow_2.5s_ease-in-out_infinite]">
                <span className="text-3xl text-green-600">✓</span>
              </div>
              <h1 className="font-serif text-3xl text-foreground mb-4">
                Vote confirmé !
              </h1>
              <p className="text-muted mb-2">
                Paiement validé par FeexPay. Merci pour votre soutien à{" "}
                <strong>{payment?.vote?.candidate.name}</strong>
              </p>
              <p className="text-sm text-muted mb-8">
                {payment?.vote?.voteCount} vote(s) — Réf: {ref}
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
                Nous attendons la confirmation de FeexPay. Les votes ne sont
                comptabilisés qu&apos;après validation du paiement.
              </p>
              {ref && !verified && (
                <p className="text-xs text-muted mb-8">
                  Référence : {ref} — actualisez cette page dans quelques instants.
                </p>
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
