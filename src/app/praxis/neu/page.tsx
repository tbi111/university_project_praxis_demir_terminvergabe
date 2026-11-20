import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarX2, ChevronLeft, ChevronRight, Clock, Search, Sparkles, UserRound } from "lucide-react";
import { aerzteFuerTerminart, freieSlots } from "@/lib/buchung";
import { naechsteFreieTermine, suchePatienten } from "@/lib/praxis";
import { prisma } from "@/lib/prisma";
import { istPraxisSitzung } from "@/lib/sitzung";
import { berlinTag, berlinZeitpunkt, formatTag, formatUhrzeit, istGueltigerTag, tagPlus } from "@/lib/zeit";
import { Karte, Laden, Meldung, knopfHaupt, knopfNeben } from "@/components/ui";
import { PraxisKopf } from "../kopf";
import { terminBuchen } from "../aktionen";
import { Anlageformular } from "./anlageformular";

type Suche = { q?: string; patient?: string; art?: string; arzt?: string; tag?: string; angelegt?: string; fehler?: string };

export default function NeuSeite({ searchParams }: PageProps<"/praxis/neu">) {
  return (
    <main>
      <PraxisKopf aktiv="neu" />
      <Suspense fallback={<Laden />}>
        <Inhalt suche={searchParams as Promise<Suche>} />
      </Suspense>
    </main>
  );
}

function link(s: Suche) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(s)) if (v) p.set(k, v);
  return `/praxis/neu?${p.toString()}`;
}

const ueberschrift = "mb-3 text-sm font-semibold uppercase tracking-wide text-gedaempft";

async function Inhalt({ suche }: { suche: Promise<Suche> }) {
  if (!(await istPraxisSitzung())) redirect("/praxis/anmelden");
  const s = await suche;
  const patient = s.patient ? await prisma.patient.findUnique({ where: { id: Number(s.patient) }, include: { hausarzt: true } }) : null;

  if (!patient) return <PatientWaehlen q={s.q} />;

  const arten = await prisma.terminart.findMany({ orderBy: { bezeichnung: "asc" } });
  const art = arten.find((a) => String(a.id) === s.art);
  const basis: Suche = { patient: String(patient.id) };

  return (
    <>
      {s.angelegt && <Meldung art="hinweis">{patient.name} ist angelegt und kann ab jetzt auch online buchen.</Meldung>}
      {s.fehler && <Meldung art="fehler">Diese Uhrzeit ist inzwischen vergeben. Bitte eine andere wählen.</Meldung>}

      <Karte className="mb-8 flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <UserRound aria-hidden className="size-5 text-petrol" />
          <div>
            <p className="font-semibold">{patient.name}</p>
            <p className="text-sm text-gedaempft tabular-nums">
              Nr. {patient.id} · geb. {patient.geburtsdatum.split("-").reverse().join(".")} · {patient.hausarzt ? `Hausärzt:in ${patient.hausarzt.titel} ${patient.hausarzt.name}` : "keine Hausärzt:in"}
              {patient.onlineGesperrt && " · online gesperrt"}
            </p>
          </div>
        </div>
        <Link href="/praxis/neu" className={knopfNeben}>
          Andere Patient:in
        </Link>
      </Karte>

      <h2 className={ueberschrift}>Terminart</h2>
      <div className="mb-10 flex flex-wrap gap-2">
        {arten.map((a) => (
          <Link
            key={a.id}
            href={link({ ...basis, art: String(a.id) })}
            aria-current={a.id === art?.id ? "true" : undefined}
            className={`rounded-full border px-4 py-2 text-sm transition ${a.id === art?.id ? "border-petrol bg-petrol text-white" : "border-linie bg-karte hover:border-petrol"}`}
          >
            {a.bezeichnung} <span className="tabular-nums opacity-70">· {a.dauerMinuten} Min.</span>
          </Link>
        ))}
      </div>

      {art && <Zeitwahl patientId={patient.id} hausarztId={patient.hausarztId} artId={art.id} artName={art.bezeichnung} arzt={s.arzt} tag={s.tag} />}
    </>
  );
}

async function PatientWaehlen({ q }: { q?: string }) {
  const treffer = q ? await suchePatienten(prisma, q) : [];
  const aerzte = (await prisma.arzt.findMany({ where: { aktiv: true }, orderBy: { name: "asc" } })).map((a) => ({ id: a.id, name: `${a.titel} ${a.name}` }));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Karte>
        <h2 className="mb-4 font-display text-xl font-semibold">Patient:in suchen</h2>
        <form action="/praxis/neu" className="mb-4 flex gap-2">
          <label htmlFor="q" className="sr-only">
            Name, Geburtsdatum oder Nummer
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Name, TT.MM.JJJJ oder Nummer"
            className="w-full rounded-xl border border-linie bg-white px-4 py-2.5 outline-none focus:border-petrol"
          />
          <button className={knopfHaupt} aria-label="Suchen">
            <Search aria-hidden className="size-4" />
          </button>
        </form>
        {q && treffer.length === 0 && <p className="text-sm text-gedaempft">Niemand gefunden. Neupatient:innen bitte rechts anlegen.</p>}
        <ul className="divide-y divide-linie">
          {treffer.map((p) => (
            <li key={p.id}>
              <Link href={link({ patient: String(p.id) })} className="flex items-center justify-between gap-3 py-3 hover:text-petrol">
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-xs text-gedaempft tabular-nums">
                    Nr. {p.id} · {p.geburtsdatum.split("-").reverse().join(".")}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </Karte>
      <Karte>
        <h2 className="mb-1 font-display text-xl font-semibold">Neupatient:in anlegen</h2>
        <p className="mb-5 text-sm text-gedaempft">Wer neu ist, kann erst nach der Anlage online buchen.</p>
        <Anlageformular aerzte={aerzte} />
      </Karte>
    </div>
  );
}

async function Zeitwahl(props: { patientId: number; hausarztId: number | null; artId: number; artName: string; arzt?: string; tag?: string }) {
  const jetzt = new Date();
  const heute = berlinTag(jetzt);
  const basis: Suche = { patient: String(props.patientId), art: String(props.artId) };
  const [vorschlaege, aerzte] = await Promise.all([
    naechsteFreieTermine(prisma, { terminartId: props.artId, hausarztId: props.hausarztId, jetzt }),
    aerzteFuerTerminart(prisma, props.artId, props.hausarztId),
  ]);
  const arzt = aerzte.find((a) => String(a.id) === props.arzt);
  const tag = props.tag && istGueltigerTag(props.tag) && props.tag >= heute ? props.tag : heute;

  const buchenKnopf = (arztId: number, beginn: Date, inhalt: React.ReactNode, klasse: string) => (
    <form action={terminBuchen} key={`${arztId}-${beginn.toISOString()}`}>
      <input type="hidden" name="patient" value={props.patientId} />
      <input type="hidden" name="art" value={props.artId} />
      <input type="hidden" name="arzt" value={arztId} />
      <input type="hidden" name="beginn" value={beginn.toISOString()} />
      <button className={klasse}>{inhalt}</button>
    </form>
  );

  return (
    <>
      <h2 className={ueberschrift}>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles aria-hidden className="size-4 text-petrol" /> Nächste freie Termine
        </span>
      </h2>
      {vorschlaege.length === 0 ? (
        <Karte className="mb-10 flex items-center gap-3 p-5 text-sm text-gedaempft">
          <CalendarX2 aria-hidden className="size-5" /> In den nächsten zwei Wochen ist für {props.artName} nichts frei.
        </Karte>
      ) : (
        <div className="mb-10 grid gap-3 sm:grid-cols-3">
          {vorschlaege.map((v) =>
            buchenKnopf(
              v.arztId,
              v.beginn,
              <>
                <span className="block text-sm text-gedaempft">{formatTag(v.beginn)}</span>
                <span className="block font-display text-2xl font-semibold tabular-nums">{formatUhrzeit(v.beginn)} Uhr</span>
                <span className="mt-1 block text-sm">
                  {v.arztName}
                  {v.istHausarzt && <span className="ml-1.5 rounded-full bg-petrol-hell px-2 py-0.5 text-xs text-petrol-dunkel">Hausärzt:in</span>}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-petrol">Direkt buchen →</span>
              </>,
              "w-full rounded-karte border border-linie bg-karte p-5 text-left shadow-karte transition hover:border-petrol hover:bg-petrol-hell",
            ),
          )}
        </div>
      )}

      <h2 className={ueberschrift}>Oder Ärzt:in und Tag selbst wählen</h2>
      <div className="mb-6 flex flex-wrap gap-2">
        {aerzte.map((a) => (
          <Link
            key={a.id}
            href={link({ ...basis, arzt: String(a.id), tag })}
            aria-current={a.id === arzt?.id ? "true" : undefined}
            className={`rounded-full border px-4 py-2 text-sm transition ${a.id === arzt?.id ? "border-petrol bg-petrol-hell" : "border-linie bg-karte hover:border-petrol"}`}
          >
            {a.titel} {a.name}
            {a.id === props.hausarztId && <span className="text-gedaempft"> · Hausärzt:in</span>}
          </Link>
        ))}
      </div>

      {arzt && (
        <TagesZeiten
          {...{ patientId: props.patientId, artId: props.artId, arztId: arzt.id, tag, heute, basis, jetzt }}
          knopf={(beginn) =>
            buchenKnopf(
              arzt.id,
              beginn,
              formatUhrzeit(beginn),
              "rounded-lg border border-linie bg-white px-3 py-1.5 text-sm font-medium tabular-nums transition hover:border-petrol hover:bg-petrol-hell",
            )
          }
        />
      )}
    </>
  );
}

async function TagesZeiten(props: {
  artId: number;
  arztId: number;
  tag: string;
  heute: string;
  basis: Suche;
  jetzt: Date;
  knopf: (beginn: Date) => React.ReactNode;
}) {
  const [t] = (await freieSlots(prisma, { arztId: props.arztId, terminartId: props.artId, abTag: props.tag, tage: 1, jetzt: props.jetzt, modus: "praxis" })) ?? [];
  const nav = { ...props.basis, arzt: String(props.arztId) };
  return (
    <Karte className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">{formatTag(berlinZeitpunkt(props.tag, "12:00"))}</h3>
        <div className="flex gap-2">
          {props.tag > props.heute && (
            <Link href={link({ ...nav, tag: tagPlus(props.tag, -1) })} className={knopfNeben} aria-label="Vorheriger Tag">
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
          )}
          <Link href={link({ ...nav, tag: tagPlus(props.tag, 1) })} className={knopfNeben} aria-label="Nächster Tag">
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
      {!t || t.slots.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-gedaempft">
          <Clock aria-hidden className="size-4" /> An diesem Tag ist nichts frei.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">{t.slots.map((s) => props.knopf(s))}</div>
      )}
    </Karte>
  );
}
