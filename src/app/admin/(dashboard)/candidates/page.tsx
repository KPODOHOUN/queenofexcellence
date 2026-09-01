"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, ExternalLink } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Pagination } from "@/components/admin/Pagination";

interface Event {
  id: string;
  name: string;
  slug: string;
}

interface Candidate {
  id: string;
  eventId: string;
  slug: string;
  name: string;
  number: number;
  bio: string | null;
  city: string | null;
  country: string | null;
  photo: string | null;
  status: string;
  published: boolean;
  voteCount: number;
  event: { name: string; slug: string };
}

const emptyForm = {
  eventId: "",
  name: "",
  number: 1,
  bio: "",
  city: "",
  country: "",
  photo: "",
  published: true,
  status: "APPROVED",
};

const statusOptions = [
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvée" },
  { value: "REJECTED", label: "Rejetée" },
];

const statusStyles: Record<string, string> = {
  PENDING: "bg-champagne text-muted",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminCandidatesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
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
    fetch(`/api/admin/candidates?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setCandidates(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  function handleEdit(candidate: Candidate) {
    setEditingId(candidate.id);
    setForm({
      eventId: candidate.eventId,
      name: candidate.name,
      number: candidate.number,
      bio: candidate.bio || "",
      city: candidate.city || "",
      country: candidate.country || "",
      photo: candidate.photo || "",
      published: candidate.published,
      status: candidate.status,
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
      editingId ? `/api/admin/candidates/${editingId}` : "/api/admin/candidates",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    if (res.ok) {
      const candidate = await res.json();
      const event = events.find((ev) => ev.id === (candidate.eventId || form.eventId));
      const merged = { ...candidate, event: { name: event?.name || "", slug: event?.slug || "" } };
      if (editingId) {
        setCandidates(candidates.map((c) => (c.id === merged.id ? { ...c, ...merged } : c)));
      } else {
        setCandidates([merged, ...candidates]);
        setTotal((t) => t + 1);
      }
      handleCancelForm();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette candidate ?")) return;
    await fetch(`/api/admin/candidates/${id}`, { method: "DELETE" });
    setCandidates(candidates.filter((c) => c.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Candidates</h1>
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
          <Plus size={16} /> Nouvelle candidate
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-in bg-white p-6 rounded-xl border border-border mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-xl">{editingId ? "Modifier la candidate" : "Nouvelle candidate"}</h2>
            <button type="button" onClick={handleCancelForm} className="p-1.5 text-muted hover:text-foreground hover:scale-110 transition-all" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} required className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all">
              <option value="">Événement</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input
              type="number"
              placeholder="Numéro"
              value={form.number}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setForm({ ...form, number: 1 });
                  return;
                }
                const parsed = parseInt(raw, 10);
                if (!Number.isNaN(parsed)) setForm({ ...form, number: parsed });
              }}
              required
              className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
            />
            <input placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input placeholder="Pays" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all">
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <ImageUploadField
            label="Photo de la candidate"
            value={form.photo}
            onChange={(photo) => setForm({ ...form, photo })}
            hint="JPG, PNG, WebP ou GIF — max 5 Mo"
          />
          <textarea placeholder="Biographie" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publiée
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
              <th className="text-left p-4">N°</th>
              <th className="text-left p-4">Nom</th>
              <th className="text-left p-4">Événement</th>
              <th className="text-left p-4">Votes</th>
              <th className="text-left p-4">Statut</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr key={c.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-in border-b border-border/60 hover:bg-champagne/50 transition-colors">
                <td className="p-4">{c.number}</td>
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 text-muted">{c.event.name}</td>
                <td className="p-4">{c.voteCount}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[c.status] || "bg-champagne text-muted"}`}>
                    {statusOptions.find((s) => s.value === c.status)?.label || c.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2.5 rounded-lg border border-border text-muted hover:border-gold/40 hover:bg-gold/10 hover:text-gold-dark hover:scale-105 transition-all"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
                    {c.event.slug && c.slug && (
                      <Link
                        href={`/candidats/${c.event.slug}/${c.slug}`}
                        target="_blank"
                        className="p-2.5 rounded-lg border border-border text-muted hover:border-gold/40 hover:bg-gold/10 hover:text-gold-dark hover:scale-105 transition-all"
                        title="Voir le profil public"
                      >
                        <ExternalLink size={18} />
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
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
