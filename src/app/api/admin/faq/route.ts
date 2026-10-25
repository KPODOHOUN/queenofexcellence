import { NextRequest, NextResponse } from "next/server";
import { createRow, listPaged } from "@/lib/db";
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
  const { items: faqs, total } = await listPaged("faq", "`order` ASC", skip, take);
  return NextResponse.json(paginatedResponse(faqs, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = schema.parse(body);
    const faq = await createRow("faq", data);
    return NextResponse.json(faq, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
