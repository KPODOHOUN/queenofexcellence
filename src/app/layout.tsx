import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Queen of Excellence — Reine de l'Excellence",
    template: "%s | Queen of Excellence",
  },
  description:
    "Plateforme événementielle premium dédiée aux concours et à la célébration de l'excellence féminine en Afrique.",
  openGraph: {
    title: "Queen of Excellence",
    description: "Célébrez l'excellence féminine",
    images: ["/logo.png"],
    locale: "fr_FR",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased bg-background">
        {children}
      </body>
    </html>
  );
}
