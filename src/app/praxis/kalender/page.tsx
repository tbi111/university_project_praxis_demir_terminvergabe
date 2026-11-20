import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Globe, Phone, TrendingUp } from "lucide-react";
import { tagesKalender, tagesKennzahlen } from "@/lib/praxis";
import { prisma } from "@/lib/prisma";
import { istPraxisSitzung } from "@/lib/sitzung";
import { berlinTag, berlinZeitpunkt, formatTag, formatUhrzeit, istGueltigerTag, tagPlus } from "@/lib/zeit";
import { Karte, Laden, Meldung, knopfNeben } from "@/components/ui";
import { PraxisKopf } from "../kopf";

type Suche = { tag?: string; neu?: string; abgesagt?: string; fehler?: string };

const PX_PRO_MINUTE = 2;

export default function KalenderSeite({ searchParams }: PageProps<"/praxis/kalender">) {
  return (
    <main>
      <PraxisKopf aktiv="kalender" />
      <Suspense fallback={<Laden text="Kalender wird geladen …" />}>
        <Inhalt suche={searchParams as Promise<Suche>} />
      </Suspense>
    </main>
  );
}

async function Inhalt({ suche }: { suche: Promise<Suche> }) {
  if (!(await istPraxisSitzung())) redirect("/praxis/anmelden");
  const { tag: tagParam, neu, abgesagt, fehler } = await suche;
  const jetzt = new Date();
  const heute = berlinTag(jetzt);
  const tag = tagParam && istGueltigerTag(tagParam) ? tagParam : heute;
  const [spalten, zahlen] = await Promise.all([tagesKalender(prisma, tag, jetzt), tagesKennzahlen(prisma, jetzt)]);
  const neuId = neu ? Number(neu) : null;

  return (
    <>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Kennzahl icon={Globe} titel="Heute online gebucht" wert={String(zahlen.online)} />
        <Kennzahl icon={Phone} titel="Heute telefonisch gebucht" wert={String(zahlen.telefon)} />
        <Kennzahl
          icon={TrendingUp}
          titel="Anteil online"
          wert={zahlen.anteilOnline === null ? "–" : `${zahlen.anteilOnline} %`}
          hinweis="Ziel der Praxis: deutlich weniger Anrufe am Montagmorgen"
        />
      </div>

      {neuId && <Meldung art="hinweis">Der Termin ist gebucht und im Kalender markiert.</Meldung>}
      {abgesagt && <Meldung art="hinweis">Der Termin ist abgesagt. Die Zeit ist wieder frei.</Meldung>}
      {fehler === "absage" && <Meldung art="fehler">Der Termin konnte nicht abgesagt werden.</Meldung>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{formatTag(berlinZeitpunkt(tag, "12:00"))}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/praxis/kalender?tag=${tagPlus(tag, -1)}`} className={knopfNeben} aria-label="Vorheriger Tag">
            <ChevronLeft aria-hidden className="size-4" />
          </Link>
          {tag !== heute && (
            <Link href="/praxis/kalender" className={knopfNeben}>
              Heute
            </Link>
          )}
          <Link href={`/praxis/kalender?tag=${tagPlus(tag, 1)}`} className={knopfNeben} aria-label="Nächster Tag">
            <ChevronRight aria-hidden className="size-4" />
          </Link>
          <form action="/praxis/kalender" className="flex items-center gap-2">
            <label htmlFor="tag" className="sr-only">
              Datum wählen
            </label>
            <input id="tag" name="tag" type="date" defaultValue={tag} className="rounded-full border border-linie bg-white px-3 py-1.5 text-sm tabular-nums" />
            <button className={knopfNeben}>Zeigen</button>
          </form>
        </div>
      </div>

      <Zeitplan spalten={spalten} neuId={neuId} />
    </>
  );
}

function Kennzahl({ icon: Icon, titel, wert, hinweis }: { icon: typeof Globe; titel: string; wert: string; hinweis?: string }) {
  return (
    <Karte className="p-5">
      <p className="flex items-center gap-2 text-sm text-gedaempft">
        <Icon aria-hidden className="size-4 text-petrol" />
        {titel}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{wert}</p>
      {hinweis && <p className="mt-1 text-xs text-gedaempft">{hinweis}</p>}
    </Karte>
  );
}

type Spalte = Awaited<ReturnType<typeof tagesKalender>>[number];

function Zeitplan({ spalten, neuId }: { spalten: Spalte[]; neuId: number | null }) {
  const mitSprechzeit = spalten.filter((s) => s.bloecke.length > 0 || s.termine.length > 0);
  if (mitSprechzeit.length === 0) {
    return (
      <Karte className="py-12 text-center">
        <p className="font-medium">An diesem Tag gibt es keine Sprechzeiten.</p>
        <p className="mt-1 text-sm text-gedaempft">Wochenende oder alle Ärzt:innen sind nicht da.</p>
      </Karte>
    );
  }

  const zeiten = mitSprechzeit.flatMap((s) => [...s.bloecke.flatMap((b) => [b.beginn, b.ende]), ...s.termine.flatMap((t) => [t.beginn, t.ende])]);
  const start = new Date(Math.floor(Math.min(...zeiten.map((d) => d.getTime())) / 3600000) * 3600000);
  const ende = new Date(Math.ceil(Math.max(...zeiten.map((d) => d.getTime())) / 3600000) * 3600000);
  const minuten = (d: Date) => (d.getTime() - start.getTime()) / 60000;
  const hoehe = minuten(ende) * PX_PRO_MINUTE;
  const stunden: Date[] = [];
  for (let t = start.getTime(); t <= ende.getTime(); t += 3600000) stunden.push(new Date(t));

  return (
    <Karte className="overflow-x-auto p-0">
      <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `4rem repeat(${mitSprechzeit.length}, minmax(0, 1fr))` }}>
        <div className="border-b border-linie" />
        {mitSprechzeit.map((s) => (
          <div key={s.id} className="border-b border-l border-linie px-3 py-3 text-sm font-semibold">
            {s.name}
            <span className="ml-2 font-normal text-gedaempft tabular-nums">
              {(() => {
                const n = s.termine.filter((t) => t.status !== "abgesagt").length;
                return `${n} ${n === 1 ? "Termin" : "Termine"}`;
              })()}
            </span>
          </div>
        ))}

        <div className="relative" style={{ height: hoehe }}>
          {stunden.map((h) => (
            <span key={h.getTime()} className="absolute right-2 -translate-y-1/2 text-xs text-gedaempft tabular-nums" style={{ top: minuten(h) * PX_PRO_MINUTE }}>
              {formatUhrzeit(h)}
            </span>
          ))}
        </div>

        {mitSprechzeit.map((s) => (
          <div key={s.id} className="relative border-l border-linie" style={{ height: hoehe }}>
            {stunden.map((h) => (
              <div key={h.getTime()} className="absolute inset-x-0 border-t border-linie/70" style={{ top: minuten(h) * PX_PRO_MINUTE }} />
            ))}
            {s.bloecke.map((b) => (
              <div
                key={b.beginn.toISOString()}
                className={`absolute inset-x-1 rounded-md ${b.akut ? "bg-amber-100/80" : "bg-petrol-hell/70"}`}
                style={{ top: minuten(b.beginn) * PX_PRO_MINUTE, height: minuten(b.ende) * PX_PRO_MINUTE - minuten(b.beginn) * PX_PRO_MINUTE }}
              >
                {b.akut && <span className="absolute right-1.5 top-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Akut</span>}
              </div>
            ))}
            {s.reservierungen.map((r) => (
              <div
                key={r.id}
                className="absolute inset-x-2 overflow-hidden rounded-md border border-dashed border-amber-500 bg-white/90 px-2 text-[11px] leading-tight text-amber-800"
                style={{ top: minuten(r.beginn) * PX_PRO_MINUTE, height: Math.max(14, (minuten(r.ende) - minuten(r.beginn)) * PX_PRO_MINUTE) }}
              >
                wird gerade online gebucht
              </div>
            ))}
            {s.termine
              .filter((t) => t.status !== "abgesagt")
              .map((t) => {
                const h = (minuten(t.ende) - minuten(t.beginn)) * PX_PRO_MINUTE;
                return (
                  <Link
                    key={t.id}
                    href={`/praxis/termin/${t.id}`}
                    className={`absolute inset-x-2 flex overflow-hidden rounded-md border bg-white px-2 text-[11px] leading-tight shadow-sm transition hover:z-10 hover:border-petrol ${t.id === neuId ? "border-petrol ring-2 ring-petrol" : "border-linie"}`}
                    style={{ top: minuten(t.beginn) * PX_PRO_MINUTE, height: Math.max(12, h - 1) }}
                  >
                    <span className={`mr-1.5 mt-0.5 h-[calc(100%-4px)] w-1 shrink-0 rounded-full ${t.quelle === "online" ? "bg-petrol" : "bg-amber-500"}`} />
                    <span className="min-w-0 truncate py-0.5">
                      <span className="tabular-nums text-gedaempft">{formatUhrzeit(t.beginn)}</span> <span className="font-medium">{t.patient}</span>
                      {h >= 28 && <span className="block truncate text-gedaempft">{t.terminart}</span>}
                    </span>
                  </Link>
                );
              })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 border-t border-linie px-4 py-3 text-xs text-gedaempft">
        <Legende farbe="bg-petrol" text="online gebucht" />
        <Legende farbe="bg-amber-500" text="telefonisch gebucht" />
        <Legende farbe="bg-petrol-hell" text="Sprechzeit" />
        <Legende farbe="bg-amber-100" text="Akutblock" />
      </div>
    </Karte>
  );
}

function Legende({ farbe, text }: { farbe: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-sm ${farbe}`} /> {text}
    </span>
  );
}
