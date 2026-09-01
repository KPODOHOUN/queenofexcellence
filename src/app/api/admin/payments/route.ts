import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const eventId = request.nextUrl.searchParams.get("eventId");
  const status = request.nextUrl.searchParams.get("status");

  const where = {
    ...(eventId ? { eventId } : {}),
    ...(status ? { status: status as "PENDING" | "PAID" | "FAILED" | "CANCELLED" } : {}),
  };

  const { page, pageSize, skip, take } = getPagination(request);
  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: {
        event: { select: { name: true } },
        vote: { select: { voteCount: true, candidate: { select: { name: true } } } },
        ticketOrder: { select: { reference: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);
  return NextResponse.json(paginatedResponse(payments, total, page, pageSize));
}
