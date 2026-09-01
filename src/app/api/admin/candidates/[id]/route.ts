import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const candidateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  number: z.number().int().positive().optional(),
  photo: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  presentation: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  extraInfo: z.string().optional().nullable(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  published: z.boolean().optional(),
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
    const data = candidateSchema.parse(body);
    const updateData: Record<string, unknown> = { ...data };
    if (data.name && !data.slug) updateData.slug = slugify(data.name);

    const candidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(candidate);
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

  await prisma.candidate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
