import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSandboxEnabled } from "@/lib/feexpay/config";
import { finalizePaidPayment } from "@/lib/payments";

export async function GET(request: NextRequest) {
  if (!isSandboxEnabled()) {
    return NextResponse.json(
      {
        error:
          "Sandbox désactivé. Configurez FeexPay en production ou FEEXPAY_ENABLE_SANDBOX=true en développement local uniquement.",
      },
      { status: 403 }
    );
  }

  const ref = request.nextUrl.searchParams.get("ref");
  const txn = request.nextUrl.searchParams.get("txn");
  const action = request.nextUrl.searchParams.get("action");

  if (!ref) {
    return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { reference: ref } });
  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  if (action === "pay") {
    if (payment.status !== "PENDING") {
      return NextResponse.redirect(
        new URL(`/vote/confirmation?ref=${ref}`, request.url)
      );
    }
    await prisma.payment.update({
      where: { id: payment.id },
      data: { fispayRef: txn || `SANDBOX-${Date.now()}` },
    });
    await finalizePaidPayment(payment.id);

    if (payment.type === "VOTE") {
      return NextResponse.redirect(
        new URL(`/vote/confirmation?ref=${ref}`, request.url)
      );
    }
    const order = await prisma.ticketOrder.findFirst({
      where: { paymentId: payment.id },
    });
    return NextResponse.redirect(
      new URL(`/billetterie/confirmation?ref=${order?.reference || ref}`, request.url)
    );
  }

  if (action === "cancel") {
    await prisma.payment.updateMany({
      where: { reference: ref, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    return NextResponse.redirect(
      new URL(`/vote/confirmation?ref=${ref}`, request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const payUrl = `${baseUrl}/api/payments/sandbox?ref=${ref}&txn=${txn}&action=pay`;
  const cancelUrl = `${baseUrl}/api/payments/sandbox?ref=${ref}&action=cancel`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sandbox DEV — Queen of Excellence</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#f7f3eb;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:#fff;border-radius:16px;padding:40px;max-width:420px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center}h1{font-size:1.25rem;margin-bottom:8px}.badge{display:inline-block;background:#fef3c7;color:#92400e;font-size:.75rem;padding:4px 12px;border-radius:20px;margin-bottom:24px}.amount{font-size:2.5rem;color:#c9a227;font-weight:600;margin:16px 0}.ref{font-size:.8rem;color:#6b6b6b;margin-bottom:32px}.btn{display:block;width:100%;padding:14px;border:none;border-radius:12px;font-size:.95rem;font-weight:500;cursor:pointer;margin-bottom:12px;text-decoration:none}.btn-pay{background:linear-gradient(135deg,#e8d48b,#c9a227);color:#fff}.btn-cancel{background:#f3f4f6;color:#6b6b6b}.note{font-size:.75rem;color:#9ca3af;margin-top:16px}</style></head>
<body><div class="card"><h1>Sandbox DEV uniquement</h1><span class="badge">Ne pas utiliser en production</span>
<p class="amount">${payment.amount.toLocaleString("fr-FR")} FCFA</p><p class="ref">Réf: ${ref}</p>
<a href="${payUrl}" class="btn btn-pay">Simuler paiement réussi</a>
<a href="${cancelUrl}" class="btn btn-cancel">Annuler</a>
<p class="note">En production, les paiements passent exclusivement par FeexPay.</p></div></body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
