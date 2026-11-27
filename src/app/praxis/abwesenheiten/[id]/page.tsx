import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarCheck2, CalendarX2, Repeat, Trash2 } from "lucide-react";
import { betroffeneTermine, zeitraumText } from "@/lib/abwesenheit";
import { prisma } from "@/lib/prisma";
import { istPraxisSitzung } from "@/lib/sitzung";
import { formatTag, formatUhrzeit } from "@/lib/zeit";
import { Karte, Laden, Meldung, knopfNeben } from "@/components/ui";
import { PraxisKopf } from "../../kopf";
import { abwesenheitLoeschen, terminAbsagen } from "../../aktionen";

type Suche = { neu?: string; umgebucht?: string; abgesagt?: string; fehler?: string };

export default function AbwesenheitSeite({ params, searchParams }: PageProps<"/praxis/abwesenheiten/[id]">) {
  return (
    <main>
      <PraxisKopf aktiv="abwesenheiten" />
      <Suspense fallback={<Laden />}>
        <Inhalt params={params} suche={searchParams as Promise<Suche>} />
      </Suspense>
    </main>
  );
}

async function Inhalt({ params, suche }: { params: Promise<{ id: string }>; suche: Promise<Suche> }) {
  if (!(await istPraxisSitzung())) redirect("/praxis/anmelden");
  await connection();
  const { id } = await params;
  const s = await suche;
  const abwesenheit = Number.isInteger(Number(id)) ? await prisma.abwesenheit.findUnique({ where: { id: Number(id) }, include: { arzt: true } }) : null;
  if (!abwesenheit) notFound();
  const termine = await betroffeneTermine(prisma, abwesenheit.id);
  const zurueck = `/praxis/abwesenheiten/${abwesenheit.id}`;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gedaempft">
            <Link href="/praxis/abwesenheiten" className="hover:text-petrol">
              Abwesenheiten
            </Link>{" "}
            /
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {abwesenheit.arzt ? `${abwesenheit.arzt.titel} ${abwesenheit.arzt.name}` : "Ganze Praxis"} · {abwesenheit.grund}
          </h1>
          <p className="mt-1 text-gedaempft tabular-nums">{zeitraumText(abwesenheit.von, abwesenheit.bis)}</p>
        </div>
        <form action={abwesenheitLoeschen}>
          <input type="hidden" name="abwesenheit" value={abwesenheit.id} />
          <button className={knopfNeben}>
            <Trash2 aria-hidden className="size-4" /> Abwesenheit löschen
          </button>
        </form>
      </div>

      {s.neu && <Meldung art="hinweis">Die Abwesenheit ist eingetragen. In diesem Zeitraum sind keine Termine mehr buchbar.</Meldung>}
      {s.umgebucht && <Meldung art="hinweis">Der Termin ist umgebucht, der alte Termin wurde abgesagt.</Meldung>}
      {s.abgesagt && <Meldung art="hinweis">Der Termin ist abgesagt.</Meldung>}
      {s.fehler && <Meldung art="fehler">Der Termin konnte nicht abgesagt werden.</Meldung>}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gedaempft">
        Betroffene Termine <span className="tabular-nums">({termine.length} offen)</span>
      </h2>
      {termine.length === 0 ? (
        <Karte className="flex flex-col items-center gap-2 py-10 text-center">
          <CalendarCheck2 aria-hidden className="size-8 text-petrol" />
          <p className="font-medium">Alles erledigt.</p>
          <p className="text-sm text-gedaempft">Im Zeitraum sind keine gebuchten Termine mehr offen.</p>
        </Karte>
      ) : (
        <Karte className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-linie text-left text-xs uppercase tracking-wide text-gedaempft">
                <th className="px-5 py-3 font-semibold">Termin</th>
                <th className="px-5 py-3 font-semibold">Patient:in</th>
                <th className="px-5 py-3 font-semibold">Terminart</th>
                <th className="px-5 py-3 text-right font-semibold">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {termine.map((t) => (
                <tr key={t.id} className="border-b border-linie/70 last:border-0 hover:bg-flaeche/60">
                  <td className="px-5 py-3">
                    <span className="block">{formatTag(t.beginn)}</span>
                    <span className="text-gedaempft tabular-nums">
                      {formatUhrzeit(t.beginn)} Uhr · {t.arzt.titel} {t.arzt.name}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="block font-medium">{t.patient.name}</span>
                    <span className="text-gedaempft tabular-nums">Nr. {t.patient.id}</span>
                  </td>
                  <td className="px-5 py-3">{t.terminart.bezeichnung}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/praxis/neu?patient=${t.patientId}&art=${t.terminartId}&ersetzt=${t.id}&abw=${abwesenheit.id}`} className={knopfNeben}>
                        <Repeat aria-hidden className="size-4" /> Umbuchen
                      </Link>
                      <form action={terminAbsagen}>
                        <input type="hidden" name="termin" value={t.id} />
                        <input type="hidden" name="zurueck" value={zurueck} />
                        <button className="inline-flex items-center gap-2 rounded-full border border-fehler px-4 py-2 text-sm font-medium text-fehler transition hover:bg-fehler-hell">
                          <CalendarX2 aria-hidden className="size-4" /> Absagen
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Karte>
      )}
    </>
  );
}
