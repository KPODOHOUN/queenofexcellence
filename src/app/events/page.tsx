import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { query } from "@/lib/db/connection";
import { camelRows } from "@/lib/db/helpers";
import { safeQuery } from "@/lib/safe-db";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Événements",
  description: "Découvrez tous les événements et concours Queen of Excellence.",
};

async function findPublicEventsList(status?: string) {
  let where = "e.published = 1 AND e.archived = 0";
  const params: unknown[] = [];
  if (status === "upcoming") {
    where += " AND e.status = ?";
    params.push("UPCOMING");
  } else if (status === "ongoing") {
    where += " AND e.status = ?";
    params.push("ONGOING");
  } else if (status === "completed") {
    where += " AND e.status = ?";
    params.push("COMPLETED");
  }

  const rows = await query(
    `SELECT e.*,
      (SELECT COUNT(*) FROM \`candidate\` c WHERE c.event_id = e.id) AS candidate_count
     FROM \`event\` e
     WHERE ${where}
     ORDER BY e.date DESC`,
    params
  );

  return camelRows<Record<string, unknown>>(rows).map((row) => {
    const { candidateCount, ...rest } = row;
    return {
      ...rest,
      _count: { candidates: Number(candidateCount ?? 0) },
    };
  });
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const events = await safeQuery(
    "events.list",
    () => findPublicEventsList(status),
    []
  );

  const filters = [
    { label: "Tous", value: "" },
    { label: "À venir", value: "upcoming" },
    { label: "En cours", value: "ongoing" },
    { label: "Terminés", value: "completed" },
  ];

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Événements"
        title="Nos concours"
        description="Explorez tous nos événements et trouvez celui qui vous inspire."
      />

      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-wrap gap-2 justify-center mb-12">
            {filters.map((f) => (
              <a
                key={f.value}
                href={f.value ? `/events?status=${f.value}` : "/events"}
                className={cn(
                  "px-5 py-2.5 text-sm rounded-full transition-all duration-300 hover:-translate-y-0.5",
                  (status || "") === f.value
                    ? "gold-gradient text-white shadow-sm"
                    : "bg-champagne text-foreground/70 hover:text-gold"
                )}
              >
                {f.label}
              </a>
            ))}
          </Reveal>
          {events.length === 0 ? (
            <EmptyState
              title="Aucun événement disponible pour le moment."
              action={{ label: "Nous contacter", href: "/contact" }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {events.map((event, i) => {
                const e = event as Record<string, unknown>;
                return (
                <Reveal key={e.id as string} delay={(i % 6) * 90}>
                  <EventCard event={event as Parameters<typeof EventCard>[0]["event"]} />
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
