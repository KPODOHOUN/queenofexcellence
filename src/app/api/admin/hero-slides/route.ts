import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const heroSlideSchema = z.object({
  image: z.string().min(1),
  subtitle: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  ctaPrimaryLabel: z.string().optional(),
  ctaPrimaryHref: z.string().optional(),
  ctaSecondaryLabel: z.string().optional(),
  ctaSecondaryHref: z.string().optional(),
  published: z.boolean().optional(),
  order: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { page, pageSize, skip, take } = getPagination(request);
  const [slides, total] = await prisma.$transaction([
    prisma.heroSlide.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.heroSlide.count(),
  ]);
  return NextResponse.json(paginatedResponse(slides, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = heroSlideSchema.parse(body);

    const slide = await prisma.heroSlide.create({ data });
    return NextResponse.json(slide, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
