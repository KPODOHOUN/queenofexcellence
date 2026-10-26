import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  dark?: boolean;
  /** Lien « Voir tout » aligné à droite. */
  action?: { label: string; href: string };
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  dark = false,
  action,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-4 lg:mb-6 flex items-end justify-between gap-4",
        align === "center" && "flex-col items-center text-center",
        className
      )}
    >
      <div className={cn(align === "center" && "max-w-2xl")}>
        {eyebrow && <div className={cn("eyebrow", dark && "!text-gold")}>{eyebrow}</div>}
        <h2
          className={cn(
            "text-2xl lg:text-[28px] leading-tight",
            dark ? "text-white" : "text-foreground"
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-1 text-[15px] leading-6", dark ? "text-white/70" : "text-muted")}>{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href} className="link-lux shrink-0 no-underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}
