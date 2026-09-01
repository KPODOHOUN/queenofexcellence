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
          "inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100",
          {
            "text-white gold-gradient hover:opacity-90 shadow-sm hover:shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5": variant === "primary",
            "bg-champagne text-foreground hover:bg-gold-light/30 hover:-translate-y-0.5": variant === "secondary",
            "border border-gold text-gold hover:bg-gold/5 hover:-translate-y-0.5": variant === "outline",
            "text-foreground/70 hover:text-gold hover:bg-champagne": variant === "ghost",
            "px-4 py-2 text-sm": size === "sm",
            "px-6 py-2.5 text-sm": size === "md",
            "px-8 py-3 text-base": size === "lg",
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
