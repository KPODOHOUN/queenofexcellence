"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, CheckCircle, Ban } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";

interface Event {
  id: string;
  name: string;
}

interface Ticket {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
  active: boolean;
  event: { name: string };
}

const emptyForm = {
  eventId: "",
  name: "",
  description: "",
  price: 5000,
  quantity: 100,
};

export default function AdminTicketsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/admin/events?pageSize=200").then((r) => r.json()).then((d) => setEvents(d.items));
  }, []);

  useEffect(() => {
    fetch(`/api/admin/tickets?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setTickets(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  function handleEdit(ticket: Ticket) {
    setEditingId(ticket.id);
    setForm({
      eventId: ticket.eventId,
      name: ticket.name,
      description: ticket.description || "",
      price: ticket.price,
      quantity: ticket.quantity,
    });
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(
      editingId ? `/api/admin/tickets/${editingId}` : "/api/admin/tickets",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    if (res.ok) {
      const ticket = await res.json();
      const event = events.find((ev) => ev.id === (ticket.eventId || form.eventId));
      const merged = { ...ticket, event: { name: event?.name || "" } };
      if (editingId) {
        setTickets(tickets.map((t) => (t.id === merged.id ? { ...t, ...merged } : t)));
      } else {
        setTickets([merged, ...tickets]);
        setTotal((v) => v + 1);
      }
      handleCancelForm();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce billet ?")) return;
    await fetch(`/api/admin/tickets/${id}`, { method: "DELETE" });
    setTickets(tickets.filter((t) => t.id !== id));
    setTotal((v) => Math.max(0, v - 1));
  }

  async function toggleActive(ticket: Ticket) {
    const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ticket.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTickets(tickets.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    }
  }

  function safeNumberChange(key: "price" | "quantity", raw: string) {
    if (raw === "") {
      setForm({ ...form, [key]: 0 });
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) setForm({ ...form, [key]: parsed });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Billetterie</h1>
        <button
          onClick={() => {
            if (showForm) {
              handleCancelForm();
            } else {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
        >
          <Plus size={16} /> Nouveau billet
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-in bg-white p-6 rounded-xl border border-border mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-xl">{editingId ? "Modifier le billet" : "Nouveau billet"}</h2>
            <button type="button" onClick={handleCancelForm} className="p-1.5 text-muted hover:text-foreground hover:scale-110 transition-all" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} required className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all">
              <option value="">Événement</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            <input placeholder="Nom du billet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input placeholder="Description (optionnel)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input
              type="number"
              placeholder="Prix"
              value={form.price}
              onChange={(e) => safeNumberChange("price", e.target.value)}
              className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
            />
            <input
              type="number"
              placeholder="Quantité"
              value={form.quantity}
              onChange={(e) => safeNumberChange("quantity", e.target.value)}
              className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
            />
          </div>
          <button type="submit" className="flex items-center justify-center gap-2 px-6 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
            {editingId ? "Enregistrer" : "Créer"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden animate-fade-in">
        <table className="w-full text-sm">
          <thead className="bg-champagne/30 border-b border-border">
            <tr>
              <th className="text-left p-4">Billet</th>
              <th className="text-left p-4">Événement</th>
              <th className="text-left p-4">Prix</th>
              <th className="text-left p-4">Vendus / Total</th>
              <th className="text-left p-4">Actif</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr key={t.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-in border-b border-border/60 hover:bg-champagne/50 transition-colors">
                <td className="p-4 font-medium">{t.name}</td>
                <td className="p-4 text-muted">{t.event.name}</td>
                <td className="p-4">{formatCurrency(t.price)}</td>
                <td className="p-4">{t.sold} / {t.quantity}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(t)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      t.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-champagne text-foreground/70 hover:bg-champagne-dark"
                    }`}
                  >
                    {t.active ? (
                      <>
                        <CheckCircle size={12} /> Actif
                      </>
                    ) : (
                      <>
                        <Ban size={12} /> Inactif
                      </>
                    )}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-2.5 rounded-lg border border-border text-muted hover:border-gold/40 hover:bg-gold/10 hover:text-gold-dark hover:scale-105 transition-all"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-2.5 rounded-lg border border-border text-muted hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
