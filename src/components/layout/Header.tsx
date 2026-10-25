"use client";

import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#a-propos", label: "À propos" },
  { href: "/#evenements", label: "Événements" },
  { href: "/#galerie", label: "Galerie" },
  { href: "/#actualites", label: "Actualités" },
  { href: "/#partenaires", label: "Partenaires" },
  { href: "/#faq", label: "FAQ" },
];

const moreLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/vote", label: "Voter" },
  { href: "/billetterie", label: "Billetterie" },
  { href: "/events", label: "Tous les événements" },
  { href: "/galerie", label: "Galerie complète" },
];

interface HeaderProps {
  transparent?: boolean;
  floating?: boolean;
}

export function Header({ transparent = false, floating = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const moreRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";
  const useFloating = floating && isHome;
  const isTransparent = transparent && !scrolled && isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
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
        "z-50 transition-all duration-500",
        useFloating
          ? "fixed top-3 sm:top-4 left-3 right-3 sm:left-4 sm:right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:max-w-5xl lg:w-[calc(100%-2rem)]"
          : "fixed top-0 left-0 right-0 animate-fade-in"
      )}
    >
      <div
        className={cn(
          "transition-all duration-500",
          useFloating
            ? cn(
                "rounded-2xl border shadow-lg shadow-black/20 backdrop-blur-xl px-4 sm:px-6",
                isTransparent
                  ? "bg-black/35 border-white/10"
                  : "bg-[#0c0c0c]/92 border-gold/15"
              )
            : cn(
                "border-b",
                isTransparent
                  ? "bg-transparent border-transparent"
                  : "glass-dark border-gold/15 shadow-lg shadow-black/30"
              )
        )}
      >
        <div className="flex items-center justify-between h-[56px] lg:h-[60px]">
          <Link href="/" className="shrink-0 group">
            <SiteLogo
              variant="header"
              showText
              transparent
              className="group-hover:opacity-90 group-hover:scale-[1.02] transition-all duration-300"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group/link relative px-2.5 py-1.5 text-xs tracking-wide rounded-xl overflow-hidden no-underline text-white/70 hover:text-gold-light"
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute inset-0 scale-x-0 group-hover/link:scale-x-100 origin-left bg-white/5 rounded-xl transition-transform duration-300" />
              </Link>
            ))}

            <div className="relative ml-1" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className="flex items-center gap-1 px-3 py-2 text-[13px] tracking-wide rounded-xl text-white/70 hover:text-gold-light transition-colors"
              >
                Plus
                <ChevronDown size={14} className={cn("transition-transform duration-300", moreOpen && "rotate-180")} />
              </button>
              <div
                className={cn(
                  "absolute top-full right-0 mt-2 w-48 rounded-xl border border-gold/10 bg-[#141414] shadow-xl overflow-hidden transition-all duration-200 origin-top-right",
                  moreOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                )}
              >
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2.5 text-[13px] text-white/70 hover:text-gold-light hover:bg-white/5 no-underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/vote"
              className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-semibold rounded-full text-foreground gold-gradient btn-shimmer shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 hover:-translate-y-0.5 no-underline"
            >
              Voter
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-xl text-gold hover:bg-white/5 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden border-t border-white/10 py-3 flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto">
            {[...navLinks, ...moreLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-3 text-sm rounded-xl text-white/75 hover:text-gold-light hover:bg-white/5 no-underline"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/vote"
              className="mt-2 mx-1 text-center px-5 py-3 text-sm font-semibold rounded-full text-foreground gold-gradient no-underline"
            >
              Voter maintenant
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
