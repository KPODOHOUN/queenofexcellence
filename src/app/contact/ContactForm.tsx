"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center animate-[gold-glow_2s_ease-in-out_infinite]">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h2 className="font-serif text-2xl mb-2">Message envoyé !</h2>
        <p className="text-muted">Nous vous répondrons dans les plus brefs délais.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in [animation-delay:100ms] [animation-fill-mode:backwards]">
      <input
        type="text"
        placeholder="Votre nom"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        className="w-full px-4 py-3 border border-border rounded-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
        className="w-full px-4 py-3 border border-border rounded-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      <input
        type="tel"
        placeholder="Téléphone (optionnel)"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full px-4 py-3 border border-border rounded-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      <input
        type="text"
        placeholder="Sujet (optionnel)"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        className="w-full px-4 py-3 border border-border rounded-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      <div>
        <textarea
          placeholder="Votre message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          minLength={10}
          rows={5}
          className="w-full px-4 py-3 border border-border rounded-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
        />
        <p className="mt-1.5 text-xs text-muted text-right">
          {form.message.length < 10
            ? `${10 - form.message.length} caractère${10 - form.message.length > 1 ? "s" : ""} minimum`
            : `${form.message.length} caractères`}
        </p>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Envoi..." : "Envoyer le message"}
      </Button>
    </form>
  );
}
