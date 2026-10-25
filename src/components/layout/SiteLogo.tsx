import Image from "next/image";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  variant?: "header" | "footer" | "admin";
  showText?: boolean;
  className?: string;
  textClassName?: string;
  transparent?: boolean;
}

const sizeMap = {
  header: "h-8 w-8 lg:h-9 lg:w-9",
  footer: "h-14 w-14",
  admin: "h-11 w-11",
};

export function SiteLogo({
  variant = "header",
  showText = true,
  className,
  textClassName,
  transparent = false,
}: SiteLogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt="Queen of Excellence"
        width={44}
        height={44}
        className={cn("shrink-0 object-contain", sizeMap[variant])}
        priority={variant === "header"}
      />
      {showText && (
        <span
          className={cn(
            "font-serif leading-tight transition-colors duration-300",
            variant === "footer" ? "text-lg tracking-tight" : "text-base lg:text-lg",
            transparent ? "text-white" : "text-foreground",
            textClassName
          )}
        >
          Queen of{" "}
          <span className={cn(transparent ? "text-gold" : "gold-gradient-text")}>
            Excellence
          </span>
        </span>
      )}
    </span>
  );
}
