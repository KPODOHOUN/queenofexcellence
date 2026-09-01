import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHero({ eyebrow, title, description, className, children }: PageHeroProps) {
  return (
    <section className={cn("relative py-20 lg:py-28 bg-champagne overflow-hidden", className)}>
      <div className="absolute inset-0 section-pattern opacity-60" />
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gold/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {eyebrow && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-gold/60" />
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">{eyebrow}</p>
            <span className="h-px w-8 bg-gold/60" />
          </div>
        )}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-5 text-muted text-[15px] leading-relaxed max-w-xl mx-auto">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
