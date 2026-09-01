import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
  transparentHeader?: boolean;
  noHeaderOffset?: boolean;
}

export async function PublicLayout({
  children,
  transparentHeader = false,
  noHeaderOffset = false,
}: PublicLayoutProps) {
  return (
    <>
      <Header transparent={transparentHeader} />
      <main
        className={cn(
          "flex-1",
          !noHeaderOffset && !transparentHeader && "pt-[72px] lg:pt-20"
        )}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
