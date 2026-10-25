import { NextRequest, NextResponse } from "next/server";
import { createCandidate, findCandidatesAdminList } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const candidateSchema = z.object({
  eventId: z.string(),
  name: z.string().min(2),
  slug: z.string().optional(),
  number: z.number().int().positive(),
  photo: z.string().optional(),
  bio: z.string().optional(),
  presentation: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  extraInfo: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  categoryId: z.string().optional(),
  published: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const eventId = request.nextUrl.searchParams.get("eventId");
  const { page, pageSize, skip, take } = getPagination(request);
  const { items: candidates, total } = await findCandidatesAdminList(
    skip,
    take,
    eventId
  );
  return NextResponse.json(paginatedResponse(candidates, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = candidateSchema.parse(body);
    const slug = data.slug || slugify(data.name);

    const candidate = await createCandidate({
      ...data,
      slug,
      status: data.status || "PENDING",
    });
    return NextResponse.json(candidate, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
