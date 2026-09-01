import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const heroSlideSchema = z.object({
  image: z.string().min(1).optional(),
  subtitle: z.string().optional().nullable(),
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  ctaPrimaryLabel: z.string().optional().nullable(),
  ctaPrimaryHref: z.string().optional().nullable(),
  ctaSecondaryLabel: z.string().optional().nullable(),
  ctaSecondaryHref: z.string().optional().nullable(),
  published: z.boolean().optional(),
  order: z.number().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await request.json();
    const data = heroSlideSchema.parse(body);

    const slide = await prisma.heroSlide.update({ where: { id }, data });
    return NextResponse.json(slide);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await prisma.heroSlide.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
