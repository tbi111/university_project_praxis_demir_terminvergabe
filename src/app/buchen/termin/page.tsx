import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarX2, ChevronLeft, ChevronRight, Clock, UserRound } from "lucide-react";
import { aerzteFuerTerminart, BUCHBAR_TAGE_IM_VORAUS, freieSlots, ladeOnlinePatient, onlineTerminarten } from "@/lib/buchung";
import { prisma } from "@/lib/prisma";
import { sitzungPatientId } from "@/lib/sitzung";
import { berlinTag, berlinZeitpunkt, formatTag, formatUhrzeit, istGueltigerTag, tagPlus, wochentag } from "@/lib/zeit";
import { Schrittleiste } from "@/components/schrittleiste";
import { Karte, Laden, Meldung, Seitentitel, knopfNeben } from "@/components/ui";
import { abmelden, reservierenAktion } from "../aktionen";

type Suche = { art?: string; arzt?: string; ab?: string; fehler?: string };

const FEHLERTEXT: Record<string, string> = {
  belegt: "Diese Uhrzeit ist gerade vergeben worden. Bitte wählen Sie eine andere.",
  abgelaufen: "Ihre Reservierung ist abgelaufen. Bitte wählen Sie die Uhrzeit neu.",
  nicht_gefunden: "Die Reservierung wurde nicht gefunden. Bitte wählen Sie die Uhrzeit neu.",
  nicht_buchbar: "Diese Terminart ist online nicht buchbar.",
};

export default function TerminSeite({ searchParams }: PageProps<"/buchen/termin">) {
  return (
    <main>
      <Suspense fallback={<Laden />}>
        <Inhalt suche={searchParams as Promise<Suche>} />
      </Suspense>
    </main>
  );
}

function link(suche: Suche) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(suche)) if (v) p.set(k, v);
  return `/buchen/termin?${p.toString()}`;
}

async function Inhalt({ suche }: { suche: Promise<Suche> }) {
  const patientId = await sitzungPatientId();
  const patient = patientId ? await ladeOnlinePatient(prisma, patientId) : null;
  if (!patient) redirect("/buchen");

  const { art, arzt, ab, fehler } = await suche;
  const arten = await onlineTerminarten(prisma);
  const gewaehlteArt = arten.find((a) => String(a.id) === art);
  const aerzte = gewaehlteArt ? await aerzteFuerTerminart(prisma, gewaehlteArt.id, patient.hausarztId) : [];
  const gewaehlterArzt = aerzte.find((a) => String(a.id) === arzt);

  return (
    <>
      <Schrittleiste aktiv={gewaehlterArzt ? 3 : 2} />
      <div className="mb-2 flex items-center justify-between text-sm text-gedaempft">
        <span>Angemeldet als {patient.name}</span>
        <form action={abmelden}>
          <button className="underline underline-offset-4 hover:text-petrol">Abmelden</button>
        </form>
      </div>
      <Seitentitel titel="Termin auswählen" unterzeile="Online buchbar sind Vorsorge, Beratung und Impfung." />
      {fehler && FEHLERTEXT[fehler] && <Meldung art="fehler">{FEHLERTEXT[fehler]}</Meldung>}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gedaempft">Terminart</h2>
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        {arten.map((a) => {
          const aktiv = a.id === gewaehlteArt?.id;
          return (
            <Link
              key={a.id}
              href={link({ art: String(a.id) })}
              aria-current={aktiv ? "true" : undefined}
              className={`rounded-karte border p-5 transition ${aktiv ? "border-petrol bg-petrol-hell" : "border-linie bg-karte hover:border-petrol"}`}
            >
              <span className="block font-display text-lg font-semibold">{a.bezeichnung}</span>
              <span className="mt-1 flex items-center gap-1.5 text-sm text-gedaempft">
                <Clock aria-hidden className="size-3.5" />
                <span className="tabular-nums">{a.dauerMinuten}</span> Minuten
              </span>
            </Link>
          );
        })}
      </div>

      {gewaehlteArt && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gedaempft">Ärzt:in</h2>
          <div className="mb-10 grid gap-3 sm:grid-cols-3">
            {aerzte.map((a) => {
              const aktiv = a.id === gewaehlterArzt?.id;
              return (
                <Link
                  key={a.id}
                  href={link({ art: String(gewaehlteArt.id), arzt: String(a.id) })}
                  aria-current={aktiv ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-karte border p-4 transition ${aktiv ? "border-petrol bg-petrol-hell" : "border-linie bg-karte hover:border-petrol"}`}
                >
                  <UserRound aria-hidden className="size-5 text-petrol" />
                  <span>
                    <span className="block font-medium">
                      {a.titel} {a.name}
                    </span>
                    {a.id === patient.hausarztId && <span className="text-xs text-gedaempft">Ihre Hausärzt:in</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {gewaehlteArt && gewaehlterArzt && (
        <Uhrzeiten artId={gewaehlteArt.id} arztId={gewaehlterArzt.id} ab={ab} patientId={patient.id} />
      )}
    </>
  );
}

async function Uhrzeiten({ artId, arztId, ab, patientId }: { artId: number; arztId: number; ab?: string; patientId: number }) {
  await connection();
  const jetzt = new Date();
  const heute = berlinTag(jetzt);
  const start = ab && istGueltigerTag(ab) && ab >= heute ? ab : heute;
  const tage = await freieSlots(prisma, { arztId, terminartId: artId, abTag: start, tage: 7, jetzt, patientId });
  const werktage = (tage ?? []).filter((t) => wochentag(t.tag) <= 5);
  const zurueck = tagPlus(start, -7) >= heute ? tagPlus(start, -7) : start > heute ? heute : null;
  const weiter = tagPlus(start, 7) < tagPlus(heute, BUCHBAR_TAGE_IM_VORAUS) ? tagPlus(start, 7) : null;
  const basis = { art: String(artId), arzt: String(arztId) };
  const keineZeiten = werktage.every((t) => t.slots.length === 0);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gedaempft">Uhrzeit</h2>
        <div className="flex gap-2">
          {zurueck && (
            <Link href={link({ ...basis, ab: zurueck })} className={knopfNeben}>
              <ChevronLeft aria-hidden className="size-4" /> Früher
            </Link>
          )}
          {weiter && (
            <Link href={link({ ...basis, ab: weiter })} className={knopfNeben}>
              Später <ChevronRight aria-hidden className="size-4" />
            </Link>
          )}
        </div>
      </div>

      {keineZeiten ? (
        <Karte className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarX2 aria-hidden className="size-8 text-gedaempft" />
          <p className="font-medium">Keine freien Termine in diesem Zeitraum</p>
          <p className="text-sm text-gedaempft">Schauen Sie in der nächsten Woche oder wählen Sie eine andere Ärzt:in.</p>
        </Karte>
      ) : (
        <div className="flex flex-col gap-4">
          {werktage.map((t) => (
            <Karte key={t.tag} className="p-5">
              <h3 className="mb-3 font-medium">{formatTag(berlinZeitpunkt(t.tag, "12:00"))}</h3>
              {t.slots.length === 0 ? (
                <p className="text-sm text-gedaempft">An diesem Tag ist nichts mehr frei.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {t.slots.map((s) => (
                    <form key={s.toISOString()} action={reservierenAktion}>
                      <input type="hidden" name="art" value={artId} />
                      <input type="hidden" name="arzt" value={arztId} />
                      <input type="hidden" name="beginn" value={s.toISOString()} />
                      <input type="hidden" name="ab" value={start} />
                      <button className="rounded-lg border border-linie bg-white px-3 py-1.5 text-sm font-medium tabular-nums transition hover:border-petrol hover:bg-petrol-hell">
                        {formatUhrzeit(s)}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </Karte>
          ))}
        </div>
      )}
    </section>
  );
}
