import { PublicLayout } from "@/components/layout/PublicLayout";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-db";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";


import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareProfileButton } from "@/components/candidates/ShareProfileButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string; candidateSlug: string }>;
}): Promise<Metadata> {
  const { eventSlug, candidateSlug } = await params;
  const candidate = await prisma.candidate.findFirst({
    where: { slug: candidateSlug, event: { slug: eventSlug } },
  });
  if (!candidate) return { title: "Candidate introuvable" };
  return {
    title: `${candidate.name} — Candidate n°${candidate.number}`,
    description: candidate.bio || undefined,
    openGraph: { images: candidate.photo ? [candidate.photo] : [] },
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
    () =>
      prisma.candidate.findFirst({
        where: {
          slug: candidateSlug,
          published: true,
          status: "APPROVED",
          event: { slug: eventSlug, published: true },
        },
        include: {
          event: true,
          gallery: { where: { published: true }, orderBy: { order: "asc" } },
        },
      }),
    null
  );

  if (!candidate) notFound();

  return (
    <PublicLayout>
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-champagne">
              {candidate.photo ? (
                <Image
                  src={candidate.photo}
                  alt={candidate.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl font-serif text-gold/20">{candidate.number}</span>
                </div>
              )}
              <div className="absolute top-6 left-6 w-14 h-14 rounded-full gold-gradient flex items-center justify-center text-white font-serif text-2xl shadow-lg">
                {candidate.number}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <Link
                href={`/events/${candidate.event.slug}`}
                className="text-sm text-gold hover:text-gold-dark transition-colors mb-2"
              >
                {candidate.event.name}
              </Link>
              <h1 className="font-serif text-4xl sm:text-5xl text-foreground mb-4">
                {candidate.name}
              </h1>
              {(candidate.city || candidate.country) && (
                <p className="text-muted mb-6">
                  {[candidate.city, candidate.country].filter(Boolean).join(", ")}
                </p>
              )}

              <div className="p-6 bg-champagne rounded-2xl mb-8">
                <p className="text-sm text-muted mb-1">Votes reçus</p>
                <p className="font-serif text-4xl text-gold">{candidate.voteCount}</p>
              </div>

              {candidate.bio && (
                <div className="mb-6">
                  <h2 className="font-serif text-xl mb-3">Biographie</h2>
                  <p className="text-muted leading-relaxed">{candidate.bio}</p>
                </div>
              )}

              {candidate.presentation && (
                <div className="mb-8">
                  <h2 className="font-serif text-xl mb-3">Présentation</h2>
                  <p className="text-muted leading-relaxed whitespace-pre-line">
                    {candidate.presentation}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Link
                  href={`/vote?event=${candidate.event.slug}&candidate=${candidate.slug}`}
                  className="inline-flex items-center px-8 py-3.5 text-sm font-medium text-white gold-gradient rounded-full hover:opacity-90 shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                  Voter maintenant — {formatCurrency(candidate.event.votePrice)}/vote
                </Link>
                <ShareProfileButton
                  path={`/candidats/${candidate.event.slug}/${candidate.slug}`}
                />
              </div>
            </div>
          </div>

          {candidate.gallery.length > 0 && (
            <div className="mt-20">
              <h2 className="font-serif text-2xl mb-8">Galerie personnelle</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {candidate.gallery.map((item) => (
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
