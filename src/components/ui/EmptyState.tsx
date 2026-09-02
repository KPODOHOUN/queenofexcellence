import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ title, description, className, action }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16 px-4", className)}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-champagne border border-gold/15 flex items-center justify-center animate-float">
        <span className="text-2xl text-gold">✦</span>
      </div>
      <h3 className="font-serif text-xl text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 text-sm font-medium gold-gradient text-foreground rounded-full shadow-md shadow-gold/20 hover:opacity-90 transition-opacity no-underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
