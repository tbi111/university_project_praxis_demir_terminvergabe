import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sitzungPatientId } from "@/lib/sitzung";
import { formatTag, formatUhrzeit } from "@/lib/zeit";
import { Schrittleiste } from "@/components/schrittleiste";
import { Karte, Laden, Seitentitel, knopfHaupt, knopfNeben } from "@/components/ui";
import { buchenAktion } from "../aktionen";
import { Countdown } from "../countdown";

export default function BestaetigenSeite({ searchParams }: PageProps<"/buchen/bestaetigen">) {
  return (
    <main>
      <Schrittleiste aktiv={4} />
      <Suspense fallback={<Laden />}>
        <Inhalt suche={searchParams as Promise<{ r?: string }>} />
      </Suspense>
    </main>
  );
}

async function Inhalt({ suche }: { suche: Promise<{ r?: string }> }) {
  const patientId = await sitzungPatientId();
  if (!patientId) redirect("/buchen");
  const { r } = await suche;
  const reservierung = r
    ? await prisma.reservierung.findUnique({ where: { id: r }, include: { arzt: true, terminart: true } })
    : null;
  if (!reservierung || reservierung.patientId !== patientId) redirect("/buchen/termin?fehler=nicht_gefunden");

  const zurueck = `/buchen/termin?art=${reservierung.terminartId}&arzt=${reservierung.arztId}`;
  return (
    <>
      <Seitentitel titel="Termin bestätigen" unterzeile="Bitte prüfen Sie die Angaben und buchen Sie den Termin verbindlich." />
      <Karte className="max-w-lg">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-gedaempft">Terminart</dt>
          <dd className="font-medium">
            {reservierung.terminart.bezeichnung} (<span className="tabular-nums">{reservierung.terminart.dauerMinuten}</span> Min.)
          </dd>
          <dt className="text-gedaempft">Ärzt:in</dt>
          <dd className="font-medium">
            {reservierung.arzt.titel} {reservierung.arzt.name}
          </dd>
          <dt className="text-gedaempft">Datum</dt>
          <dd className="font-medium">{formatTag(reservierung.beginn)}</dd>
          <dt className="text-gedaempft">Uhrzeit</dt>
          <dd className="font-medium tabular-nums">{formatUhrzeit(reservierung.beginn)} Uhr</dd>
        </dl>
        <div className="mt-6 border-t border-linie pt-5">
          <Countdown ablaufAm={reservierung.ablaufAm.toISOString()} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={buchenAktion}>
            <input type="hidden" name="reservierung" value={reservierung.id} />
            <button className={knopfHaupt}>
              <CalendarCheck aria-hidden className="size-4" />
              Verbindlich buchen
            </button>
          </form>
          <Link href={zurueck} className={knopfNeben}>
            Andere Uhrzeit
          </Link>
        </div>
      </Karte>
    </>
  );
}
