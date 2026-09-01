"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Vote,
  CreditCard,
  Ticket,
  Image as ImageIcon,
  FolderOpen,
  Heart,
  HelpCircle,
  Handshake,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  GalleryHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/hero-slides", label: "Slides Hero", icon: GalleryHorizontal },
  { href: "/admin/events", label: "Événements", icon: Calendar },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/votes", label: "Votes", icon: Vote },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/tickets", label: "Billetterie", icon: Ticket },
  { href: "/admin/gallery", label: "Galerie", icon: ImageIcon },
  { href: "/admin/projects", label: "Projets", icon: FolderOpen },
  { href: "/admin/impact", label: "Impact", icon: Heart },
  { href: "/admin/partners", label: "Partenaires", icon: Handshake },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/contacts", label: "Contacts", icon: Mail },
  { href: "/admin/content", label: "Contenu", icon: Settings },
];

interface AdminSidebarProps {
  userEmail: string;
  signOutAction: () => Promise<void>;
}

export function AdminSidebar({ userEmail, signOutAction }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#0c0c0c] border-b border-gold/15 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2.5 no-underline">
          <Image src="/logo.png" alt="Queen of Excellence" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="font-serif text-sm text-white">Queen of Excellence</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 text-gold rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-64 bg-[#0c0c0c] border-r border-gold/15 fixed h-full overflow-y-auto z-50 flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-white/10 hidden lg:block">
          <Link href="/admin" className="flex items-center gap-2.5 group no-underline">
            <Image
              src="/logo.png"
              alt="Queen of Excellence"
              width={36}
              height={36}
              className="h-9 w-9 object-contain shrink-0 group-hover:scale-105 transition-transform duration-300"
            />
            <div>
              <span className="font-serif text-base text-white leading-tight block">
                Queen of Excellence
              </span>
              <p className="text-xs text-white/40">Administration</p>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1 flex-1 mt-16 lg:mt-0">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 no-underline",
                  active
                    ? "text-gold bg-gold/10"
                    : "text-white/60 hover:text-gold-light hover:bg-white/5 hover:translate-x-0.5"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gold rounded-full" />
                )}
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-gold-light rounded-lg transition-colors no-underline"
          >
            <ExternalLink size={16} />
            Voir le site
          </Link>
          <p className="text-xs text-white/40 px-3 truncate">{userEmail}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 px-3 text-sm text-white/50 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
