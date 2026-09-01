import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
  }

  const order = await prisma.ticketOrder.findUnique({
    where: { reference: ref },
    include: {
      event: { select: { name: true, date: true, location: true } },
      items: { include: { ticket: { select: { name: true } } } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Billet introuvable" }, { status: 404 });
  }

  if (order.status !== "PAID" && order.status !== "VALIDATED") {
    return NextResponse.json({ valid: false, status: order.status });
  }

  return NextResponse.json({
    valid: true,
    reference: order.reference,
    event: order.event.name,
    customer: order.customerName,
    status: order.status,
    validatedAt: order.validatedAt,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();
    const order = await prisma.ticketOrder.findUnique({
      where: { reference },
    });

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

    const updated = await prisma.ticketOrder.update({
      where: { id: order.id },
      data: { status: "VALIDATED", validatedAt: new Date() },
    });

    return NextResponse.json({
      valid: true,
      message: "Billet validé avec succès",
      validatedAt: updated.validatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
