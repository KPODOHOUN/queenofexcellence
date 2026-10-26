import { PageHero } from "@/components/ui/PageHero";
import { cn } from "@/lib/utils";

interface FormPageShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Conservé pour compatibilité. */
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormPageShell({ eyebrow, title, description, children, className }: FormPageShellProps) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <section className={cn("pb-16 bg-background", className)}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">{children}</div>
      </section>
    </>
  );
}
