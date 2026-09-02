"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FormPageShell } from "@/components/ui/FormPageShell";
import { FormInput, FormSelect } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Heart, User, Mail, Phone } from "lucide-react";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <FormPageShell
      eyebrow="Vote"
      title="Soutenez votre candidate"
      description="Chaque vote compte. Soutenez la candidate de votre choix en quelques clics."
      dark
    >
      {events.length === 0 ? (
        <Reveal>
          <EmptyState
            title="Aucun événement ouvert au vote pour le moment."
            description="Revenez bientôt ou contactez-nous pour plus d'informations."
            action={{ label: "Nous contacter", href: "/contact" }}
          />
        </Reveal>
      ) : (
        <Reveal className="max-w-xl mx-auto">
          <div className="card-elevated gold-ring p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormSelect
                label="Événement"
                icon={<Calendar size={18} />}
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value);
                  setSelectedCandidate("");
                }}
                required
              >
                <option value="">Sélectionnez un événement</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </FormSelect>

              <FormSelect
                label="Candidate"
                icon={<Heart size={18} />}
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                required
                disabled={!selectedEvent}
              >
                <option value="">Sélectionnez une candidate</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    N°{c.number} — {c.name}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Nombre de votes"
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
              />

              {currentEvent && (
                <div className="p-5 rounded-2xl bg-[#0c0c0c] text-center gold-ring">
                  <p className="text-xs text-white/50 tracking-wider uppercase mb-1">Montant total</p>
                  <p className="font-serif text-4xl gold-gradient-text">{formatCurrency(totalAmount)}</p>
                </div>
              )}

              <FormInput
                label="Votre nom"
                icon={<User size={18} />}
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                required
              />

              <FormInput
                label="Email"
                type="email"
                icon={<Mail size={18} />}
                value={voterEmail}
                onChange={(e) => setVoterEmail(e.target.value)}
                required
              />

              <FormInput
                label="Téléphone"
                type="tel"
                icon={<Phone size={18} />}
                value={voterPhone}
                onChange={(e) => setVoterPhone(e.target.value)}
                hint="Optionnel"
              />

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full btn-shimmer" size="lg">
                {loading ? "Traitement..." : `Payer ${formatCurrency(totalAmount)}`}
              </Button>
            </form>
          </div>
        </Reveal>
      )}
    </FormPageShell>
  );
}
