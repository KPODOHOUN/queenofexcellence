import Link from "next/link";
import Image from "next/image";
import { AttendButton } from "@/components/events/AttendButton";
import { cn, formatCurrency, formatDate, getEventStatusLabel } from "@/lib/utils";

interface EventCardProps {
  event: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    shortDesc: string | null;
    description: string;
    date: Date | string;
    time?: string | null;
    location: string;
    status: string;
    minTicketPrice?: number | null;
    ticketCapacity?: number;
    ticketsSold?: number;
    attendanceFrame?: string | null;
    _count?: { candidates: number };
    candidateCount?: number;
  };
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const isPast = event.status === "COMPLETED";
  const capacity = event.ticketCapacity ?? 0;
  const sold = event.ticketsSold ?? 0;
  const fill = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : null;
  const hasTickets = !isPast && event.minTicketPrice != null;

  return (
    <article className={cn("card-elevated overflow-hidden flex flex-col", className)}>
      <Link href={`/events/${event.slug}`} className="relative block w-full aspect-[16/9] bg-onyx overflow-hidden no-underline">
        {event.image && (
          <Image
            src={event.image}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn("object-cover", isPast && "grayscale-[30%]")}
          />
        )}
        <span className="absolute top-3 left-3 bg-white text-foreground text-xs font-semibold px-2 py-1 rounded">
          {isPast ? "Terminé" : getEventStatusLabel(event.status)}
        </span>
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-sm text-muted">
          {formatDate(event.date)}
          {event.time ? ` • ${event.time}` : ""} • {event.location}
        </p>
        <h2 className="text-lg font-semibold text-foreground leading-snug">{event.name}</h2>
        <p className="text-sm text-muted line-clamp-2">{event.shortDesc || event.description}</p>

        {hasTickets && fill !== null && (
          <div className="mt-1">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Dès {formatCurrency(event.minTicketPrice!)}</span>
              <span>{fill}% réservé</span>
            </div>
            <div className="h-1.5 bg-champagne-dark rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full" style={{ width: `${fill}%` }} />
            </div>
          </div>
        )}

        {!isPast && (
          <AttendButton
            eventId={event.id}
            eventName={event.name}
            eventSlug={event.slug}
            frameUrl={event.attendanceFrame}
            className="mt-2 pt-3 border-t border-border"
          />
        )}

        <div className="mt-auto pt-3 flex gap-2">
          {hasTickets ? (
            <Link href={`/billetterie?event=${event.slug}`} className="btn-gold flex-1 no-underline">
              Réserver
            </Link>
          ) : (
            <Link href={`/events/${event.slug}`} className="btn-soft flex-1 no-underline">
              Voir l&apos;événement
            </Link>
          )}
          {!isPast && (
            <Link href={`/candidats?event=${event.slug}`} className="btn-soft flex-1 no-underline">
              Candidates
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
