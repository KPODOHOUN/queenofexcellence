import { isDatabaseConfigured, query } from "@/lib/db/connection";
import { camelRows } from "@/lib/db/helpers";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  let events: { slug: string; updatedAt: Date | string }[] = [];
  let candidates: { slug: string; updatedAt: Date | string; eventSlug: string }[] = [];

  if (isDatabaseConfigured()) {
    const [eventRows, candidateRows] = await Promise.all([
      query(`SELECT slug, updated_at FROM \`event\` WHERE published = 1`, []),
      query(
        `SELECT c.slug, c.updated_at, e.slug AS event_slug
         FROM \`candidate\` c
         JOIN \`event\` e ON e.id = c.event_id
         WHERE c.published = 1 AND c.status = 'APPROVED'`,
        []
      ),
    ]);
    events = camelRows(eventRows);
    candidates = camelRows(candidateRows);
  }

  const staticPages = [
    "", "/candidats", "/billetterie", "/chiffres", "/galerie", "/actualites",
    "/a-propos", "/faq", "/contact", "/vote", "/events",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const eventPages = events.map((e) => ({
    url: `${baseUrl}/events/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const candidatePages = candidates.map((c) => ({
    url: `${baseUrl}/candidats/${c.eventSlug}/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...eventPages, ...candidatePages];
}
