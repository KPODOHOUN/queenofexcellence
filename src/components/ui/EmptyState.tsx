import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16 px-4", className)}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-champagne flex items-center justify-center">
        <span className="text-2xl text-gold">✦</span>
      </div>
      <h3 className="font-serif text-xl text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted text-sm max-w-md mx-auto">{description}</p>
      )}
    </div>
  );
}
