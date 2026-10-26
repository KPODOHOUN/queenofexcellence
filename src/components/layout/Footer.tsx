import Link from "next/link";
import { SocialLinksBar } from "@/components/layout/SocialLinks";
import { getSocialLinks } from "@/lib/social";
import { getSiteContent } from "@/lib/data";

const navigationLinks = [
  { href: "/", label: "Accueil" },
  { href: "/candidats", label: "Candidates" },
  { href: "/vote", label: "Voter" },
  { href: "/events", label: "Événements" },
  { href: "/billetterie", label: "Billetterie" },
];

const institutionLinks = [
  { href: "/a-propos", label: "À propos" },
  { href: "/impact", label: "Impact" },
  { href: "/actualites", label: "Actualités" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold text-gold">{title}</span>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm text-white/70 hover:text-white no-underline transition-colors">
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export async function Footer() {
  let socialLinks = { youtube: "", facebook: "", tiktok: "", instagram: "", whatsapp: "" };
  try {
    socialLinks = await getSocialLinks();
  } catch {
    // pied de page statique si la base est indisponible
  }

  const contact = (await getSiteContent("contact").catch(() => null)) as {
    email?: string;
    phone?: string;
    address?: string;
  } | null;

  return (
    <footer className="mt-auto bg-onyx text-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 pb-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4 flex flex-col gap-3">
          <span className="text-lg font-semibold">Queen of Excellence</span>
          <p className="text-[13px] leading-5 text-white/70 max-w-xs">
            La plateforme qui célèbre l&apos;excellence féminine à travers des concours en Afrique et dans le monde.
          </p>
          <div className="mt-2">
            <SocialLinksBar links={socialLinks} variant="footer" />
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <FooterColumn title="Navigation" links={navigationLinks} />
          <FooterColumn title="Institutionnel" links={institutionLinks} />
        </div>

        {(contact?.email || contact?.phone || contact?.address) && (
          <div className="lg:col-span-4 flex flex-col gap-2 text-sm text-white/70 self-start">
            {contact?.address && (
              <div className="flex items-center gap-2">
                <span>{contact.address}</span>
              </div>
            )}
            {contact?.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-white no-underline">
                <span>{contact.email}</span>
              </a>
            )}
            {contact?.phone && (
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white no-underline">
                <span>{contact.phone}</span>
              </a>
            )}
          </div>
        )}

        <div className="lg:col-span-12 flex flex-col gap-2 pt-4 border-t border-white/10 text-xs text-white/45">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/faq" className="hover:underline no-underline text-white/45">FAQ</Link>
            <Link href="/contact" className="hover:underline no-underline text-white/45">Contact</Link>
          </div>
          <p>© {new Date().getFullYear()} Queen of Excellence. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
