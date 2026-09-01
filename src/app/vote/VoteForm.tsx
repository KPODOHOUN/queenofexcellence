"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  slug: string;
  votePrice: number;
}

interface Candidate {
  id: string;
  name: string;
  slug: string;
  number: number;
}

export default function VoteForm() {
  const searchParams = useSearchParams();
  const preEvent = searchParams.get("event");
  const preCandidate = searchParams.get("candidate");

  const [events, setEvents] = useState<Event[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [voteCount, setVoteCount] = useState(1);
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [voterPhone, setVoterPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/public/events?votable=true")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data);
        if (preEvent) {
          const ev = data.find((e: Event) => e.slug === preEvent);
          if (ev) setSelectedEvent(ev.id);
        }
      });
  }, [preEvent]);

  useEffect(() => {
    if (!selectedEvent) {
      setCandidates([]);
      return;
    }
    fetch(`/api/public/candidates?eventId=${selectedEvent}`)
      .then((r) => r.json())
      .then((data) => {
        setCandidates(data);
        if (preCandidate) {
          const c = data.find((c: Candidate) => c.slug === preCandidate);
          if (c) setSelectedCandidate(c.id);
        }
      });
  }, [selectedEvent, preCandidate]);

  const currentEvent = events.find((e) => e.id === selectedEvent);
  const totalAmount = currentEvent ? voteCount * currentEvent.votePrice : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent,
          candidateId: selectedCandidate,
          voteCount,
          voterName,
          voterEmail,
          voterPhone: voterPhone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="py-20 lg:py-24 bg-champagne animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-gold/60" />
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Vote</p>
            <span className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-foreground leading-tight tracking-tight">Soutenez votre candidate</h1>
        </div>
      </section>

      <section className="py-4 lg:py-8 pb-20 bg-white">
        <div className="max-w-lg mx-auto px-4">
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in [animation-delay:100ms] [animation-fill-mode:backwards]">
            <div>
              <label className="block text-sm font-medium mb-2">Événement</label>
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value);
                  setSelectedCandidate("");
                }}
                required
                className="w-full px-4 py-3 border border-border rounded-xl bg-white transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="">Sélectionnez un événement</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Candidate</label>
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                required
                disabled={!selectedEvent}
                className="w-full px-4 py-3 border border-border rounded-xl bg-white transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-50"
              >
                <option value="">Sélectionnez une candidate</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    N°{c.number} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nombre de votes</label>
              <input
                type="number"
                min={1}
                max={100}
                value={voteCount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setVoteCount(1);
                    return;
                  }
                  const parsed = parseInt(raw, 10);
                  if (!Number.isNaN(parsed)) setVoteCount(Math.min(100, Math.max(1, parsed)));
                }}
                className="w-full px-4 py-3 border border-border rounded-xl bg-white transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {currentEvent && (
              <div className="p-4 bg-champagne rounded-xl text-center">
                <p className="text-sm text-muted">Montant total</p>
                <p className="font-serif text-3xl text-gold">{formatCurrency(totalAmount)}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Votre nom</label>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-xl bg-white transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={voterEmail}
                onChange={(e) => setVoterEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-xl bg-white transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Téléphone (optionnel)</label>
              <input
                type="tel"
                value={voterPhone}
                onChange={(e) => setVoterPhone(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-white transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Traitement..." : `Payer ${formatCurrency(totalAmount)}`}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
