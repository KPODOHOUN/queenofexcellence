import { NextRequest, NextResponse } from "next/server";
import { createEventAdmin, findEventsAdminList } from "@/lib/db";
import { dbErrorResponse, normalizeEventFields } from "@/lib/db/errors";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const eventSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  image: z.string().optional(),
  banner: z.string().optional(),
  attendanceFrame: z.string().optional().nullable(),
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
  categories: z.array(z.string().min(1)).optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { page, pageSize, skip, take } = getPagination(request);
  const { items: events, total } = await findEventsAdminList(skip, take);
  return NextResponse.json(paginatedResponse(events, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = eventSchema.parse(body);
    const { categories, ...rest } = data;
    const slug = rest.slug || slugify(rest.name);

    const event = await createEventAdmin(
      normalizeEventFields({
        ...rest,
        slug,
        date: new Date(rest.date),
        status: rest.status || "DRAFT",
      }),
      categories ?? []
    );
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues, message: "Données invalides — vérifiez le formulaire" },
        { status: 400 }
      );
    }
    return dbErrorResponse(err, "Création événement");
  }
}
