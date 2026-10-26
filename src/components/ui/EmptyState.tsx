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
      <h3 className="font-serif text-xl text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="btn-gold mt-7 no-underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
