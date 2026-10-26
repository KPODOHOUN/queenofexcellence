export type NavItem = { href: string; label: string };

/** Menu latéral (mobile). */
export const drawerNav: NavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/events", label: "Événements" },
  { href: "/candidats", label: "Candidates" },
  { href: "/vote", label: "Voter" },
  { href: "/billetterie", label: "Billetterie" },
  { href: "/galerie", label: "Galerie" },
  { href: "/actualites", label: "Actualités" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

/** Liens visibles dans l'en-tête sur grand écran. */
export const desktopNav: NavItem[] = [
  { href: "/events", label: "Événements" },
  { href: "/candidats", label: "Candidates" },
  { href: "/galerie", label: "Galerie" },
  { href: "/actualites", label: "Actualités" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
