import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarPlus, CalendarX2, Clock, PhoneCall, UserRound } from "lucide-react";
import { eigeneTermine, ladeOnlinePatient } from "@/lib/buchung";
import { prisma } from "@/lib/prisma";
import { sitzungPatientId } from "@/lib/sitzung";
import { formatTag, formatUhrzeit } from "@/lib/zeit";
import { Patientenkopf } from "@/components/patientenkopf";
import { Karte, Laden, Meldung, Seitentitel, knopfHaupt, knopfNeben } from "@/components/ui";

type Suche = { abgesagt?: string; fehler?: string };

const FEHLER: Record<string, string> = {
  zu_spaet: "Dieser Termin beginnt in weniger als 24 Stunden. Bitte sagen Sie ihn telefonisch ab.",
  nicht_gebucht: "Dieser Termin ist bereits abgesagt.",
  nicht_gefunden: "Der Termin wurde nicht gefunden.",
};

export default function MeineTermine({ searchParams }: PageProps<"/buchen/meine-termine">) {
  return (
    <main>
      <Suspense fallback={<Laden />}>
        <Inhalt suche={searchParams as Promise<Suche>} />
      </Suspense>
    </main>
  );
}

async function Inhalt({ suche }: { suche: Promise<Suche> }) {
  const patientId = await sitzungPatientId();
  const patient = patientId ? await ladeOnlinePatient(prisma, patientId) : null;
  if (!patient) redirect("/buchen");
  await connection();
  const { abgesagt, fehler } = await suche;
  const termine = await eigeneTermine(prisma, patient.id, new Date());

  return (
    <>
      <Patientenkopf name={patient.name} aktiv="termine" />
      <Seitentitel titel="Meine Termine" unterzeile="Online absagen können Sie bis 24 Stunden vor Beginn. Verschieben geht über Absagen und neu Buchen." />
      {abgesagt && <Meldung art="hinweis">Der Termin ist abgesagt. Die Zeit ist wieder für andere frei.</Meldung>}
      {fehler && FEHLER[fehler] && <Meldung art="fehler">{FEHLER[fehler]}</Meldung>}

      {termine.length === 0 ? (
        <Karte className="flex flex-col items-center gap-3 py-12 text-center">
          <CalendarX2 aria-hidden className="size-8 text-gedaempft" />
          <p className="font-medium">Sie haben keine kommenden Termine.</p>
          <Link href="/buchen/termin" className={`${knopfHaupt} mt-2`}>
            <CalendarPlus aria-hidden className="size-4" /> Termin buchen
          </Link>
        </Karte>
      ) : (
        <ul className="flex flex-col gap-4">
          {termine.map((t) => (
            <li key={t.id}>
              <Karte className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-gedaempft">{formatTag(t.beginn)}</p>
                  <p className="font-display text-2xl font-semibold tabular-nums">{formatUhrzeit(t.beginn)} Uhr</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Clock aria-hidden className="size-3.5 text-petrol" />
                      {t.terminart.bezeichnung} · <span className="tabular-nums">{t.terminart.dauerMinuten}</span> Min.
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserRound aria-hidden className="size-3.5 text-petrol" />
                      {t.arzt.titel} {t.arzt.name}
                    </span>
                  </p>
                </div>
                {t.absagbar ? (
                  <Link href={`/buchen/absagen/${t.id}`} className={knopfNeben}>
                    <CalendarX2 aria-hidden className="size-4" /> Absagen
                  </Link>
                ) : (
                  <p className="flex max-w-56 items-start gap-2 rounded-xl bg-hinweis-hell px-3 py-2 text-xs">
                    <PhoneCall aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                    Weniger als 24 Stunden bis zum Termin. Absage nur noch telefonisch.
                  </p>
                )}
              </Karte>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
