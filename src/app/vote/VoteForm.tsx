"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { FormPageShell } from "@/components/ui/FormPageShell";
import { FormInput } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { KkiapayScript, useKkiapayPayment, type KkiapayPaymentConfig } from "@/components/payments/KkiapayWidget";
import { cn, formatCurrency } from "@/lib/utils";
import { Calendar, User, Phone, Check, Minus, Plus } from "lucide-react";

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
  voteCount?: number;
  categoryId?: string | null;
}

const VOTE_PRESETS = [1, 3, 5, 10];
const MAX_VOTES = 100;

function clampVotes(value: number) {
  if (Number.isNaN(value)) return 1;
  return Math.min(MAX_VOTES, Math.max(1, Math.floor(value)));
}

function countPhoneDigits(phone: string) {
  return phone.replace(/\D/g, "").length;
}

export default function VoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preEvent = searchParams.get("event");
  const preCandidate = searchParams.get("candidate");
  const preCategory = searchParams.get("category");
  const directVote = Boolean(preEvent && preCandidate);

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [voteCount, setVoteCount] = useState(1);
  const [voterName, setVoterName] = useState("");
  const [voterPhone, setVoterPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState(false);

  const confirmPayment = useCallback(
    async (transactionId: string, reference: string) => {
      const target = `/vote/confirmation?ref=${encodeURIComponent(reference)}&txn=${encodeURIComponent(transactionId)}`;
      try {
        await fetch("/api/payments/kkiapay/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, transactionId }),
        });
      } catch {
        // La page de confirmation re-vérifie côté serveur.
      }
      router.push(target);
    },
    [router]
  );

  const { openPayment } = useKkiapayPayment({
    name: voterName,
    phone: voterPhone,
    callbackPath: "/vote/confirmation",
    onSuccess: confirmPayment,
    onFailed: () => setError("Le paiement a échoué ou a été annulé."),
  });

  useEffect(() => {
    fetch("/api/public/events?votable=true")
      .then((r) => r.json())
      .then((data: Event[]) => {
        setEvents(data);
        if (preEvent) {
          const ev = data.find((e) => e.slug === preEvent);
          if (ev) setSelectedEvent(ev.id);
        } else if (data.length === 1) {
          setSelectedEvent(data[0].id);
        }
      });
  }, [preEvent]);

  useEffect(() => {
    if (!selectedEvent) {
      setCategories([]);
      setSelectedCategory("");
      return;
    }
    fetch(`/api/public/categories?eventId=${selectedEvent}`)
      .then((r) => r.json())
      .then((data: Category[]) => {
        if (!Array.isArray(data)) return;
        setCategories(data);
        if (preCategory) {
          const cat = data.find((c) => c.id === preCategory);
          if (cat) setSelectedCategory(cat.id);
        } else if (directVote) {
          // Catégorie déduite depuis la candidate (effet candidates)
        } else if (data.length === 1) {
          setSelectedCategory(data[0].id);
        } else {
          setSelectedCategory("");
        }
      });
  }, [selectedEvent, preCategory, directVote]);

  useEffect(() => {
    if (!selectedEvent) {
      setCandidates([]);
      return;
    }

    if (directVote) {
      fetch(`/api/public/candidates?eventId=${selectedEvent}`)
        .then((r) => r.json())
        .then((data: Candidate[]) => {
          if (!Array.isArray(data)) return;
          setCandidates(data);
          const match = data.find((item) => item.slug === preCandidate);
          if (match) {
            setSelectedCandidate(match.id);
            if (match.categoryId) setSelectedCategory(match.categoryId);
          }
        });
      return;
    }

    if (categories.length > 0 && !selectedCategory) {
      setCandidates([]);
      setSelectedCandidate("");
      return;
    }
    const url = selectedCategory
      ? `/api/public/candidates?eventId=${selectedEvent}&categoryId=${selectedCategory}`
      : `/api/public/candidates?eventId=${selectedEvent}`;
    fetch(url)
      .then((r) => r.json())
      .then((data: Candidate[]) => {
        setCandidates(data);
        if (preCandidate) {
          const c = data.find((item) => item.slug === preCandidate);
          if (c) setSelectedCandidate(c.id);
        }
      });
  }, [selectedEvent, selectedCategory, categories.length, preCandidate, directVote]);

  const currentEvent = events.find((e) => e.id === selectedEvent);
  const selectedCandidateData = candidates.find((c) => c.id === selectedCandidate);
  const totalAmount = currentEvent ? voteCount * currentEvent.votePrice : 0;
  const showEventPicker = events.length > 1 && !directVote;
  const showCategoryPicker = categories.length > 1 && !directVote;
  const showCandidatePicker =
    !directVote && selectedEvent && (categories.length === 0 || selectedCategory);
  const phoneDigits = countPhoneDigits(voterPhone);
  const readyToPay = Boolean(
    selectedCandidate && voterName.trim().length >= 2 && phoneDigits >= 8 && voteCount >= 1
  );

  const stepLabel = useMemo(() => {
    if (directVote && selectedCandidate) return "Votez pour votre candidate";
    if (!selectedCandidate) return "1. Choisissez une candidate";
    return "2. Nombre de votes et paiement";
  }, [selectedCandidate, directVote]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!readyToPay) return;
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
          voterName: voterName.trim(),
          voterPhone: voterPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      await openPayment(data as KkiapayPaymentConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <KkiapayScript
        onReady={() => {
          setWidgetReady(true);
          setWidgetError(false);
        }}
        onError={() => setWidgetError(true)}
      />
      <FormPageShell
        eyebrow="Vote"
        title={directVote && selectedCandidateData ? `Votez pour ${selectedCandidateData.name}` : "Votez pour votre candidate"}
        description={
          directVote
            ? "Indiquez le nombre de votes et payez via KKiaPay (Mobile Money)."
            : "Choisissez une candidate, le nombre de votes, puis payez via KKiaPay (Mobile Money)."
        }
        dark
      >
        {events.length === 0 ? (
          <Reveal>
            <EmptyState
              title="Aucun événement ouvert au vote."
              description="Revenez bientôt ou contactez-nous."
              action={{ label: "Nous contacter", href: "/contact" }}
            />
          </Reveal>
        ) : (
          <Reveal className="max-w-2xl mx-auto">
            <div className="card-elevated gold-ring p-6 lg:p-8">
              <p className="text-xs font-medium tracking-wider uppercase text-gold mb-6">{stepLabel}</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {showEventPicker && (
                  <div>
                    <p className="text-xs font-medium text-foreground/70 mb-2 flex items-center gap-2">
                      <Calendar size={14} className="text-gold" />
                      Événement
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {events.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => {
                            setSelectedEvent(ev.id);
                            setSelectedCategory("");
                            setSelectedCandidate("");
                          }}
                          className={cn(
                            "px-4 py-2 text-sm rounded-full border transition-all",
                            selectedEvent === ev.id
                              ? "gold-gradient text-foreground border-transparent"
                              : "border-border text-muted hover:border-gold/40 bg-white"
                          )}
                        >
                          {ev.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showCategoryPicker && selectedEvent && (
                  <div>
                    <p className="text-xs font-medium text-foreground/70 mb-2">Catégorie</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedCandidate("");
                          }}
                          className={cn(
                            "px-4 py-2 text-sm rounded-full border transition-all",
                            selectedCategory === cat.id
                              ? "gold-gradient text-foreground border-transparent"
                              : "border-border text-muted hover:border-gold/40 bg-white"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showCandidatePicker && (
                  <div>
                    <p className="text-xs font-medium text-foreground/70 mb-3">Candidate</p>
                    {candidates.length === 0 ? (
                      <p className="text-sm text-muted">Aucune candidate dans cette catégorie.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {candidates.map((c) => {
                          const selected = selectedCandidate === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedCandidate(c.id)}
                              className={cn(
                                "relative text-left rounded-xl border overflow-hidden transition-all",
                                selected
                                  ? "border-gold ring-2 ring-gold/30 shadow-md shadow-gold/10"
                                  : "border-border hover:border-gold/40 bg-white"
                              )}
                            >
                              <div className="relative aspect-[3/4] bg-champagne-dark">
                                {c.photo ? (
                                  <Image src={c.photo} alt={c.name} fill className="object-cover" sizes="120px" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-gold/30">
                                    {c.number}
                                  </div>
                                )}
                                {selected && (
                                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full gold-gradient flex items-center justify-center">
                                    <Check size={14} className="text-foreground" />
                                  </span>
                                )}
                              </div>
                              <div className="p-2.5">
                                <p className="text-[10px] text-muted">N°{c.number}</p>
                                <p className="text-sm font-medium text-foreground line-clamp-1">{c.name}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {selectedCandidateData && currentEvent && (
                  <>
                    <div className="p-4 rounded-xl bg-champagne/80 border border-gold/15 flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-champagne-dark shrink-0">
                        {selectedCandidateData.photo ? (
                          <Image src={selectedCandidateData.photo} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gold font-serif">
                            {selectedCandidateData.number}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted">Vous votez pour</p>
                        <p className="font-serif text-lg text-foreground truncate">{selectedCandidateData.name}</p>
                      </div>
                      <p className="text-xs text-muted shrink-0">{formatCurrency(currentEvent.votePrice)}/vote</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-foreground/70 mb-2">Nombre de votes</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {VOTE_PRESETS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setVoteCount(n)}
                            className={cn(
                              "min-w-[3rem] px-4 py-2 text-sm font-medium rounded-full border transition-all",
                              voteCount === n
                                ? "gold-gradient text-foreground border-transparent"
                                : "border-border text-muted hover:border-gold/40 bg-white"
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setVoteCount((v) => clampVotes(v - 1))}
                          className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-gold/40 hover:bg-champagne transition-colors"
                          aria-label="Diminuer"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={MAX_VOTES}
                          value={voteCount}
                          onChange={(e) => setVoteCount(clampVotes(parseInt(e.target.value, 10)))}
                          className="input-field w-24 text-center tabular-nums"
                          aria-label="Nombre de votes"
                        />
                        <button
                          type="button"
                          onClick={() => setVoteCount((v) => clampVotes(v + 1))}
                          className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-gold/40 hover:bg-champagne transition-colors"
                          aria-label="Augmenter"
                        >
                          <Plus size={16} />
                        </button>
                        <span className="text-xs text-muted">de 1 à {MAX_VOTES} votes</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0c0c0c] text-center">
                      <p className="text-[10px] text-white/50 tracking-wider uppercase mb-1">Total à payer</p>
                      <p className="font-serif text-3xl gold-gradient-text">{formatCurrency(totalAmount)}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput
                        label="Votre nom"
                        icon={<User size={16} />}
                        value={voterName}
                        onChange={(e) => setVoterName(e.target.value)}
                        placeholder="Prénom Nom"
                        required
                      />
                      <FormInput
                        label="Téléphone Mobile Money"
                        type="tel"
                        icon={<Phone size={16} />}
                        value={voterPhone}
                        onChange={(e) => setVoterPhone(e.target.value)}
                        placeholder="+229 ..."
                        required
                        hint="Utilisé pour KKiaPay"
                      />
                    </div>

                    {widgetError && !widgetReady && (
                      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                        KKiaPay met du temps à charger. Patientez quelques secondes ou actualisez la page.
                      </p>
                    )}

                    {error && (
                      <p className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>
                    )}

                    {!readyToPay && selectedCandidate && (
                      <p className="text-xs text-muted text-center">
                        {voterName.trim().length < 2
                          ? "Entrez votre nom pour continuer."
                          : phoneDigits < 8
                            ? "Entrez un numéro de téléphone valide (8 chiffres minimum)."
                            : ""}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !readyToPay}
                      className="w-full btn-shimmer"
                      size="lg"
                    >
                      {loading
                        ? "Ouverture du paiement..."
                        : `Payer ${formatCurrency(totalAmount)}`}
                    </Button>
                  </>
                )}
              </form>
            </div>
          </Reveal>
        )}
      </FormPageShell>
    </>
  );
}
