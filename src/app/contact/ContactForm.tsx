"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormInput, FormTextarea } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Tag,
  Send,
  Sparkles,
} from "lucide-react";

const SUBJECT_PRESETS = [
  "Partenariat",
  "Candidature",
  "Presse & médias",
  "Billetterie",
  "Autre",
];

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
      <div className="text-center py-16 px-6 animate-fade-in-blur">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full gold-gradient flex items-center justify-center shadow-lg shadow-gold/30">
          <Sparkles size={32} className="text-foreground" />
        </div>
        <h2 className="font-serif text-3xl text-foreground mb-3">Message envoyé !</h2>
        <p className="text-muted max-w-sm mx-auto leading-relaxed">
          Merci pour votre confiance. Notre équipe vous répondra dans les plus brefs délais.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-8 text-sm font-medium text-gold hover:text-gold-dark transition-colors"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-2">
        <p className="text-[13px] font-medium text-foreground/80 mb-3 tracking-wide">
          Objet de votre message
        </p>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setForm({ ...form, subject: preset })}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded-full border transition-all duration-300",
                form.subject === preset
                  ? "gold-gradient text-foreground border-transparent shadow-md shadow-gold/20"
                  : "border-border text-muted hover:border-gold/40 hover:text-foreground bg-champagne/50"
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormInput
          label="Nom complet"
          icon={<User size={18} />}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Votre nom"
          required
        />
        <FormInput
          label="Email"
          type="email"
          icon={<Mail size={18} />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="vous@exemple.com"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormInput
          label="Téléphone"
          type="tel"
          icon={<Phone size={18} />}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+229 ..."
          hint="Optionnel"
        />
        <FormInput
          label="Sujet précis"
          icon={<Tag size={18} />}
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Précisez si besoin"
        />
      </div>

      <FormTextarea
        label="Votre message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="Décrivez votre demande en détail..."
        required
        minLength={10}
        rows={6}
        hint={
          form.message.length < 10
            ? `${10 - form.message.length} caractère${10 - form.message.length > 1 ? "s" : ""} minimum`
            : `${form.message.length} caractères`
        }
      />

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full btn-shimmer gap-2"
        size="lg"
      >
        {loading ? (
          "Envoi en cours..."
        ) : (
          <>
            <Send size={16} />
            Envoyer le message
          </>
        )}
      </Button>
    </form>
  );
}
