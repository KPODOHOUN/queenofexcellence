import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, getEventAdminDetail, updateEvent } from "@/lib/db";
import { dbErrorResponse, normalizeEventFields } from "@/lib/db/errors";
import { syncEventCategories } from "@/lib/db/models/categories";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const eventSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  image: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
  attendanceFrame: z.string().optional().nullable(),
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
  categories: z.array(z.string().min(1)).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const event = await getEventAdminDetail(id);
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
    const { categories, ...rest } = data;
    const updateData = normalizeEventFields({ ...rest });
    if (rest.date) updateData.date = new Date(rest.date);
    if (rest.name && !rest.slug) updateData.slug = slugify(rest.name);

    await updateEvent(id, updateData);
    if (categories) {
      await syncEventCategories(id, categories);
    }
    const event = await getEventAdminDetail(id);
    return NextResponse.json(event);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return dbErrorResponse(err, "Modification événement");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await deleteEvent(id);
  return NextResponse.json({ success: true });
}
