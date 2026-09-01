import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const eventId = request.nextUrl.searchParams.get("eventId");
  const candidateId = request.nextUrl.searchParams.get("candidateId");

  const where = {
    ...(eventId ? { eventId } : {}),
    ...(candidateId ? { candidateId } : {}),
  };

  const { page, pageSize, skip, take } = getPagination(request);
  const [votes, total] = await prisma.$transaction([
    prisma.vote.findMany({
      where,
      include: {
        candidate: { select: { name: true, number: true } },
        event: { select: { name: true } },
        payment: { select: { reference: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.vote.count({ where }),
  ]);
  return NextResponse.json(paginatedResponse(votes, total, page, pageSize));
}
