import Link from "next/link";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { SocialLinksBar } from "@/components/layout/SocialLinks";
import { getSocialLinks } from "@/lib/social";
import { getSiteContent } from "@/lib/data";

const exploreLinks = [
  { href: "/candidats", label: "Candidats" },
  { href: "/vote", label: "Voter" },
  { href: "/billetterie", label: "Billetterie" },
  { href: "/events", label: "Événements" },
  { href: "/galerie", label: "Galerie" },
];

const aboutLinks = [
  { href: "/a-propos", label: "À propos" },
  { href: "/chiffres", label: "Chiffres clés" },
  { href: "/projets", label: "Projets" },
  { href: "/impact", label: "Impact" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-[11px] font-medium tracking-[0.2em] uppercase text-gold/80 mb-5">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white transition-colors duration-200 no-underline"
            >
              <span>{link.label}</span>
              <ArrowUpRight
                size={12}
                className="opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-60 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  let socialLinks = {
    youtube: "",
    facebook: "",
    tiktok: "",
    instagram: "",
    whatsapp: "",
  };

  try {
    socialLinks = await getSocialLinks();
  } catch {
    // footer statique si DB indisponible
  }

  const contact = (await getSiteContent("contact").catch(() => null)) as {
    email?: string;
    phone?: string;
    address?: string;
  } | null;

  return (
    <footer className="relative mt-auto bg-[#080808] text-white/70 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(244,208,63,0.15),transparent)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none section-pattern" />

      <div className="relative border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Marque */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block group no-underline">
                <SiteLogo
                  variant="footer"
                  textClassName="text-white"
                  className="group-hover:opacity-90 transition-opacity"
                />
              </Link>
              <div className="w-10 h-px gold-gradient mt-4 mb-5" />
              <p className="text-sm leading-relaxed text-white/45 max-w-xs">
                La plateforme événementielle qui célèbre l&apos;excellence
                féminine à travers des concours prestigieux en Afrique et dans
                le monde.
              </p>
              <div className="mt-6">
                <SocialLinksBar links={socialLinks} variant="footer" />
              </div>
            </div>

            {/* Liens */}
            <div className="lg:col-span-2 lg:col-start-6">
              <FooterColumn title="Explorer" links={exploreLinks} />
            </div>

            <div className="lg:col-span-2">
              <FooterColumn title="Découvrir" links={aboutLinks} />
            </div>

            {/* Contact */}
            <div className="lg:col-span-3">
              <h4 className="text-[11px] font-medium tracking-[0.2em] uppercase text-gold/80 mb-5">
                Contact
              </h4>
              <ul className="space-y-4">
                {contact?.email && (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-start gap-3 text-sm text-white/55 hover:text-white transition-colors group no-underline"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] transition-all duration-300 group-hover:border-gold/30 group-hover:bg-gold/10 group-hover:scale-110">
                        <Mail size={14} className="text-gold/70" />
                      </span>
                      <span className="pt-1">{contact.email}</span>
                    </a>
                  </li>
                )}
                {contact?.phone && (
                  <li>
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="flex items-start gap-3 text-sm text-white/55 hover:text-white transition-colors group no-underline"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] transition-all duration-300 group-hover:border-gold/30 group-hover:bg-gold/10 group-hover:scale-110">
                        <Phone size={14} className="text-gold/70" />
                      </span>
                      <span className="pt-1">{contact.phone}</span>
                    </a>
                  </li>
                )}
                {contact?.address && (
                  <li className="flex items-start gap-3 text-sm text-white/45">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08]">
                      <MapPin size={14} className="text-gold/70" />
                    </span>
                    <span className="pt-1">{contact.address}</span>
                  </li>
                )}
              </ul>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 mt-6 text-xs font-medium tracking-wide uppercase text-gold hover:text-gold-light transition-colors no-underline"
              >
                Écrire un message
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-white/30 tracking-wide">
            <p>&copy; {new Date().getFullYear()} Queen of Excellence</p>
            <p className="text-gold/40 tracking-[0.25em] uppercase text-[10px]">
              Intelligence · Culture · Innovation
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
