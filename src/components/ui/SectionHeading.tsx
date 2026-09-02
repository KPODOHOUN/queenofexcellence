import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal blur className={cn("mb-14", align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-xl", className)}>
      {eyebrow && (
        <div
          className={cn(
            "flex items-center gap-3 mb-4",
            align === "center" && "justify-center"
          )}
        >
          <span className="h-px w-8 bg-gold/60" />
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">
            {eyebrow}
          </p>
          <span className="h-px w-8 bg-gold/60" />
        </div>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-foreground leading-tight tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-muted leading-relaxed text-[15px]">{description}</p>
      )}
    </Reveal>
  );
}
