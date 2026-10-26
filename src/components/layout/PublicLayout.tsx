import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
  /** Conservés pour compatibilité : l'en-tête est désormais toujours opaque. */
  transparentHeader?: boolean;
  floatingHeader?: boolean;
  noHeaderOffset?: boolean;
}

export async function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </>
  );
}
