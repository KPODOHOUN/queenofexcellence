import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { JySeraiStudio } from "@/components/events/JySeraiStudio";
import { PageHero } from "@/components/ui/PageHero";
import { findEventBySlug } from "@/lib/db/models/events";
import { safeImageSrc, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "J'y serai",
  description: "Confirmez votre présence et créez votre visuel « J'y serai » à partager.",
};

export default async function JySeraiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = (await findEventBySlug(slug, true).catch(() => null)) as {
    id: string;
    name: string;
    slug: string;
    date: Date | string;
    location: string;
    attendanceFrame?: string | null;
  } | null;
  if (!event) notFound();

  return (
    <PublicLayout>
      <PageHero
        eyebrow={event.name}
        title="J'y serai"
        description={`${formatDate(event.date)} • ${event.location}. Ajoutez votre photo, recadrez-la, puis téléchargez votre visuel à partager.`}
      />
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-16">
        <JySeraiStudio
          eventId={event.id}
          eventSlug={event.slug}
          eventName={event.name}
          frameUrl={safeImageSrc(event.attendanceFrame)}
        />
      </section>
    </PublicLayout>
  );
}
