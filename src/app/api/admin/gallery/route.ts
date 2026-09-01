import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const schema = z.object({
  title: z.string().optional(),
  imageUrl: z.string().url(),
  videoUrl: z.string().optional(),
  category: z.string().optional(),
  eventId: z.string().optional(),
  candidateId: z.string().optional(),
  type: z.enum(["IMAGE", "VIDEO"]).optional(),
  published: z.boolean().optional(),
  order: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { page, pageSize, skip, take } = getPagination(request);
  const [items, total] = await prisma.$transaction([
    prisma.galleryItem.findMany({
      orderBy: { order: "asc" },
      include: {
        event: { select: { name: true } },
        candidate: { select: { name: true } },
      },
      skip,
      take,
    }),
    prisma.galleryItem.count(),
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = schema.parse(body);
    const item = await prisma.galleryItem.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
