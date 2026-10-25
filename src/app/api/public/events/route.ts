import { NextRequest, NextResponse } from "next/server";
import { findPublicEvents } from "@/lib/db";
import { safeQuery } from "@/lib/safe-db";

export async function GET(request: NextRequest) {
  const votableOnly = request.nextUrl.searchParams.get("votable") === "true";

  const events = await safeQuery(
    "api.events",
    () => findPublicEvents(votableOnly),
    []
  );

  return NextResponse.json(events);
}
