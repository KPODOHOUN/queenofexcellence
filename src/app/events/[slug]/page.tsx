import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventCategoryPanel } from "@/components/events/EventCategoryPanel";
import { Reveal } from "@/components/ui/Reveal";
import { getEventPublicDetail, findEventBySlug } from "@/lib/db/models/events";
import { safeQuery } from "@/lib/safe-db";
import { getEventBlockReason } from "@/lib/events";
import { formatDate, getEventStatusLabel, formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { AttendButton } from "@/components/events/AttendButton";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, MapPin, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await findEventBySlug(slug);
  if (!event) return { title: "Événement introuvable" };
  const e = event as { name: string; shortDesc?: string; description: string; image?: string };
  return {
    title: e.name,
    description: e.shortDesc || e.description,
    openGraph: { images: e.image ? [e.image] : [] },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await safeQuery("events.detail", () => getEventPublicDetail(slug), null);
  if (!event) notFound();

  const e = event as unknown as {
    id: string;
    attendanceFrame?: string | null;
    name: string;
    banner?: string | null;
    image?: string | null;
    status: string;
    date: Date | string;
    time?: string | null;
    location: string;
    presentation?: string | null;
    description: string;
    rules?: string | null;
    votePrice: number;
    slug: string;
    categories: Parameters<typeof EventCategoryPanel>[0]["categories"];
    uncategorizedCandidates?: Parameters<typeof EventCategoryPanel>[0]["uncategorizedCandidates"];
    gallery: { id: string; imageUrl: string; title?: string | null }[];
  };

  const blockReason = getEventBlockReason(event as unknown as Parameters<typeof getEventBlockReason>[0]);
  const votingAllowed = !blockReason;

  return (
    <PublicLayout>
      <section className="relative h-[50vh] min-h-[400px]">
        {e.banner || e.image ? (
          <Image src={e.banner || e.image!} alt={e.name} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-champagne" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/95 rounded-full text-foreground mb-4">
              {getEventStatusLabel(e.status)}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-white mb-4">{e.name}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2"><Calendar size={16} /> {formatDate(e.date)}</span>
              {e.time && <span className="flex items-center gap-2"><Clock size={16} /> {e.time}</span>}
              <span className="flex items-center gap-2"><MapPin size={16} /> {e.location}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <Reveal>
                <h2 className="font-serif text-2xl mb-4">Présentation</h2>
                <p className="text-muted leading-relaxed whitespace-pre-line">{e.presentation || e.description}</p>
              </Reveal>

              {e.rules && (
                <Reveal>
                  <h2 className="font-serif text-2xl mb-4">Règlement</h2>
                  <p className="text-muted leading-relaxed whitespace-pre-line">{e.rules}</p>
                </Reveal>
              )}

              <Reveal>
                <h2 className="font-serif text-2xl mb-6">Catégories & candidates</h2>
                <EventCategoryPanel
                  eventId={votingAllowed ? e.id : undefined}
                  categories={e.categories}
                  uncategorizedCandidates={e.uncategorizedCandidates}
                  eventSlug={e.slug}
                  votePrice={e.votePrice}
                  votingAllowed={votingAllowed}
                />
              </Reveal>

              {e.gallery.length > 0 && (
                <Reveal>
                  <h2 className="font-serif text-2xl mb-6">Galerie</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {e.gallery.map((item) => (
                      <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden">
                        <Image src={item.imageUrl} alt={item.title || ""} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </Reveal>
              )}
            </div>

            <Reveal delay={150} className="space-y-6">
              {blockReason && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
                  <p className="font-medium mb-1">Votes suspendus</p>
                  <p>{blockReason}</p>
                </div>
              )}
              <div className="p-6 border border-border rounded-2xl sticky top-24 bg-white shadow-sm">
                <p className="text-sm text-muted mb-2">Prix du vote</p>
                <p className="text-3xl font-bold text-foreground mb-6">{formatCurrency(e.votePrice)}</p>
                {votingAllowed ? (
                  <>
                    <Link href={`/vote?event=${e.slug}`} className="btn-gold w-full no-underline">
                      Voter maintenant
                    </Link>
                    <Link href={`/billetterie?event=${e.slug}`} className="btn-soft w-full mt-3 no-underline">
                      Acheter un billet
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-muted text-center py-3">Votes temporairement indisponibles.</p>
                )}
                {e.status !== "COMPLETED" && (
                  <AttendButton
                    eventId={e.id}
                    eventName={e.name}
                    eventSlug={e.slug}
                    frameUrl={e.attendanceFrame}
                    className="mt-6 pt-6 border-t border-border"
                  />
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
