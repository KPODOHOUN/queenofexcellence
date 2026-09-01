"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Pagination } from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";

export type CrudField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "image" | "number" | "url" | "boolean";
  colSpan?: 1 | 2;
};

interface AdminCrudPageProps {
  title: string;
  apiPath: string;
  fields: CrudField[];
  itemTitleKey?: string;
  itemDescKey?: string;
}

export function AdminCrudPage({
  title,
  apiPath,
  fields,
  itemTitleKey = "title",
  itemDescKey = "description",
}: AdminCrudPageProps) {
  const [items, setItems] = useState<Array<Record<string, string>>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${apiPath}?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [apiPath, page]);

  function handleEdit(item: Record<string, string>) {
    setEditingId(item.id);
    const prefilled: Record<string, string> = {};
    for (const field of fields) {
      const raw: unknown = item[field.key];
      prefilled[field.key] =
        field.type === "boolean" ? String(raw !== false) : raw != null ? String(raw) : "";
    }
    setForm(prefilled);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, string | boolean> = { ...form };
    for (const field of fields) {
      if (field.type === "boolean") {
        payload[field.key] = form[field.key] !== "false";
      }
    }
    const res = await fetch(editingId ? `${apiPath}/${editingId}` : apiPath, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const item = await res.json();
      if (editingId) {
        setItems(items.map((i) => (i.id === item.id ? { ...i, ...item } : i)));
      } else {
        setItems([item, ...items]);
        setTotal((t) => t + 1);
      }
      handleCancelForm();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ?")) return;
    await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  function renderField(field: CrudField) {
    const colClass = field.colSpan === 2 ? "md:col-span-2" : "";

    if (field.type === "textarea") {
      return (
        <textarea
          key={field.key}
          placeholder={field.label}
          value={form[field.key] || ""}
          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
          rows={3}
          className={cn(colClass, "px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all")}
        />
      );
    }

    if (field.type === "boolean") {
      return (
        <label key={field.key} className={cn(colClass, "flex items-center gap-2 text-sm")}>
          <input
            type="checkbox"
            checked={form[field.key] !== "false"}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.checked ? "true" : "false" })}
          />
          {field.label}
        </label>
      );
    }

    if (field.type === "image") {
      return (
        <ImageUploadField
          key={field.key}
          label={field.label}
          value={form[field.key] || ""}
          onChange={(url) => setForm({ ...form, [field.key]: url })}
          className={colClass}
        />
      );
    }

    return (
      <input
        key={field.key}
        type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
        placeholder={field.label}
        value={form[field.key] || ""}
        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
        className={cn(colClass, "px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all")}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">{title}</h1>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              handleCancelForm();
            } else {
              setEditingId(null);
              setForm({});
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white gold-gradient rounded-lg shadow-sm shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl border border-border mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in"
        >
          <div className="md:col-span-2 flex justify-between items-center -mb-1">
            <h2 className="font-serif text-xl">{editingId ? "Modifier" : "Nouvel élément"}</h2>
            <button type="button" onClick={handleCancelForm} className="p-1.5 text-muted hover:text-foreground hover:scale-110 transition-all" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          {fields.map((field) => renderField(field))}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white gold-gradient rounded-lg shadow-sm shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              <Plus size={16} /> {editingId ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      )}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={item.id}
            style={{ animationDelay: `${i * 40}ms` }}
            className="animate-fade-in bg-white p-4 rounded-xl border border-border hover:border-gold/30 flex justify-between items-start gap-4 transition-colors duration-300"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {item[itemTitleKey] || item.question || item.name}
              </p>
              <p className="text-sm text-muted mt-1 line-clamp-2">
                {item[itemDescKey] || item.answer}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleEdit(item)}
                className="p-1.5 text-muted hover:text-gold-dark hover:scale-110 transition-all"
                title="Modifier"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-muted hover:text-red-600 hover:scale-110 transition-all"
                title="Supprimer"
              >
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
