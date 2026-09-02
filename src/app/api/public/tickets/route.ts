import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-db";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId requis" }, { status: 400 });
  }

  const tickets = await safeQuery(
    "api.tickets",
    () =>
      prisma.ticket.findMany({
        where: { eventId, active: true },
        orderBy: { price: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          quantity: true,
          sold: true,
        },
      }),
    []
  );

  return NextResponse.json(tickets);
}
