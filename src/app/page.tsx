import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { HeroSlider, type HeroSlide } from "@/components/home/HeroSlider";
import { PartnersSlider } from "@/components/home/PartnersSlider";
import { AttendButton } from "@/components/events/AttendButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isDatabaseConfigured, query } from "@/lib/db/connection";
import { findMany } from "@/lib/db/crud";
import { camelRows } from "@/lib/db/helpers";
import {
  findShowcaseEvents,
  findTopCandidates,
  pickFeaturedEvent,
  type ShowcaseCandidate,
  type ShowcaseEvent,
} from "@/lib/db/models/showcase";
import { HERO_SLIDE_COUNT } from "@/lib/home-fallback";
import { getEventStatusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

async function loadHomePageData() {
  const empty = {
    slides: [] as Row[],
    events: [] as ShowcaseEvent[],
    featured: null as ShowcaseEvent | null,
    topCandidates: [] as ShowcaseCandidate[],
    partners: [] as Row[],
  };
  if (!isDatabaseConfigured()) return empty;

  try {
    const [slides, events, partners] = await Promise.all([
      query("SELECT * FROM `hero_slide` WHERE published = 1 ORDER BY `order` ASC, created_at DESC LIMIT ?", [
        HERO_SLIDE_COUNT,
      ]),
      findShowcaseEvents(),
      findMany<Row>("partner", "published = 1", [], "`order` ASC"),
    ]);
    const featured = pickFeaturedEvent(events);
    const topCandidates = featured ? await findTopCandidates(featured.id, 3) : [];
    return { slides: camelRows<Row>(slides), events, featured, topCandidates, partners };
  } catch (error) {
    console.error("HomePage:", error);
    return empty;
  }
}

function toSlides(rows: Row[], featured: ShowcaseEvent | null): HeroSlide[] {
  const slides = rows.map((s) => ({
    id: s.id as string,
    image: (s.image as string) || null,
    subtitle: (s.subtitle as string) || undefined,
    title: s.title as string,
    description: (s.description as string) || undefined,
    ctaPrimary:
      s.ctaPrimaryLabel && s.ctaPrimaryHref
        ? { label: s.ctaPrimaryLabel as string, href: s.ctaPrimaryHref as string }
        : undefined,
    ctaSecondary:
      s.ctaSecondaryLabel && s.ctaSecondaryHref
        ? { label: s.ctaSecondaryLabel as string, href: s.ctaSecondaryHref as string }
        : undefined,
  }));
  if (slides.length > 0) return slides;

  // Aucun slide publié : slide par défaut construit à partir de l'événement en avant.
  return [
    {
      id: "default",
      image: featured?.image ?? null,
      subtitle: featured ? `${featured.name} • ${featured.location}` : undefined,
      title: "Queen of Excellence",
      description: "Découvrez les candidates, votez pour votre favorite et réservez vos places.",
    },
  ];
}

export default async function HomePage() {
  const { slides, events, featured, topCandidates, partners } = await loadHomePageData();
  const upcoming = events.filter((e) => e.status !== "COMPLETED").slice(0, 3);

  return (
    <PublicLayout>
      <HeroSlider slides={toSlides(slides, featured)} />

      {/* Candidates */}
      {featured && topCandidates.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-12">
          <SectionHeading
            eyebrow={featured.name}
            title="Les candidates"
            action={{ label: "Voir tout", href: `/candidats?event=${featured.slug}` }}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topCandidates.map((c) => (
              <CandidateCard key={c.id} candidate={c} variant="spotlight" />
            ))}
          </div>
        </section>
      )}

      {/* Événements */}
      {upcoming.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-12">
          <SectionHeading title="Événements" action={{ label: "Voir tout", href: "/events" }} />
          <div className="grid gap-2 lg:grid-cols-3">
            {upcoming.map((event) => {
              const d = new Date(event.date);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 no-underline hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center justify-center px-2 py-2 rounded bg-champagne-dark min-w-[54px]">
                    <span className="label-sm text-gold-dark">
                      {d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "").toUpperCase()}
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {String(d.getDate()).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="label-sm text-gold-dark">{getEventStatusLabel(event.status)}</span>
                    <h3 className="text-base font-semibold text-foreground truncate">{event.name}</h3>
                    <p className="text-sm text-muted truncate">{event.location}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* J'y serai */}
      {featured && featured.status !== "COMPLETED" && (
        <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-4">
          <div className="bg-white rounded-lg shadow-sm p-4 lg:max-w-xl">
            <p className="text-base font-semibold text-foreground">{featured.name}</p>
            <p className="text-sm text-muted">
              {featured.attendanceFrame
                ? "Vous venez ? Confirmez et créez votre visuel à partager."
                : "Vous venez ? Confirmez votre présence."}
            </p>
            <AttendButton
              eventId={featured.id}
              eventName={featured.name}
              eventSlug={featured.slug}
              frameUrl={featured.attendanceFrame}
              className="mt-3"
            />
          </div>
        </section>
      )}

      {/* Partenaires */}
      {partners.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-12">
          <SectionHeading title="Partenaires" />
          <PartnersSlider
            partners={partners.map((p) => ({
              id: p.id as string,
              name: p.name as string,
              logo: (p.logo as string) || null,
              website: (p.website as string) || null,
            }))}
          />
        </section>
      )}

      <div className="h-12" />
    </PublicLayout>
  );
}
