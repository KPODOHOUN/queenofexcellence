import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  icon: z.string().optional(),
  value: z.string().optional(),
  image: z.string().optional(),
  published: z.boolean().optional(),
  order: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { page, pageSize, skip, take } = getPagination(request);
  const [items, total] = await prisma.$transaction([
    prisma.impact.findMany({ orderBy: { order: "asc" }, skip, take }),
    prisma.impact.count(),
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = schema.parse(body);
    const item = await prisma.impact.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
