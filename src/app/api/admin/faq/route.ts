import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const schema = z.object({
  question: z.string().min(5),
  answer: z.string().min(10),
  published: z.boolean().optional(),
  order: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { page, pageSize, skip, take } = getPagination(request);
  const [faqs, total] = await prisma.$transaction([
    prisma.fAQ.findMany({ orderBy: { order: "asc" }, skip, take }),
    prisma.fAQ.count(),
  ]);
  return NextResponse.json(paginatedResponse(faqs, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = schema.parse(body);
    const faq = await prisma.fAQ.create({ data });
    return NextResponse.json(faq, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
