import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const ticketSchema = z.object({
  eventId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const eventId = request.nextUrl.searchParams.get("eventId");
  const where = eventId ? { eventId } : undefined;
  const { page, pageSize, skip, take } = getPagination(request);
  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      include: { event: { select: { name: true } } },
      orderBy: { price: "asc" },
      skip,
      take,
    }),
    prisma.ticket.count({ where }),
  ]);
  return NextResponse.json(paginatedResponse(tickets, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = ticketSchema.parse(body);
    const ticket = await prisma.ticket.create({ data });
    return NextResponse.json(ticket, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
