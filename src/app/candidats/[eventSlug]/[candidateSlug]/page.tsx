import { PublicLayout } from "@/components/layout/PublicLayout";
import { query, queryOne } from "@/lib/db/connection";
import { findById } from "@/lib/db/crud";
import { camelKeys, camelRows } from "@/lib/db/helpers";
import { safeQuery } from "@/lib/safe-db";
import { formatCurrency } from "@/lib/utils";
import { displayVoteCount } from "@/lib/votes-display";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";


import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareProfileButton } from "@/components/candidates/ShareProfileButton";

async function findCandidateBySlugs(
  eventSlug: string,
  candidateSlug: string,
  publishedOnly = false
) {
  const pubFilter = publishedOnly
    ? "AND c.published = 1 AND c.status = 'APPROVED' AND e.published = 1"
    : "";
  const row = await queryOne(
    `SELECT c.* FROM \`candidate\` c
     JOIN \`event\` e ON e.id = c.event_id
     WHERE c.slug = ? AND e.slug = ? ${pubFilter}`,
    [candidateSlug, eventSlug]
  );
  if (!row) return null;

  const candidate = camelKeys(row)! as Record<string, unknown>;
  const [event, gallery] = await Promise.all([
    findById("event", candidate.eventId as string),
    query(
      `SELECT * FROM \`gallery_item\`
       WHERE candidate_id = ? AND published = 1
       ORDER BY \`order\` ASC`,
      [candidate.id]
    ),
  ]);

  return {
    ...candidate,
    event,
    gallery: camelRows(gallery),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string; candidateSlug: string }>;
}): Promise<Metadata> {
  const { eventSlug, candidateSlug } = await params;
  const candidate = await findCandidateBySlugs(eventSlug, candidateSlug);
  if (!candidate) return { title: "Candidate introuvable" };
  const c = candidate as unknown as { name: string; number: number; bio?: string; photo?: string };
  return {
    title: `${c.name} — Candidate n°${c.number}`,
    description: c.bio || undefined,
    openGraph: { images: c.photo ? [c.photo] : [] },
  };
}

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ eventSlug: string; candidateSlug: string }>;
}) {
  const { eventSlug, candidateSlug } = await params;

  const candidate = await safeQuery(
    "candidates.profile",
    () => findCandidateBySlugs(eventSlug, candidateSlug, true),
    null
  );

  if (!candidate) notFound();

  const c = candidate as unknown as {
    slug: string;
    name: string;
    number: number;
    photo?: string | null;
    city?: string | null;
    country?: string | null;
    voteCount: number;
    categoryId?: string | null;
    bio?: string | null;
    presentation?: string | null;
    event: { slug: string; name: string; votePrice: number };
    gallery: { id: string; imageUrl: string; title?: string | null }[];
  };

  return (
    <PublicLayout>
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-champagne">
              {c.photo ? (
                <Image
                  src={c.photo}
                  alt={c.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl font-serif text-gold/20">{c.number}</span>
                </div>
              )}
              <div className="absolute top-6 left-6 w-14 h-14 rounded-full gold-gradient flex items-center justify-center text-white font-serif text-2xl shadow-lg">
                {c.number}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <Link
                href={`/events/${c.event.slug}`}
                className="text-sm text-gold hover:text-gold-dark transition-colors mb-2"
              >
                {c.event.name}
              </Link>
              <h1 className="font-serif text-4xl sm:text-5xl text-foreground mb-4">
                {c.name}
              </h1>
              {(c.city || c.country) && (
                <p className="text-muted mb-6">
                  {[c.city, c.country].filter(Boolean).join(", ")}
                </p>
              )}

              <div className="p-6 bg-champagne rounded-2xl mb-8">
                <p className="text-sm text-muted mb-1">Votes reçus</p>
                <p className="font-serif text-4xl text-gold-dark tabular-nums">
                  {displayVoteCount(c.voteCount).toLocaleString("fr-FR")}
                </p>
              </div>

              {c.bio && (
                <div className="mb-6">
                  <h2 className="font-serif text-xl mb-3">Biographie</h2>
                  <p className="text-muted leading-relaxed">{c.bio}</p>
                </div>
              )}

              {c.presentation && (
                <div className="mb-8">
                  <h2 className="font-serif text-xl mb-3">Présentation</h2>
                  <p className="text-muted leading-relaxed whitespace-pre-line">
                    {c.presentation}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Link
                  href={`/vote?event=${c.event.slug}&candidate=${c.slug}${c.categoryId ? `&category=${c.categoryId}` : ""}`}
                  className="inline-flex items-center px-8 py-3.5 text-sm font-medium text-white gold-gradient rounded-full hover:opacity-90 shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                  Voter maintenant — {formatCurrency(c.event.votePrice)}/vote
                </Link>
                <ShareProfileButton
                  path={`/candidats/${c.event.slug}/${c.slug}`}
                />
              </div>
            </div>
          </div>

          {c.gallery.length > 0 && (
            <div className="mt-20">
              <h2 className="font-serif text-2xl mb-8">Galerie personnelle</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {c.gallery.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src={item.imageUrl} alt={item.title || ""} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
