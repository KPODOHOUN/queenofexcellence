import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Événements",
  description: "Découvrez tous les événements et concours Queen of Excellence.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const statusFilter =
    status === "upcoming"
      ? { status: "UPCOMING" as const }
      : status === "ongoing"
        ? { status: "ONGOING" as const }
        : status === "completed"
          ? { status: "COMPLETED" as const }
          : {};

  const events = await prisma.event.findMany({
    where: { published: true, archived: false, ...statusFilter },
    orderBy: { date: "desc" },
    include: { _count: { select: { candidates: true } } },
  });

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
            <EmptyState title="Aucun événement disponible pour le moment." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {events.map((event, i) => (
                <Reveal key={event.id} delay={(i % 6) * 90}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
