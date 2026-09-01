import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  title: z.string().optional().nullable(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
  candidateId: z.string().optional().nullable(),
  type: z.enum(["IMAGE", "VIDEO"]).optional(),
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
    const data = schema.parse(body);
    const item = await prisma.galleryItem.update({ where: { id }, data });
    return NextResponse.json(item);
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

  await prisma.galleryItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
