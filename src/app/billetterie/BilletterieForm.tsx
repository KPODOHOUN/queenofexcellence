"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FormPageShell } from "@/components/ui/FormPageShell";
import { FormInput, FormSelect } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Ticket, User, Mail, Phone, Minus, Plus } from "lucide-react";

interface Event {
  id: string;
  name: string;
  slug: string;
}

interface Ticket {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
}

export default function BilletterieForm() {
  const searchParams = useSearchParams();
  const preEvent = searchParams.get("event");

  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
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
      setTickets([]);
      return;
    }
    fetch(`/api/public/tickets?eventId=${selectedEvent}`)
      .then((r) => r.json())
      .then(setTickets);
  }, [selectedEvent]);

  const total = tickets.reduce((sum, t) => {
    const qty = quantities[t.id] || 0;
    return sum + qty * t.price;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketId, quantity]) => ({ ticketId, quantity }));

    if (items.length === 0) {
      setError("Sélectionnez au moins un billet");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent,
          items,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
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
      eyebrow="Billetterie"
      title="Réservez votre place"
      description="Assistez à la grande finale et vivez l'excellence en direct."
      dark
    >
      {events.length === 0 ? (
        <Reveal>
          <EmptyState
            title="Aucun événement disponible à la billetterie."
            description="Les places seront bientôt en vente. Restez connectés."
            action={{ label: "Nous contacter", href: "/contact" }}
          />
        </Reveal>
      ) : (
        <Reveal className="max-w-2xl mx-auto">
          <div className="card-elevated gold-ring p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <FormSelect
                label="Événement"
                icon={<Calendar size={18} />}
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                required
              >
                <option value="">Sélectionnez un événement</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </FormSelect>

              {selectedEvent && tickets.length === 0 && (
                <EmptyState title="Aucun billet disponible pour cet événement." />
              )}

              {tickets.map((ticket) => {
                const available = ticket.quantity - ticket.sold;
                const qty = quantities[ticket.id] || 0;
                return (
                  <div
                    key={ticket.id}
                    className="p-6 rounded-2xl border border-border gold-ring transition-all duration-300 hover:border-gold/35"
                  >
                    <div className="flex justify-between items-start gap-4 mb-5">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                          <Ticket size={18} className="text-gold" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg text-foreground">{ticket.name}</h3>
                          {ticket.description && (
                            <p className="text-sm text-muted mt-1">{ticket.description}</p>
                          )}
                          <p className="text-xs text-muted mt-2">{available} places restantes</p>
                        </div>
                      </div>
                      <p className="font-serif text-xl text-gold shrink-0">{formatCurrency(ticket.price)}</p>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantities({ ...quantities, [ticket.id]: Math.max(0, qty - 1) })
                        }
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-gold/40 hover:bg-champagne transition-colors"
                        aria-label="Diminuer"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium tabular-nums">{qty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantities({
                            ...quantities,
                            [ticket.id]: Math.min(10, available, qty + 1),
                          })
                        }
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-gold/40 hover:bg-champagne transition-colors"
                        aria-label="Augmenter"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {total > 0 && (
                <>
                  <div className="p-5 rounded-2xl bg-[#0c0c0c] text-center gold-ring">
                    <p className="text-xs text-white/50 tracking-wider uppercase mb-1">Total</p>
                    <p className="font-serif text-4xl gold-gradient-text">{formatCurrency(total)}</p>
                  </div>

                  <div className="space-y-5">
                    <FormInput
                      label="Votre nom"
                      icon={<User size={18} />}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                    <FormInput
                      label="Email"
                      type="email"
                      icon={<Mail size={18} />}
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />
                    <FormInput
                      label="Téléphone"
                      type="tel"
                      icon={<Phone size={18} />}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      hint="Optionnel"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">{error}</p>
                  )}

                  <Button type="submit" disabled={loading} className="w-full btn-shimmer" size="lg">
                    {loading ? "Traitement..." : `Payer ${formatCurrency(total)}`}
                  </Button>
                </>
              )}
            </form>
          </div>
        </Reveal>
      )}
    </FormPageShell>
  );
}
