import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

interface FormPageShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormPageShell({
  eyebrow,
  title,
  description,
  dark = false,
  children,
  className,
}: FormPageShellProps) {
  return (
    <>
      <section
        className={cn(
          "relative py-20 lg:py-28 overflow-hidden",
          dark ? "bg-[#0a0a0a]" : "bg-champagne"
        )}
      >
        {!dark && <div className="absolute inset-0 section-pattern opacity-50 pointer-events-none" />}
        {dark && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,208,63,0.18),transparent)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          </>
        )}
        <Reveal
          blur
          className={cn(
            "relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center",
            dark && "text-white"
          )}
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className={cn("h-px w-8", dark ? "bg-gold/50" : "bg-gold/60")} />
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">{eyebrow}</p>
            <span className={cn("h-px w-8", dark ? "bg-gold/50" : "bg-gold/60")} />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className={cn("mt-5 text-[15px] leading-relaxed max-w-xl mx-auto", dark ? "text-white/60" : "text-muted")}>
              {description}
            </p>
          )}
        </Reveal>
      </section>

      <section className={cn("py-12 lg:py-20 pb-24 bg-white", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </section>
    </>
  );
}
