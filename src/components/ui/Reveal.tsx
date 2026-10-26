"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
  blur?: boolean;
}

type RevealState = "static" | "hidden" | "shown";

/**
 * Apparition au défilement. Le contenu est visible par défaut (rendu serveur,
 * JS lent ou désactivé) : seuls les blocs encore sous la ligne de flottaison
 * au montage sont masqués puis animés à leur entrée dans l'écran.
 */
export function Reveal({ children, className, delay = 0, as = "div", blur = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("static");

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Comp = as;

  return (
    <Comp
      ref={ref as never}
      style={state === "shown" ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        state !== "static" &&
          "transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]",
        state === "hidden" && cn("opacity-0 translate-y-10", blur && "blur-sm"),
        className
      )}
    >
      {children}
    </Comp>
  );
}
