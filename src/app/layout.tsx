import type { Metadata } from "next";
import Link from "next/link";
import { Figtree, Fraunces } from "next/font/google";
import { Stethoscope } from "lucide-react";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Praxis Demir & Kollegen · Terminvergabe",
  description: "Online-Terminbuchung für die Gemeinschaftspraxis Demir & Kollegen",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${figtree.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-linie bg-karte/70">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-petrol-dunkel">
              <Stethoscope aria-hidden className="size-5" />
              Praxis Demir &amp; Kollegen
            </Link>
            <Link href="/buchen" className="text-sm font-medium text-petrol hover:text-petrol-dunkel">
              Termin buchen
            </Link>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10">{children}</div>
        <footer className="border-t border-linie py-6 text-center text-xs text-gedaempft">
          Gemeinschaftspraxis Dr. Demir, Dr. Schäfer, Dr. Yilmaz · Akute Beschwerden bitte telefonisch melden
        </footer>
      </body>
    </html>
  );
}
