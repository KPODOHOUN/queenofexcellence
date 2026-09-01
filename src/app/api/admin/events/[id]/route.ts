import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const eventSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  image: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
  description: z.string().min(10).optional(),
  shortDesc: z.string().optional().nullable(),
  date: z.string().optional(),
  time: z.string().optional().nullable(),
  location: z.string().min(2).optional(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "DRAFT"]).optional(),
  rules: z.string().optional().nullable(),
  presentation: z.string().optional().nullable(),
  votePrice: z.number().optional(),
  published: z.boolean().optional(),
  archived: z.boolean().optional(),
  blocked: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      candidates: true,
      tickets: true,
      _count: { select: { votes: true, gallery: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await request.json();
    const data = eventSchema.parse(body);
    const updateData: Record<string, unknown> = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    if (data.name && !data.slug) updateData.slug = slugify(data.name);

    const event = await prisma.event.update({ where: { id }, data: updateData });
    return NextResponse.json(event);
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

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
