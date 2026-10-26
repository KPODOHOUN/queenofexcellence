"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { EmptyState } from "@/components/ui/EmptyState";
import { VoteModal } from "@/components/payments/VoteModal";
import { cn, formatCurrency } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  slug: string;
  votePrice: number;
}

interface Category {
  id: string;
  name: string;
}

interface Candidate {
  id: string;
  name: string;
  slug: string;
  number: number;
  photo?: string | null;
  categoryId?: string | null;
}

/** Page « Voter » : choix de la candidate, puis fenêtre de paiement. */
export default function VoteForm() {
  const searchParams = useSearchParams();
  const preEvent = searchParams.get("event");
  const preCandidate = searchParams.get("candidate");
  const preCategory = searchParams.get("category");

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [eventId, setEventId] = useState("");
  const [categoryId, setCategoryId] = useState(preCategory ?? "");
  const [chosen, setChosen] = useState<Candidate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    fetch("/api/public/events?votable=true")
      .then((r) => r.json())
      .then((data: Event[]) => {
        if (!Array.isArray(data)) return;
        setEvents(data);
        const match = preEvent ? data.find((e) => e.slug === preEvent) : undefined;
        setEventId((match ?? data[0])?.id ?? "");
      })
      .finally(() => setEventsLoaded(true));
  }, [preEvent]);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      fetch(`/api/public/categories?eventId=${eventId}`).then((r) => r.json()),
      fetch(`/api/public/candidates?eventId=${eventId}`).then((r) => r.json()),
    ]).then(([cats, cands]: [Category[], Candidate[]]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      const list = Array.isArray(cands) ? cands : [];
      setCandidates(list);
      const pre = preCandidate ? list.find((c) => c.slug === preCandidate) : undefined;
      if (pre) {
        setChosen(pre);
        setModalOpen(true);
      }
    });
  }, [eventId, preCandidate]);

  const event = events.find((e) => e.id === eventId);
  const visible = categoryId ? candidates.filter((c) => c.categoryId === categoryId) : candidates;

  if (eventsLoaded && events.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-10">
        <EmptyState
          className="card-elevated"
          title="Aucun événement ouvert au vote."
          description="Revenez bientôt ou contactez-nous."
          action={{ label: "Nous contacter", href: "/contact" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pb-16">
      {event && <p className="text-sm text-muted mb-4">{formatCurrency(event.votePrice)} par vote</p>}

      {events.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {events.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => {
                setEventId(ev.id);
                setCategoryId("");
              }}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium",
                eventId === ev.id ? "bg-onyx text-white" : "bg-champagne-dark text-muted"
              )}
            >
              {ev.name}
            </button>
          ))}
        </div>
      )}

      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {[{ id: "", name: "Toutes" }, ...categories].map((cat) => (
            <button
              key={cat.id || "all"}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium",
                categoryId === cat.id ? "bg-onyx text-white" : "bg-champagne-dark text-muted"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {eventsLoaded && visible.length === 0 ? (
        <p className="text-sm text-muted">Aucune candidate disponible.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setChosen(c);
                setModalOpen(true);
              }}
              className="text-left card-elevated overflow-hidden"
            >
              <div className="relative aspect-[3/4] bg-onyx">
                {c.photo ? (
                  <Image src={c.photo} alt={c.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover object-top" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white/15">
                    {c.number}
                  </span>
                )}
                <span className="absolute top-2 left-2 bg-white text-foreground text-xs font-semibold px-2 py-0.5 rounded">
                  N° {c.number}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-foreground line-clamp-1">{c.name}</p>
                <p className="text-sm text-gold-dark font-medium mt-1">Voter</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {chosen && event && (
        <VoteModal
          open={modalOpen}
          onClose={closeModal}
          candidate={{ id: chosen.id, name: chosen.name, number: chosen.number, photo: chosen.photo }}
          event={{ id: event.id, name: event.name, votePrice: event.votePrice }}
        />
      )}
    </div>
  );
}
