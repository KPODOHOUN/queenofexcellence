import { PublicLayout } from "@/components/layout/PublicLayout";
import { SocialLinksBar } from "@/components/layout/SocialLinks";
import { getSocialLinks } from "@/lib/social";
import { getSiteContent } from "@/lib/data";
import { Mail } from "lucide-react";
import ContactForm from "./ContactForm";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [socialLinks, contact] = await Promise.all([
    getSocialLinks(),
    getSiteContent("contact"),
  ]);

  const email = (contact as { email?: string } | null)?.email;
  const hasSocialBlock = Boolean(email) || Object.values(socialLinks).some((v) => v);

  return (
    <PublicLayout>
      <section className="py-20 lg:py-24 bg-champagne animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-gold/60" />
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Contact</p>
            <span className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">Contactez-nous</h1>
        </div>
      </section>

      <section className="py-12 lg:py-16 pb-20 bg-white">
        <div className={`max-w-5xl mx-auto px-4 grid grid-cols-1 ${hasSocialBlock ? "lg:grid-cols-2 lg:gap-16" : ""}`}>
          {hasSocialBlock && (
            <div className="mb-12 lg:mb-0 flex flex-col items-center lg:items-start text-center lg:text-left lg:justify-center">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-8 bg-gold/60" />
                <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">
                  Retrouvez-nous
                </p>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground leading-tight mb-6">
                Restons connectés
              </h2>
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 text-base text-muted hover:text-gold-dark transition-colors mb-8"
                >
                  <Mail size={20} className="text-gold" />
                  {email}
                </a>
              )}
              <SocialLinksBar links={socialLinks} variant="header" size="lg" />
            </div>
          )}

          <div className="max-w-lg w-full mx-auto lg:mx-0">
            <ContactForm />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
