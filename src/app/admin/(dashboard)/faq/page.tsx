"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  published: boolean;
}

const emptyForm = { question: "", answer: "", published: true };

export default function AdminFAQPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch(`/api/admin/faq?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  function handleEdit(item: FAQItem) {
    setEditingId(item.id);
    setForm({ question: item.question, answer: item.answer, published: item.published });
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(editingId ? `/api/admin/faq/${editingId}` : "/api/admin/faq", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const item = await res.json();
      if (editingId) {
        setItems(items.map((i) => (i.id === item.id ? item : i)));
      } else {
        setItems([item, ...items]);
        setTotal((t) => t + 1);
      }
      handleCancelForm();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette question ?")) return;
    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">FAQ</h1>
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
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-in bg-white p-6 rounded-xl border border-border mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-xl">{editingId ? "Modifier la question" : "Nouvelle question"}</h2>
            <button type="button" onClick={handleCancelForm} className="p-1.5 text-muted hover:text-foreground hover:scale-110 transition-all" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <input placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <textarea placeholder="Réponse" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required rows={3} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publié (visible sur le site)
          </label>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
            {editingId ? "Enregistrer" : "Ajouter"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-in bg-white p-4 rounded-xl border border-border hover:border-gold/30 flex justify-between gap-4 transition-colors">
            <div className="min-w-0">
              <p className="font-medium">{item.question}</p>
              <p className="text-sm text-muted mt-1">{item.answer}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleEdit(item)} className="p-2.5 rounded-lg border border-border text-muted hover:border-gold/40 hover:bg-gold/10 hover:text-gold-dark hover:scale-105 transition-all" title="Modifier">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-2.5 rounded-lg border border-border text-muted hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all" title="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
