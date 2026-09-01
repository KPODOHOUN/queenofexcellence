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
  header: "h-10 w-10 lg:h-[46px] lg:w-[46px]",
  footer: "h-20 w-20",
  admin: "h-13 w-13",
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
            variant === "footer" ? "text-[1.35rem] tracking-tight" : "text-lg lg:text-xl",
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
