import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  const eventSlug = request.nextUrl.searchParams.get("eventSlug");

  if (!eventId && !eventSlug) {
    return NextResponse.json({ error: "eventId requis" }, { status: 400 });
  }

  const candidates = await prisma.candidate.findMany({
    where: {
      published: true,
      status: "APPROVED",
      ...(eventId
        ? { eventId }
        : { event: { slug: eventSlug!, published: true } }),
    },
    orderBy: { number: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      number: true,
      photo: true,
      voteCount: true,
    },
  });

  return NextResponse.json(candidates);
}
