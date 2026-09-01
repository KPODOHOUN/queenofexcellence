"use client";

import { useEffect, useState } from "react";
import { defaultSocialLinks, socialPlatforms, type SocialLinks } from "@/types/social";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export default function AdminContentPage() {
  const [hero, setHero] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    ctaPrimary: "",
    ctaSecondary: "",
  });
  const [about, setAbout] = useState({ title: "", content: "", mission: "", vision: "" });
  const [social, setSocial] = useState<SocialLinks>(defaultSocialLinks);
  const [contact, setContact] = useState({ email: "", phone: "", address: "" });
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/content?key=hero").then((r) => r.json()).then((d) => {
      if (d?.value) setHero(JSON.parse(d.value));
    });
    fetch("/api/admin/content?key=about").then((r) => r.json()).then((d) => {
      if (d?.value) setAbout(JSON.parse(d.value));
    });
    fetch("/api/admin/content?key=social_links").then((r) => r.json()).then((d) => {
      if (d?.value) setSocial({ ...defaultSocialLinks, ...JSON.parse(d.value) });
    });
    fetch("/api/admin/content?key=contact").then((r) => r.json()).then((d) => {
      if (d?.value) setContact(JSON.parse(d.value));
    });
  }, []);

  async function save(key: string, value: unknown) {
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Contenu du site</h1>

      <div className="space-y-8">
        <div className="animate-fade-in bg-white p-6 rounded-xl border border-border hover:border-gold/30 transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-lg">Réseaux sociaux</h2>
            {saved === "social_links" && (
              <span className="text-sm text-green-600">Enregistré !</span>
            )}
          </div>
          <p className="text-sm text-muted">
            Collez les liens complets. Les icônes n&apos;apparaissent sur le site que pour les réseaux renseignés.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.key}>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                  {platform.label}
                </label>
                <input
                  type="url"
                  placeholder={platform.placeholder}
                  value={social[platform.key]}
                  onChange={(e) =>
                    setSocial({ ...social, [platform.key]: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                />
                <p className="text-xs text-muted mt-1">{platform.hint}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => save("social_links", social)}
            className="px-6 py-2.5 text-sm text-white gold-gradient rounded-lg hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            Enregistrer les réseaux sociaux
          </button>
        </div>

        <div style={{ animationDelay: "80ms" }} className="animate-fade-in bg-white p-6 rounded-xl border border-border hover:border-gold/30 transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-lg">Section Hero (Accueil)</h2>
            {saved === "hero" && <span className="text-sm text-green-600">Enregistré !</span>}
          </div>
          <input placeholder="Titre" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <input placeholder="Sous-titre" value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <textarea placeholder="Description" value={hero.description} onChange={(e) => setHero({ ...hero, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <ImageUploadField
            label="Image de fond (Hero)"
            value={hero.image}
            onChange={(url) => setHero({ ...hero, image: url })}
            hint="JPG, PNG, WebP ou GIF — max 5 Mo"
          />
          <button onClick={() => save("hero", hero)} className="px-6 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">Enregistrer Hero</button>
        </div>

        <div style={{ animationDelay: "160ms" }} className="animate-fade-in bg-white p-6 rounded-xl border border-border hover:border-gold/30 transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-lg">Page À propos</h2>
            {saved === "about" && <span className="text-sm text-green-600">Enregistré !</span>}
          </div>
          <input placeholder="Titre" value={about.title} onChange={(e) => setAbout({ ...about, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <textarea placeholder="Contenu" value={about.content} onChange={(e) => setAbout({ ...about, content: e.target.value })} rows={4} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <textarea placeholder="Mission" value={about.mission} onChange={(e) => setAbout({ ...about, mission: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <textarea placeholder="Vision" value={about.vision} onChange={(e) => setAbout({ ...about, vision: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <button onClick={() => save("about", about)} className="px-6 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">Enregistrer À propos</button>
        </div>

        <div style={{ animationDelay: "240ms" }} className="animate-fade-in bg-white p-6 rounded-xl border border-border hover:border-gold/30 transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-lg">Coordonnées de contact</h2>
            {saved === "contact" && <span className="text-sm text-green-600">Enregistré !</span>}
          </div>
          <p className="text-sm text-muted">
            Affichées dans le footer et sur la page Contact.
          </p>
          <input type="email" placeholder="Email (ex: contact.queenofexcellence@gmail.com)" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <input placeholder="Téléphone (optionnel)" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <input placeholder="Adresse (optionnel)" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
          <button onClick={() => save("contact", contact)} className="px-6 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">Enregistrer les coordonnées</button>
        </div>
      </div>
    </div>
  );
}
