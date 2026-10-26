import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold uppercase tracking-[0.1em] rounded-[2px] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100",
          {
            "bg-onyx !text-white hover:bg-gold hover:!text-onyx": variant === "primary",
            "bg-champagne text-foreground border border-border hover:border-gold/50": variant === "secondary",
            "border border-gold/60 text-gold-dark hover:bg-gold/10 hover:border-gold": variant === "outline",
            "text-foreground/70 hover:text-gold-dark hover:bg-champagne": variant === "ghost",
            "px-4 py-2 text-xs": size === "sm",
            "px-6 py-3 text-xs": size === "md",
            "px-8 py-4 text-[0.8rem]": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
