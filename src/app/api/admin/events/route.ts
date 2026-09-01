import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const eventSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  image: z.string().optional(),
  banner: z.string().optional(),
  description: z.string().min(10),
  shortDesc: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  location: z.string().min(2),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "DRAFT"]).optional(),
  rules: z.string().optional(),
  presentation: z.string().optional(),
  votePrice: z.number().optional(),
  published: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { page, pageSize, skip, take } = getPagination(request);
  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      orderBy: { date: "desc" },
      include: { _count: { select: { candidates: true, votes: true } } },
      skip,
      take,
    }),
    prisma.event.count(),
  ]);
  return NextResponse.json(paginatedResponse(events, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = eventSchema.parse(body);
    const slug = data.slug || slugify(data.name);

    const event = await prisma.event.create({
      data: {
        ...data,
        slug,
        date: new Date(data.date),
        status: data.status || "DRAFT",
      },
      include: { _count: { select: { candidates: true, votes: true } } },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
