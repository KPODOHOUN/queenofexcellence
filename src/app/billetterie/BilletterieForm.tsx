"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

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
    <>
      <section className="py-20 lg:py-24 bg-champagne animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-gold/60" />
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Billetterie</p>
            <span className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-foreground leading-tight tracking-tight">Réservez votre place</h1>
        </div>
      </section>

      <section className="py-4 lg:py-8 pb-20 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in [animation-delay:100ms] [animation-fill-mode:backwards]">
            <div>
              <label className="block text-sm font-medium mb-2">Événement</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="">Sélectionnez un événement</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>

            {selectedEvent && tickets.length === 0 && (
              <EmptyState title="Aucun billet disponible pour cet événement." />
            )}

            {tickets.map((ticket) => {
              const available = ticket.quantity - ticket.sold;
              return (
                <div key={ticket.id} className="p-6 border border-border rounded-2xl transition-all duration-300 hover:border-gold/30 hover:shadow-md hover:shadow-gold/5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-serif text-lg">{ticket.name}</h3>
                      {ticket.description && (
                        <p className="text-sm text-muted mt-1">{ticket.description}</p>
                      )}
                    </div>
                    <p className="font-serif text-xl text-gold">{formatCurrency(ticket.price)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{available} places restantes</span>
                    <input
                      type="number"
                      min={0}
                      max={Math.min(10, available)}
                      value={quantities[ticket.id] || 0}
                      onChange={(e) =>
                        setQuantities({ ...quantities, [ticket.id]: parseInt(e.target.value) || 0 })
                      }
                      className="w-20 px-3 py-2 border border-border rounded-lg text-center"
                    />
                  </div>
                </div>
              );
            })}

            {total > 0 && (
              <>
                <div className="p-4 bg-champagne rounded-xl text-center">
                  <p className="text-sm text-muted">Total</p>
                  <p className="font-serif text-3xl text-gold">{formatCurrency(total)}</p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Votre nom"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone (optionnel)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
                )}

                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? "Traitement..." : `Payer ${formatCurrency(total)}`}
                </Button>
              </>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
