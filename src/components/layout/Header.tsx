"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { desktopNav, drawerNav, isNavActive } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Conservés pour compatibilité avec PublicLayout. */
  transparent?: boolean;
  floating?: boolean;
}

export function Header(_props: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Ferme le menu à chaque navigation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 glass-light shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto h-16 px-5 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu"
              className="w-11 h-11 -ml-2 flex items-center justify-center text-foreground hover:text-gold-dark transition-colors lg:hidden"
            >
              <Menu size={24} />
            </button>
            <Link href="/" className="no-underline">
              <SiteLogo variant="header" showText />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-7">
            {desktopNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium no-underline transition-colors",
                  isNavActive(pathname, link.href) ? "text-gold-dark" : "text-foreground/70 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/billetterie" className="hidden lg:inline-flex btn-soft !min-h-10 !px-4 no-underline">
              Billetterie
            </Link>
            <Link href="/vote" className="btn-gold !min-h-10 !px-5 no-underline">
              Voter
            </Link>
          </div>
        </div>
      </header>

      {/* Menu latéral */}
      <div className={cn("fixed inset-0 z-[60] lg:hidden", drawerOpen ? "visible" : "invisible")} aria-hidden={!drawerOpen}>
        <div
          className={cn(
            "absolute inset-0 bg-onyx/40 backdrop-blur-sm transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[82vw] max-w-[320px] bg-white flex flex-col shadow-[0_16px_40px_-12px_rgba(16,16,16,0.2)] transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-16 px-5 flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">Menu</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Fermer le menu"
              className="w-11 h-11 flex items-center justify-center text-foreground hover:text-gold-dark"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-2 flex flex-col">
            {drawerNav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "h-12 px-2 flex items-center rounded text-base no-underline transition-colors",
                  isNavActive(pathname, href) ? "bg-champagne-dark font-semibold text-foreground" : "text-foreground hover:bg-champagne"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
