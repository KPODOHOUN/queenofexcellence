"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import ContactForm from "@/app/contact/ContactForm";
import { SocialLinksBar } from "@/components/layout/SocialLinks";
import { Reveal } from "@/components/ui/Reveal";
import type { SocialLinks } from "@/types/social";

interface HomeContactSectionProps {
  contact: {
    email?: string;
    phone?: string;
    address?: string;
    hours?: string;
  };
  socialLinks: SocialLinks;
}

export function HomeContactSection({ contact, socialLinks }: HomeContactSectionProps) {
  return (
    <section id="contact" className="relative py-20 lg:py-28 bg-onyx overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_100%,rgba(201,164,92,0.12),transparent)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <Reveal>
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-4">Contact</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-5 leading-tight">
              Restons en contact
            </h2>
            <p className="text-white/55 mb-8 text-[15px] leading-relaxed">
              Une question, un partenariat ou une candidature ? Notre équipe vous répond rapidement.
            </p>
            <ul className="space-y-4 mb-8">
              {contact.email && (
                <li className="flex items-center gap-3 text-white/70 text-sm">
                  <Mail size={16} className="text-gold shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-gold transition-colors">{contact.email}</a>
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-3 text-white/70 text-sm">
                  <Phone size={16} className="text-gold shrink-0" />
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-gold transition-colors">{contact.phone}</a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-3 text-white/70 text-sm">
                  <MapPin size={16} className="text-gold shrink-0 mt-0.5" />
                  <span>{contact.address}</span>
                </li>
              )}
            </ul>
            <SocialLinksBar links={socialLinks} variant="footer" className="mb-8" />
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-light transition-colors group"
            >
              Page contact complète
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <div className="card-elevated gold-ring p-6 lg:p-8 bg-white rounded-3xl">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
