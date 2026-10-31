import { NextRequest, NextResponse } from "next/server";
import { createRow, findByField, listPaged, newId } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { getPagination, paginatedResponse } from "@/lib/pagination";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().min(10),
  image: z.string().optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
  order: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { page, pageSize, skip, take } = getPagination(request);
  const { items: projects, total } = await listPaged("project", "`order` ASC", skip, take);
  return NextResponse.json(paginatedResponse(projects, total, page, pageSize));
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = schema.parse(body);
    let slug = data.slug || slugify(data.title);
    // Deux actualités peuvent porter le même titre : le slug doit rester unique.
    if (await findByField("project", "slug", slug)) slug = `${slug}-${newId().slice(0, 8)}`;
    const project = await createRow("project", { ...data, slug });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
