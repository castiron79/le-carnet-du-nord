import type { Metadata } from "next";
import "./globals.css";
import "./recipe-enhancements.css";

export const metadata: Metadata = {
  title: "Le Carnet du Nord – Recettes de la maison",
  description: "Ett privat nordiskt receptarkiv med fransk själ.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sv"><body>{children}</body></html>;
}
