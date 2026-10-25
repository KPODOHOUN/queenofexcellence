import { NextRequest, NextResponse } from "next/server";
import { findPublicTickets } from "@/lib/db";
import { safeQuery } from "@/lib/safe-db";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId requis" }, { status: 400 });
  }

  const tickets = await safeQuery(
    "api.tickets",
    () => findPublicTickets(eventId),
    []
  );

  return NextResponse.json(tickets);
}
