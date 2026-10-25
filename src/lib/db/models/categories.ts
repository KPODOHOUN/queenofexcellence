import type { RowDataPacket } from "mysql2/promise";
import { countTable, query } from "../connection";
import { camelRows } from "../helpers";
import { createRow, deleteRow, findMany, updateRow } from "../crud";
import { slugify } from "@/lib/utils";

type CategoryRow = Record<string, unknown>;

export async function findCategoriesByEventId(eventId: string) {
  return findMany<CategoryRow>(
    "event_category",
    "event_id = ?",
    [eventId],
    "`order` ASC, name ASC"
  );
}

export async function syncEventCategories(eventId: string, categoryNames: string[]) {
  const names = categoryNames.map((n) => n.trim()).filter(Boolean);
  const existing = await findCategoriesByEventId(eventId);
  const existingBySlug = new Map(
    existing.map((c) => [String(c.slug), c])
  );

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const slug = slugify(name);
    const found = existingBySlug.get(slug);
    if (found) {
      await updateRow("event_category", found.id as string, { name, order: i });
    } else {
      await createRow("event_category", { eventId, name, slug, order: i });
    }
  }

  const keepSlugs = new Set(names.map((n) => slugify(n)));
  for (const cat of existing) {
    if (keepSlugs.has(String(cat.slug))) continue;
    const linked = await countTable("candidate", "category_id = ?", [cat.id]);
    if (linked === 0) {
      await deleteRow("event_category", cat.id as string);
    }
  }
}

export async function findCategoriesWithCandidates(eventId: string) {
  const categories = await findCategoriesByEventId(eventId);
  const rows = await query<RowDataPacket>(
    `SELECT c.*, e.slug AS event_slug, e.name AS event_name,
            cat.name AS category_name, cat.slug AS category_slug
     FROM \`candidate\` c
     JOIN \`event\` e ON e.id = c.event_id
     LEFT JOIN \`event_category\` cat ON cat.id = c.category_id
     WHERE c.event_id = ? AND c.published = 1 AND c.status = 'APPROVED'
     ORDER BY c.vote_count DESC, c.\`number\` ASC`,
    [eventId]
  );

  const candidates: Array<Record<string, unknown>> = camelRows<Record<string, unknown>>(rows).map((row) => ({
    ...row,
    event: { slug: row.eventSlug, name: row.eventName },
    category: row.categoryId
      ? { name: row.categoryName, slug: row.categorySlug }
      : null,
  }));

  return categories.map((category) => {
    const catCandidates = candidates
      .filter((c) => c.categoryId === category.id)
      .map((c, index) => ({ ...c, rank: index + 1 }));
    return { ...category, candidates: catCandidates };
  });
}

export async function findPublicCategories(eventId: string) {
  const categories = await findCategoriesByEventId(eventId);
  const counts = await query<RowDataPacket>(
    `SELECT category_id, COUNT(*) AS c
     FROM \`candidate\`
     WHERE event_id = ? AND published = 1 AND status = 'APPROVED' AND category_id IS NOT NULL
     GROUP BY category_id`,
    [eventId]
  );
  const countMap = new Map(
    counts.map((r) => [String(r.category_id), Number(r.c)])
  );
  return categories.map((cat) => ({
    ...cat,
    candidateCount: countMap.get(String(cat.id)) ?? 0,
  }));
}
