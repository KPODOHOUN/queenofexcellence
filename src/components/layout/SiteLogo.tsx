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
  header: "h-9 w-9 lg:h-11 lg:w-11",
  footer: "h-16 w-16",
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
            "font-serif leading-none whitespace-nowrap transition-colors duration-300",
            variant === "footer" ? "text-xl" : "text-[19px] lg:text-xl font-semibold tracking-tight",
            transparent ? "text-white" : "text-foreground",
            textClassName
          )}
        >
          Queen of{" "}
          <span>
            Excellence
          </span>
        </span>
      )}
    </span>
  );
}
