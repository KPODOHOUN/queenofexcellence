"use client";

import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/billetterie", label: "Billetterie" },
  { href: "/galerie", label: "Galerie" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

const moreLinks = [
  { href: "/chiffres", label: "Chiffres" },
  { href: "/projets", label: "Projets" },
  { href: "/impact", label: "Impact" },
  { href: "/faq", label: "FAQ" },
];

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps) {
  void transparent;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const moreRef = useRef<HTMLDivElement>(null);

  const isMoreActive = moreLinks.some((l) => l.href === pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-shadow duration-500 animate-fade-in",
        "bg-[#0c0c0c] border-b border-gold/15",
        scrolled && "shadow-lg shadow-black/40"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] lg:h-20">
          <Link href="/" className="shrink-0 group">
            <SiteLogo
              variant="header"
              showText
              transparent
              className="group-hover:opacity-90 group-hover:scale-[1.02] transition-all duration-300"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group/link relative px-3 py-2 text-[13px] tracking-wide rounded-lg overflow-hidden no-underline",
                    active ? "text-gold" : "text-white/70 hover:text-gold-light"
                  )}
                >
                  <span className="relative z-10 transition-colors duration-300">{link.label}</span>
                  <span
                    className={cn(
                      "absolute bottom-1.5 left-3 right-3 h-px bg-gold origin-left transition-transform duration-300 ease-out",
                      active ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100"
                    )}
                  />
                </Link>
              );
            })}

            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                aria-controls="header-more-menu"
                className={cn(
                  "relative flex items-center gap-1 px-3 py-2 text-[13px] tracking-wide transition-colors duration-300 rounded-lg",
                  isMoreActive ? "text-gold" : "text-white/70 hover:text-gold-light"
                )}
              >
                Découvrir
                <ChevronDown size={14} className={cn("transition-transform duration-300", moreOpen && "rotate-180")} />
                {isMoreActive && (
                  <span className="absolute bottom-1.5 left-3 right-3 h-px bg-gold" />
                )}
              </button>
              <div
                id="header-more-menu"
                role="menu"
                aria-label="Découvrir"
                className={cn(
                  "absolute top-full right-0 mt-2 w-48 rounded-xl border border-gold/10 bg-[#141414] shadow-xl shadow-black/40 overflow-hidden transition-all duration-200 origin-top-right",
                  moreOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                )}
              >
                {moreLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      tabIndex={moreOpen ? 0 : -1}
                      className={cn(
                        "block px-4 py-2.5 text-[13px] transition-colors no-underline",
                        active ? "text-gold bg-white/5" : "text-white/70 hover:text-gold-light hover:bg-white/5"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/vote"
              className="hidden sm:inline-flex items-center px-5 py-2.5 text-[13px] font-semibold rounded-full text-foreground gold-gradient shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 no-underline"
            >
              Voter maintenant
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-lg text-gold hover:bg-white/5 transition-colors"
              aria-label="Menu"
            >
              <span className={cn("block transition-transform duration-300", mobileOpen && "rotate-90")}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[72px] z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden relative z-50 grid transition-[grid-template-rows] duration-500 ease-in-out",
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
        <nav className="border-t border-gold/10 bg-[#0c0c0c] px-4 py-4 flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto">
          {[...navLinks, ...moreLinks].map((link, i) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{ transitionDelay: mobileOpen ? `${i * 30}ms` : "0ms" }}
                className={cn(
                  "px-4 py-3.5 text-sm rounded-xl transition-all duration-300 no-underline",
                  mobileOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2",
                  active ? "text-gold bg-white/5" : "text-white/75 hover:text-gold-light hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/vote"
            className="mt-3 mx-2 text-center px-5 py-3.5 text-sm font-semibold rounded-full text-foreground gold-gradient transition-transform duration-300 active:scale-95 no-underline"
          >
            Voter maintenant
          </Link>
        </nav>
        </div>
      </div>
    </header>
  );
}
