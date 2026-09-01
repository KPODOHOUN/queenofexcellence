"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Ban, CheckCircle, ExternalLink, X } from "lucide-react";
import { getEventStatusLabel } from "@/lib/utils";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Pagination } from "@/components/admin/Pagination";

interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  date: string;
  time: string | null;
  location: string;
  votePrice: number;
  status: string;
  published: boolean;
  blocked: boolean;
  image: string | null;
  banner: string | null;
  _count?: { candidates: number; votes: number };
}

const emptyForm = {
  name: "",
  description: "",
  shortDesc: "",
  date: "",
  time: "",
  location: "",
  votePrice: 500,
  status: "DRAFT",
  published: false,
  image: "",
  banner: "",
};

const statusOptions = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "UPCOMING", label: "À venir" },
  { value: "ONGOING", label: "En cours" },
  { value: "COMPLETED", label: "Terminé" },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch(`/api/admin/events?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  function handleEdit(event: Event) {
    setEditingId(event.id);
    setForm({
      name: event.name,
      description: event.description,
      shortDesc: event.shortDesc || "",
      date: event.date.slice(0, 10),
      time: event.time || "",
      location: event.location,
      votePrice: event.votePrice,
      status: event.status,
      published: event.published,
      image: event.image || "",
      banner: event.banner || "",
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
      editingId ? `/api/admin/events/${editingId}` : "/api/admin/events",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    if (res.ok) {
      const event = await res.json();
      if (editingId) {
        setEvents(events.map((e) => (e.id === event.id ? { ...e, ...event } : e)));
      } else {
        setEvents([event, ...events]);
        setTotal((t) => t + 1);
      }
      handleCancelForm();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    setEvents(events.filter((e) => e.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  async function toggleField(event: Event, field: "published" | "blocked") {
    const res = await fetch(`/api/admin/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !event[field] }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEvents(events.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Événements</h1>
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
          <Plus size={16} /> Nouvel événement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-in bg-white p-6 rounded-xl border border-border mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-xl">{editingId ? "Modifier l'événement" : "Nouvel événement"}</h2>
            <button type="button" onClick={handleCancelForm} className="p-1.5 text-muted hover:text-foreground hover:scale-110 transition-all" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input placeholder="Lieu" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input placeholder="Heure" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input
              type="number"
              placeholder="Prix vote (FCFA)"
              value={form.votePrice}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setForm({ ...form, votePrice: 0 });
                  return;
                }
                const parsed = parseInt(raw, 10);
                if (!Number.isNaN(parsed)) setForm({ ...form, votePrice: parsed });
              }}
              className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
            />
            <input placeholder="Description courte" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <div>
              <label className="block text-xs text-muted mb-1.5">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploadField
              label="Image vignette"
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
            />
            <ImageUploadField
              label="Bannière"
              value={form.banner}
              onChange={(banner) => setForm({ ...form, banner })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publier immédiatement
          </label>
          <button type="submit" className="px-6 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
            {editingId ? "Enregistrer" : "Créer"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden animate-fade-in">
        <table className="w-full text-sm">
          <thead className="bg-champagne/30 border-b border-border">
            <tr>
              <th className="text-left p-4 font-medium">Nom</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Statut</th>
              <th className="text-left p-4 font-medium">Candidates</th>
              <th className="text-left p-4 font-medium">Publié</th>
              <th className="text-left p-4 font-medium">Votes / Billets</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <tr key={event.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-in border-b border-border/60 last:border-0 hover:bg-champagne/50 transition-colors">
                <td className="p-4 font-medium">
                  {event.name}
                  {event.blocked && (
                    <span className="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-wide bg-red-100 text-red-700 rounded">
                      Bloqué
                    </span>
                  )}
                </td>
                <td className="p-4 text-muted">{new Date(event.date).toLocaleDateString("fr-FR")}</td>
                <td className="p-4">{getEventStatusLabel(event.status)}</td>
                <td className="p-4">{event._count?.candidates ?? 0}</td>
                <td className="p-4">
                  <button onClick={() => toggleField(event, "published")} className={`px-2 py-1 rounded text-xs transition-colors ${event.published ? "bg-green-100 text-green-700" : "bg-champagne text-muted"}`}>
                    {event.published ? "Oui" : "Non"}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleField(event, "blocked")}
                    title={event.blocked ? "Débloquer votes et billetterie" : "Bloquer votes et billetterie"}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      event.blocked
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-champagne text-foreground/70 hover:bg-champagne-dark"
                    }`}
                  >
                    {event.blocked ? (
                      <>
                        <Ban size={12} /> Bloqué
                      </>
                    ) : (
                      <>
                        <CheckCircle size={12} /> Actif
                      </>
                    )}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-2.5 rounded-lg border border-border text-muted hover:border-gold/40 hover:bg-gold/10 hover:text-gold-dark hover:scale-105 transition-all"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
                    <Link
                      href={`/events/${event.slug}`}
                      target="_blank"
                      className="p-2.5 rounded-lg border border-border text-muted hover:border-gold/40 hover:bg-gold/10 hover:text-gold-dark hover:scale-105 transition-all"
                      title="Voir sur le site"
                    >
                      <ExternalLink size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
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
