import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarX2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { istPraxisSitzung } from "@/lib/sitzung";
import { berlinTag, formatTag, formatUhrzeit } from "@/lib/zeit";
import { Karte, Laden, Seitentitel, knopfNeben } from "@/components/ui";
import { PraxisKopf } from "../../kopf";
import { terminAbsagen } from "../../aktionen";

const STATUS: Record<string, string> = { gebucht: "gebucht", abgesagt: "abgesagt", wahrgenommen: "wahrgenommen", no_show: "nicht erschienen" };

export default function TerminSeite({ params }: PageProps<"/praxis/termin/[id]">) {
  return (
    <main>
      <PraxisKopf aktiv="kalender" />
      <Suspense fallback={<Laden />}>
        <Inhalt params={params} />
      </Suspense>
    </main>
  );
}

async function Inhalt({ params }: { params: Promise<{ id: string }> }) {
  if (!(await istPraxisSitzung())) redirect("/praxis/anmelden");
  const { id } = await params;
  const termin = Number.isInteger(Number(id))
    ? await prisma.termin.findUnique({ where: { id: Number(id) }, include: { patient: true, arzt: true, terminart: true } })
    : null;
  if (!termin) notFound();

  return (
    <>
      <Seitentitel titel={`${termin.terminart.bezeichnung} · ${termin.patient.name}`} />
      <Karte className="max-w-lg">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-gedaempft">Datum</dt>
          <dd className="font-medium">{formatTag(termin.beginn)}</dd>
          <dt className="text-gedaempft">Uhrzeit</dt>
          <dd className="font-medium tabular-nums">
            {formatUhrzeit(termin.beginn)} Uhr ({termin.terminart.dauerMinuten} Min.)
          </dd>
          <dt className="text-gedaempft">Ärzt:in</dt>
          <dd className="font-medium">
            {termin.arzt.titel} {termin.arzt.name}
          </dd>
          <dt className="text-gedaempft">Patient:in</dt>
          <dd className="font-medium tabular-nums">
            {termin.patient.name} (Nr. {termin.patient.id})
          </dd>
          <dt className="text-gedaempft">Gebucht</dt>
          <dd className="font-medium">{termin.quelle === "online" ? "online" : "telefonisch"}</dd>
          <dt className="text-gedaempft">Status</dt>
          <dd>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${termin.status === "gebucht" ? "bg-petrol-hell text-petrol-dunkel" : "bg-fehler-hell text-fehler"}`}>
              {STATUS[termin.status] ?? termin.status}
            </span>
          </dd>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-linie pt-5">
          {termin.status === "gebucht" && (
            <form action={terminAbsagen}>
              <input type="hidden" name="termin" value={termin.id} />
              <button className="inline-flex items-center gap-2 rounded-full border border-fehler px-4 py-2 text-sm font-medium text-fehler transition hover:bg-fehler-hell">
                <CalendarX2 aria-hidden className="size-4" /> Termin absagen
              </button>
            </form>
          )}
          <Link href={`/praxis/kalender?tag=${berlinTag(termin.beginn)}`} className={knopfNeben}>
            Zurück zum Kalender
          </Link>
        </div>
      </Karte>
    </>
  );
}
