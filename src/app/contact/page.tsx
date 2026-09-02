import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SocialLinksBar } from "@/components/layout/SocialLinks";
import { Reveal } from "@/components/ui/Reveal";
import { getSocialLinks } from "@/lib/social";
import { getSiteContent } from "@/lib/data";
import { fallbackContact } from "@/lib/content-fallback";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowUpRight,
  MessageCircle,
  Handshake,
  HelpCircle,
} from "lucide-react";
import ContactForm from "./ContactForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe Queen of Excellence — partenariats, candidatures, presse.",
};

const quickLinks = [
  {
    icon: Handshake,
    title: "Devenir partenaire",
    desc: "Associez votre marque à l'excellence féminine.",
    href: "/contact",
  },
  {
    icon: MessageCircle,
    title: "Support vote & billetterie",
    desc: "Une question sur votre achat ou votre vote ?",
    href: "/faq",
  },
  {
    icon: HelpCircle,
    title: "Questions fréquentes",
    desc: "Consultez notre FAQ avant d'écrire.",
    href: "/faq",
  },
];

export default async function ContactPage() {
  const [socialLinks, contact] = await Promise.all([
    getSocialLinks(),
    getSiteContent("contact"),
  ]);

  const data = {
    email: (contact as { email?: string } | null)?.email || fallbackContact.email,
    phone: (contact as { phone?: string } | null)?.phone || fallbackContact.phone,
    address: (contact as { address?: string } | null)?.address || fallbackContact.address,
    hours: fallbackContact.hours,
  };

  const contactCards = [
    { icon: Mail, label: "Email", value: data.email, href: `mailto:${data.email}` },
    { icon: Phone, label: "Téléphone", value: data.phone, href: `tel:${data.phone.replace(/\s/g, "")}` },
    { icon: MapPin, label: "Adresse", value: data.address },
    { icon: Clock, label: "Disponibilité", value: data.hours },
  ];

  return (
    <PublicLayout>
      {/* Hero sombre premium */}
      <section className="relative pt-[72px] lg:pt-20 overflow-hidden bg-[#080808]">
        <div className="absolute inset-0 section-pattern opacity-[0.03]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[400px] rounded-full bg-gold/8 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gold/5 blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <Reveal blur>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-gold/50" />
                <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Contact</p>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08] tracking-tight mb-6">
                Parlons de votre
                <span className="block gold-gradient-text">prochain projet</span>
              </h1>
              <p className="text-white/55 text-[15px] leading-relaxed max-w-md mb-10">
                Partenariat, candidature, presse ou simple curiosité — notre équipe est à votre écoute
                pour faire vivre l&apos;excellence féminine à Parakou et au-delà.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contactCards.map((card) => (
                  <div key={card.label} className="contact-card p-5">
                    <card.icon size={20} className="text-gold mb-3" />
                    <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">{card.label}</p>
                    {card.href ? (
                      <a href={card.href} className="text-sm text-white/85 hover:text-gold transition-colors no-underline">
                        {card.value}
                      </a>
                    ) : (
                      <p className="text-sm text-white/85">{card.value}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-4">Réseaux sociaux</p>
                <SocialLinksBar links={socialLinks} variant="footer" size="lg" />
              </div>
            </Reveal>

            <Reveal delay={150} blur>
              <div className="card-elevated gold-ring p-8 lg:p-10 bg-white">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
                    <Mail size={18} className="text-foreground" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-foreground">Écrivez-nous</h2>
                    <p className="text-xs text-muted">Réponse sous 48 h ouvrées</p>
                  </div>
                </div>
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Liens rapides */}
      <section className="py-16 lg:py-20 bg-champagne relative overflow-hidden">
        <div className="absolute inset-0 section-pattern opacity-40 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium mb-3">Besoin d&apos;aide ?</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Autres moyens de nous joindre</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <Link
                  href={item.href}
                  className="group block card-elevated gold-ring p-7 h-full no-underline"
                >
                  <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center mb-5 group-hover:bg-gold/20 transition-colors">
                    <item.icon size={22} className="text-gold" />
                  </div>
                  <h3 className="font-serif text-lg text-foreground mb-2 group-hover:text-gold-dark transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed mb-4">{item.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gold">
                    En savoir plus
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
