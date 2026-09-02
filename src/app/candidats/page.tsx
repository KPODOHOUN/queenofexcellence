import { PublicLayout } from "@/components/layout/PublicLayout";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-db";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidats",
  description: "Découvrez les candidates des concours Queen of Excellence.",
};

export default async function CandidatsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventSlug } = await searchParams;

  const events = await safeQuery(
    "candidats.events",
    () =>
      prisma.event.findMany({
        where: { published: true, archived: false },
        orderBy: { date: "desc" },
        select: { id: true, name: true, slug: true },
      }),
    []
  );

  const selectedEvent = eventSlug
    ? events.find((e) => e.slug === eventSlug)
    : events[0];

  const candidates = selectedEvent
    ? await safeQuery(
        "candidats.list",
        () =>
          prisma.candidate.findMany({
            where: {
              eventId: selectedEvent.id,
              published: true,
              status: "APPROVED",
            },
            orderBy: { number: "asc" },
            include: { event: { select: { slug: true, name: true } } },
          }),
        []
      )
    : [];

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Candidats"
        title="Nos candidates"
        description="Sélectionnez un événement et découvrez les talents qui participent au concours."
      />

      <section className="py-10 bg-white border-b border-border/60 sticky top-[72px] lg:top-20 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length === 0 ? null : (
            <div className="flex flex-wrap gap-2 justify-center">
              {events.map((event) => (
                <a
                  key={event.id}
                  href={`/candidats?event=${event.slug}`}
                  className={cn(
                    "px-5 py-2.5 text-sm rounded-full transition-all duration-300",
                    selectedEvent?.slug === event.slug
                      ? "gold-gradient text-white shadow-sm"
                      : "bg-champagne text-foreground/70 hover:text-gold border border-transparent hover:border-gold/20"
                  )}
                >
                  {event.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length === 0 ? (
            <EmptyState title="Aucun événement disponible pour le moment." />
          ) : candidates.length === 0 ? (
            <EmptyState title="Aucune candidate disponible pour cet événement." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {candidates.map((candidate, i) => (
                <Reveal key={candidate.id} delay={(i % 8) * 70}>
                  <CandidateCard candidate={candidate} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
