import type { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";

export const knopfHaupt =
  "inline-flex items-center justify-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-petrol-dunkel disabled:cursor-not-allowed disabled:opacity-60";
export const knopfNeben =
  "inline-flex items-center justify-center gap-2 rounded-full border border-linie bg-karte px-4 py-2 text-sm font-medium text-tinte transition hover:border-petrol hover:text-petrol";

export function Karte({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-karte border border-linie bg-karte p-6 shadow-karte ${className}`}>{children}</section>;
}

export function Seitentitel({ titel, unterzeile }: { titel: string; unterzeile?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{titel}</h1>
      {unterzeile && <p className="mt-2 text-gedaempft">{unterzeile}</p>}
    </div>
  );
}

export function Meldung({ art, children }: { art: "fehler" | "hinweis"; children: ReactNode }) {
  const fehler = art === "fehler";
  const Icon = fehler ? AlertCircle : Info;
  return (
    <div
      role={fehler ? "alert" : "status"}
      className={`mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${fehler ? "bg-fehler-hell text-fehler" : "bg-hinweis-hell text-tinte"}`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Laden({ text = "Wird geladen …" }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-gedaempft" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-petrol border-t-transparent" aria-hidden />
      {text}
    </div>
  );
}
