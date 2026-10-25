import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
  transparentHeader?: boolean;
  floatingHeader?: boolean;
  noHeaderOffset?: boolean;
}

export async function PublicLayout({
  children,
  transparentHeader = false,
  floatingHeader = false,
  noHeaderOffset = false,
}: PublicLayoutProps) {
  return (
    <>
      <Header transparent={transparentHeader} floating={floatingHeader} />
      <main
        className={cn(
          "flex-1",
          !noHeaderOffset && !transparentHeader && "pt-[60px] lg:pt-[68px]",
          floatingHeader && "pt-0"
        )}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
