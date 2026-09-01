import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const [events, candidates] = await Promise.all([
    prisma.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.candidate.findMany({
      where: { published: true, status: "APPROVED" },
      select: { slug: true, updatedAt: true, event: { select: { slug: true } } },
    }),
  ]);

  const staticPages = [
    "", "/candidats", "/billetterie", "/chiffres", "/galerie", "/projets",
    "/impact", "/a-propos", "/faq", "/contact", "/vote", "/events",
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
    url: `${baseUrl}/candidats/${c.event.slug}/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...eventPages, ...candidatePages];
}
