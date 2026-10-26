import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { findShowcaseEvents } from "@/lib/db/models/showcase";
import { safeQuery } from "@/lib/safe-db";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Événements",
  description: "Découvrez tous les événements et concours Queen of Excellence.",
};

const FILTERS = [
  { value: "", label: "Tous", status: null },
  { value: "upcoming", label: "À venir", status: "UPCOMING" },
  { value: "ongoing", label: "En cours", status: "ONGOING" },
  { value: "completed", label: "Passés", status: "COMPLETED" },
] as const;

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const all = await safeQuery("events.list", () => findShowcaseEvents(), []);

  const active = FILTERS.find((f) => f.value === status) ?? FILTERS[0];
  const events = active.status ? all.filter((e) => e.status === active.status) : all;
  // À venir / en cours d'abord, éditions passées ensuite
  const sorted = [...events].sort((a, b) => {
    const pa = a.status === "COMPLETED" ? 1 : 0;
    const pb = b.status === "COMPLETED" ? 1 : 0;
    return pa - pb || (pa ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  return (
    <PublicLayout>
      <PageHero
        title="Événements"
        description="Concours, galas et finales Queen of Excellence."
      />

      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-4">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {FILTERS.map((f) => {
            const count = f.status ? all.filter((e) => e.status === f.status).length : all.length;
            const selected = f.value === active.value;
            return (
              <Link
                key={f.value}
                href={f.value ? `/events?status=${f.value}` : "/events"}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap no-underline transition-colors",
                  selected ? "bg-onyx text-white shadow-sm" : "bg-champagne-dark text-muted hover:bg-[#e8e8e8]"
                )}
              >
                {f.label}
                {f.status ? ` (${count})` : ""}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-16">
        {sorted.length === 0 ? (
          <EmptyState title="Aucun événement dans cette catégorie." action={{ label: "Tous les événements", href: "/events" }} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {sorted.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
