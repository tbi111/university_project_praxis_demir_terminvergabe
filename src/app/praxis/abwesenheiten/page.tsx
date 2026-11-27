import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarCheck2, ChevronRight } from "lucide-react";
import { kommendeAbwesenheiten, zeitraumText } from "@/lib/abwesenheit";
import { prisma } from "@/lib/prisma";
import { istPraxisSitzung } from "@/lib/sitzung";
import { berlinTag } from "@/lib/zeit";
import { Karte, Laden, Meldung } from "@/components/ui";
import { PraxisKopf } from "../kopf";
import { AbwesenheitFormular } from "./formular";

export default function AbwesenheitenSeite({ searchParams }: PageProps<"/praxis/abwesenheiten">) {
  return (
    <main>
      <PraxisKopf aktiv="abwesenheiten" />
      <Suspense fallback={<Laden />}>
        <Inhalt suche={searchParams as Promise<{ geloescht?: string }>} />
      </Suspense>
    </main>
  );
}

async function Inhalt({ suche }: { suche: Promise<{ geloescht?: string }> }) {
  if (!(await istPraxisSitzung())) redirect("/praxis/anmelden");
  await connection();
  const { geloescht } = await suche;
  const jetzt = new Date();
  const [liste, aerzte] = await Promise.all([
    kommendeAbwesenheiten(prisma, jetzt),
    prisma.arzt.findMany({ where: { aktiv: true }, orderBy: { id: "asc" } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <Karte>
        <h1 className="mb-1 font-display text-2xl font-semibold">Abwesenheit eintragen</h1>
        <p className="mb-6 text-sm text-gedaempft">Im Zeitraum sind keine Termine mehr buchbar. Bestehende Termine werden nicht automatisch verschoben, sie erscheinen danach als Liste.</p>
        <AbwesenheitFormular aerzte={aerzte.map((a) => ({ id: a.id, name: `${a.titel} ${a.name}` }))} heute={berlinTag(jetzt)} />
      </Karte>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gedaempft">Aktuelle und kommende Abwesenheiten</h2>
        {geloescht && <Meldung art="hinweis">Die Abwesenheit ist gelöscht. Die Zeiten sind wieder buchbar.</Meldung>}
        {liste.length === 0 ? (
          <Karte className="flex flex-col items-center gap-2 py-10 text-center">
            <CalendarCheck2 aria-hidden className="size-8 text-gedaempft" />
            <p className="font-medium">Keine Abwesenheiten eingetragen.</p>
            <p className="text-sm text-gedaempft">Alle Ärzt:innen sind laut Plan da.</p>
          </Karte>
        ) : (
          <ul className="flex flex-col gap-3">
            {liste.map((a) => (
              <li key={a.id}>
                <Link href={`/praxis/abwesenheiten/${a.id}`} className="flex items-center justify-between gap-3 rounded-karte border border-linie bg-karte p-4 shadow-karte transition hover:border-petrol">
                  <span>
                    <span className="block font-medium">
                      {a.arzt ? `${a.arzt.titel} ${a.arzt.name}` : "Ganze Praxis"} · {a.grund}
                    </span>
                    <span className="block text-sm text-gedaempft tabular-nums">{zeitraumText(a.von, a.bis)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {a.offen > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 tabular-nums">{a.offen} offen</span>
                    ) : (
                      <span className="rounded-full bg-petrol-hell px-2.5 py-0.5 text-xs font-semibold text-petrol-dunkel">erledigt</span>
                    )}
                    <ChevronRight aria-hidden className="size-4 text-gedaempft" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
