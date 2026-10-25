import { NextRequest, NextResponse } from "next/server";
import { findPublicCandidates } from "@/lib/db";
import { safeQuery } from "@/lib/safe-db";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  const eventSlug = request.nextUrl.searchParams.get("eventSlug");
  const categoryId = request.nextUrl.searchParams.get("categoryId");

  if (!eventId && !eventSlug) {
    return NextResponse.json({ error: "eventId requis" }, { status: 400 });
  }

  const candidates = await safeQuery(
    "api.candidates",
    () => findPublicCandidates(eventId, eventSlug, categoryId),
    []
  );

  return NextResponse.json(candidates);
}
