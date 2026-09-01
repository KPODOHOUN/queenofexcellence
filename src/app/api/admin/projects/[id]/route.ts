import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().min(10).optional(),
  image: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
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
    const updateData: Record<string, unknown> = { ...data };
    if (data.title && !data.slug) updateData.slug = slugify(data.title);
    const project = await prisma.project.update({ where: { id }, data: updateData });
    return NextResponse.json(project);
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

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
