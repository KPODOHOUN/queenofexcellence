import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

/** En-tête éditorial des pages intérieures. */
export function PageHero({ eyebrow, title, description, className, children }: PageHeroProps) {
  return (
    <section className={cn("bg-background", className)}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-6 pb-6 lg:pt-14 lg:pb-10">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[28px] lg:text-4xl leading-tight text-foreground max-w-3xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-[15px] leading-6 text-muted max-w-2xl">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
