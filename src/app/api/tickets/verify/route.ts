import { NextRequest, NextResponse } from "next/server";
import { findByField, getTicketOrderForVerify, validateTicketOrder } from "@/lib/db";

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
  }

  const order = await getTicketOrderForVerify(ref);

  if (!order) {
    return NextResponse.json({ error: "Billet introuvable" }, { status: 404 });
  }

  if (order.status !== "PAID" && order.status !== "VALIDATED") {
    return NextResponse.json({ valid: false, status: order.status });
  }

  const event = order.event as { name: string } | null;

  return NextResponse.json({
    valid: true,
    reference: order.reference as string,
    event: event?.name,
    customer: order.customerName as string,
    status: order.status as string,
    validatedAt: order.validatedAt,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();
    const order = await findByField<{ id: string; status: string }>(
      "ticket_order",
      "reference",
      reference
    );

    if (!order) {
      return NextResponse.json({ error: "Billet introuvable" }, { status: 404 });
    }

    if (order.status !== "PAID") {
      return NextResponse.json({
        valid: false,
        message: "Billet non valide",
        status: order.status,
      });
    }

    const updated = await validateTicketOrder(order.id);

    return NextResponse.json({
      valid: true,
      message: "Billet validé avec succès",
      validatedAt: (updated as { validatedAt?: Date } | null)?.validatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
