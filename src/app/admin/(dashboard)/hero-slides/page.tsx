"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, GripVertical } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Pagination } from "@/components/admin/Pagination";

interface HeroSlide {
  id: string;
  image: string;
  subtitle: string | null;
  title: string;
  description: string | null;
  ctaPrimaryLabel: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryLabel: string | null;
  ctaSecondaryHref: string | null;
  published: boolean;
  order: number;
}

const emptyForm = {
  image: "",
  subtitle: "",
  title: "",
  description: "",
  ctaPrimaryLabel: "",
  ctaPrimaryHref: "",
  ctaSecondaryLabel: "",
  ctaSecondaryHref: "",
  published: true,
  order: 0,
};

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const publishedCount = slides.filter((s) => s.published).length;

  useEffect(() => {
    fetch(`/api/admin/hero-slides?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setSlides(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  function handleEdit(slide: HeroSlide) {
    setEditingId(slide.id);
    setForm({
      image: slide.image,
      subtitle: slide.subtitle || "",
      title: slide.title,
      description: slide.description || "",
      ctaPrimaryLabel: slide.ctaPrimaryLabel || "",
      ctaPrimaryHref: slide.ctaPrimaryHref || "",
      ctaSecondaryLabel: slide.ctaSecondaryLabel || "",
      ctaSecondaryHref: slide.ctaSecondaryHref || "",
      published: slide.published,
      order: slide.order,
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
      editingId ? `/api/admin/hero-slides/${editingId}` : "/api/admin/hero-slides",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    if (res.ok) {
      const slide = await res.json();
      if (editingId) {
        setSlides(slides.map((s) => (s.id === slide.id ? { ...s, ...slide } : s)));
      } else {
        setSlides([slide, ...slides]);
        setTotal((t) => t + 1);
      }
      handleCancelForm();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce slide ?")) return;
    await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
    setSlides(slides.filter((s) => s.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  async function togglePublished(slide: HeroSlide) {
    const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !slide.published }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSlides(slides.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-serif text-3xl">Slides Hero</h1>
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
          <Plus size={16} /> Nouveau slide
        </button>
      </div>
      <p className="text-sm text-muted mb-8">
        Le slider de la page d&apos;accueil affiche les {Math.min(publishedCount, 4)}/{4} premiers slides publiés, triés par ordre.
        {publishedCount > 4 && " Seuls les 4 premiers (par ordre) seront visibles sur le site."}
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-in bg-white p-6 rounded-xl border border-border mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-xl">{editingId ? "Modifier le slide" : "Nouveau slide"}</h2>
            <button type="button" onClick={handleCancelForm} className="p-1.5 text-muted hover:text-foreground hover:scale-110 transition-all" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>

          <ImageUploadField
            label="Image du slide"
            value={form.image}
            onChange={(image) => setForm({ ...form, image })}
            hint="Format large recommandé (paysage), max 5 Mo"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Sous-titre (ex: Queen of Excellence)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Bouton principal — texte" value={form.ctaPrimaryLabel} onChange={(e) => setForm({ ...form, ctaPrimaryLabel: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input placeholder="Bouton principal — lien (ex: /vote)" value={form.ctaPrimaryHref} onChange={(e) => setForm({ ...form, ctaPrimaryHref: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input placeholder="Bouton secondaire — texte" value={form.ctaSecondaryLabel} onChange={(e) => setForm({ ...form, ctaSecondaryLabel: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
            <input placeholder="Bouton secondaire — lien (ex: /events)" value={form.ctaSecondaryHref} onChange={(e) => setForm({ ...form, ctaSecondaryHref: e.target.value })} className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Ordre d&apos;affichage</span>
              <input
                type="number"
                value={form.order}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setForm({ ...form, order: 0 });
                    return;
                  }
                  const parsed = parseInt(raw, 10);
                  if (!Number.isNaN(parsed)) setForm({ ...form, order: parsed });
                }}
                className="w-20 px-3 py-1.5 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Publié
            </label>
          </div>

          <button type="submit" className="px-6 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
            {editingId ? "Enregistrer" : "Créer"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            style={{ animationDelay: `${i * 40}ms` }}
            className="animate-fade-in bg-white p-4 rounded-xl border border-border hover:border-gold/30 flex items-center gap-4 transition-colors duration-300"
          >
            <GripVertical size={16} className="text-muted shrink-0" />
            <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-champagne shrink-0">
              {slide.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{slide.title}</p>
              <p className="text-sm text-muted truncate">{slide.subtitle}</p>
            </div>
            <span className="text-xs text-muted shrink-0">Ordre: {slide.order}</span>
            <button
              onClick={() => togglePublished(slide)}
              className={`shrink-0 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                slide.published ? "bg-green-100 text-green-700" : "bg-champagne text-muted"
              }`}
            >
              {slide.published ? "Publié" : "Brouillon"}
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleEdit(slide)}
                className="p-2.5 rounded-lg border border-border text-muted hover:border-gold/40 hover:bg-gold/10 hover:text-gold-dark hover:scale-105 transition-all"
                title="Modifier"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => handleDelete(slide.id)}
                className="p-2.5 rounded-lg border border-border text-muted hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
