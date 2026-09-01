import { PublicLayout } from "@/components/layout/PublicLayout";
import { prisma } from "@/lib/prisma";
import { confirmPayment } from "@/lib/payments";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";


export const metadata: Metadata = { title: "Confirmation billet" };

export default async function TicketConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; status?: string }>;
}) {
  const { ref, status } = await searchParams;

  let order = null;
  let verified = false;

  if (ref) {
    const payment = await prisma.payment.findFirst({
      where: { ticketOrder: { reference: ref } },
    });
    if (payment) {
      const result = await confirmPayment(payment.reference).catch(() => null);
      verified = result?.verified === true || result?.alreadyPaid === true;
    }

    order = await prisma.ticketOrder.findUnique({
      where: { reference: ref },
      include: {
        event: { select: { name: true, date: true, location: true } },
        items: { include: { ticket: { select: { name: true } } } },
        payment: { select: { status: true } },
      },
    });
  }

  const isSuccess = order?.status === "PAID";
  const isCancelled =
    status === "cancelled" ||
    order?.payment?.status === "CANCELLED" ||
    order?.payment?.status === "FAILED";

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
                Billet confirmé !
              </h1>
              <p className="text-muted mb-2">
                Paiement validé par FeexPay — {order?.event.name}
              </p>
              <p className="text-sm text-muted mb-6">Réf: {ref}</p>

              {order?.qrCode && (
                <div className="mb-8 p-6 bg-white border border-border rounded-2xl inline-block">
                  <Image
                    src={order.qrCode}
                    alt="QR Code billet"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                  <p className="text-xs text-muted mt-3">
                    Présentez ce QR code à l&apos;entrée
                  </p>
                </div>
              )}

              <div className="text-left p-4 bg-champagne rounded-xl mb-8 text-sm">
                {order?.items.map((item) => (
                  <p key={item.id}>
                    {item.quantity}x {item.ticket.name}
                  </p>
                ))}
              </div>
            </>
          ) : isCancelled ? (
            <>
              <h1 className="font-serif text-3xl text-foreground mb-4">
                Paiement annulé
              </h1>
              <p className="text-muted mb-8">
                Votre paiement a été annulé ou a échoué. Aucun billet n&apos;a
                été émis.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-foreground mb-4">
                Vérification en cours
              </h1>
              <p className="text-muted mb-4">
                Nous attendons la confirmation de FeexPay. Votre billet sera
                disponible dès validation du paiement.
              </p>
              {ref && !verified && (
                <p className="text-xs text-muted mb-8">
                  Référence : {ref} — actualisez cette page dans quelques instants.
                </p>
              )}
            </>
          )}
          <Link
            href="/billetterie"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white gold-gradient rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/30"
          >
            Retour à la billetterie
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
