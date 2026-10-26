import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CandidatesBrowser } from "@/components/candidates/CandidatesBrowser";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { findPublicCategories } from "@/lib/db/models/categories";
import { findEventCandidates, findShowcaseEvents, pickFeaturedEvent } from "@/lib/db/models/showcase";
import { safeQuery } from "@/lib/safe-db";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidates",
  description: "Découvrez les candidates des concours Queen of Excellence.",
};

export default async function CandidatsPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event: eventSlug } = await searchParams;

  const events = await safeQuery("candidats.events", () => findShowcaseEvents(), []);
  const selected = (eventSlug && events.find((e) => e.slug === eventSlug)) || pickFeaturedEvent(events);

  const [candidates, categories] = selected
    ? await Promise.all([
        safeQuery("candidats.list", () => findEventCandidates(selected.id), []),
        safeQuery("candidats.categories", () => findPublicCategories(selected.id), []),
      ])
    : [[], []];

  return (
    <PublicLayout>
      <PageHero
        eyebrow={selected?.name}
        title="Candidates"
        description="Découvrez les candidates et votez pour votre favorite."
      />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 pb-16">
        {events.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4 -mx-5 px-5 lg:mx-0 lg:px-0">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/candidats?event=${e.slug}`}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium no-underline border transition-colors",
                  selected?.id === e.id
                    ? "border-gold bg-gold/10 text-gold-dark"
                    : "border-border text-muted hover:text-foreground"
                )}
              >
                {e.name}
              </Link>
            ))}
          </div>
        )}

        {!selected ? (
          <EmptyState title="Aucun événement disponible pour le moment." />
        ) : candidates.length === 0 ? (
          <EmptyState title="Aucune candidate publiée pour cet événement." />
        ) : (
          <CandidatesBrowser
            candidates={candidates}
            categories={(categories as unknown as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))}
          />
        )}
      </div>
    </PublicLayout>
  );
}
