import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const votableOnly = request.nextUrl.searchParams.get("votable") === "true";

  const events = await prisma.event.findMany({
    where: {
      published: true,
      archived: false,
      ...(votableOnly ? { blocked: false } : {}),
    },
    orderBy: { date: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      votePrice: true,
      date: true,
      location: true,
      status: true,
    },
  });
  return NextResponse.json(events);
}
