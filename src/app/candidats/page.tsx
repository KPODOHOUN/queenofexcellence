import { PublicLayout } from "@/components/layout/PublicLayout";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { query } from "@/lib/db/connection";
import { findPublicEvents } from "@/lib/db/models/events";
import { camelKeys } from "@/lib/db/helpers";
import { safeQuery } from "@/lib/safe-db";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidats",
  description: "Découvrez les candidates des concours Queen of Excellence.",
};

async function findApprovedCandidates(eventId: string) {
  const rows = await query(
    `SELECT c.*, e.slug AS event_slug, e.name AS event_name
     FROM \`candidate\` c
     JOIN \`event\` e ON e.id = c.event_id
     WHERE c.event_id = ? AND c.published = 1 AND c.status = 'APPROVED'
     ORDER BY c.\`number\` ASC`,
    [eventId]
  );

  return rows.map((row) => {
    const item = camelKeys(row)! as Record<string, unknown>;
    const { eventSlug, eventName, ...rest } = item;
    return {
      ...rest,
      event: { slug: eventSlug as string, name: eventName as string },
    };
  });
}

export default async function CandidatsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventSlug } = await searchParams;

  const events = await safeQuery(
    "candidats.events",
    () => findPublicEvents(false),
    []
  );

  const selectedEvent = eventSlug
    ? events.find((e) => (e as { slug: string }).slug === eventSlug)
    : events[0];

  const candidates = selectedEvent
    ? await safeQuery(
        "candidats.list",
        () => findApprovedCandidates((selectedEvent as { id: string }).id),
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
              {events.map((event) => {
                const e = event as { id: string; name: string; slug: string };
                return (
                  <a
                    key={e.id}
                    href={`/candidats?event=${e.slug}`}
                    className={cn(
                      "px-5 py-2.5 text-sm rounded-full transition-all duration-300",
                      (selectedEvent as { slug?: string } | undefined)?.slug === e.slug
                        ? "gold-gradient text-white shadow-sm"
                        : "bg-champagne text-foreground/70 hover:text-gold border border-transparent hover:border-gold/20"
                    )}
                  >
                    {e.name}
                  </a>
                );
              })}
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
              {candidates.map((candidate, i) => {
                const c = candidate as Record<string, unknown> & {
                  event: { slug: string; name: string };
                };
                return (
                <Reveal key={c.id as string} delay={(i % 8) * 70}>
                  <CandidateCard candidate={candidate as Parameters<typeof CandidateCard>[0]["candidate"]} />
                </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
