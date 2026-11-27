import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarX2 } from "lucide-react";
import { onlineAbsagbar } from "@/lib/buchung";
import { prisma } from "@/lib/prisma";
import { sitzungPatientId } from "@/lib/sitzung";
import { formatTag, formatUhrzeit } from "@/lib/zeit";
import { Karte, Laden, Seitentitel, knopfNeben } from "@/components/ui";
import { absagenAktion } from "../../aktionen";

export default function AbsagenSeite({ params }: PageProps<"/buchen/absagen/[id]">) {
  return (
    <main>
      <Suspense fallback={<Laden />}>
        <Inhalt params={params} />
      </Suspense>
    </main>
  );
}

async function Inhalt({ params }: { params: Promise<{ id: string }> }) {
  const patientId = await sitzungPatientId();
  if (!patientId) redirect("/buchen");
  await connection();
  const { id } = await params;
  const termin = Number.isInteger(Number(id))
    ? await prisma.termin.findUnique({ where: { id: Number(id) }, include: { arzt: true, terminart: true } })
    : null;
  if (!termin || termin.patientId !== patientId) redirect("/buchen/meine-termine?fehler=nicht_gefunden");
  if (termin.status !== "gebucht") redirect("/buchen/meine-termine?fehler=nicht_gebucht");
  if (!onlineAbsagbar(termin.beginn, new Date())) redirect("/buchen/meine-termine?fehler=zu_spaet");

  return (
    <>
      <Seitentitel titel="Termin absagen?" unterzeile="Nach der Absage ist die Zeit wieder für andere frei. Das lässt sich nicht rückgängig machen." />
      <Karte className="max-w-lg">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-gedaempft">Terminart</dt>
          <dd className="font-medium">{termin.terminart.bezeichnung}</dd>
          <dt className="text-gedaempft">Ärzt:in</dt>
          <dd className="font-medium">
            {termin.arzt.titel} {termin.arzt.name}
          </dd>
          <dt className="text-gedaempft">Datum</dt>
          <dd className="font-medium">{formatTag(termin.beginn)}</dd>
          <dt className="text-gedaempft">Uhrzeit</dt>
          <dd className="font-medium tabular-nums">{formatUhrzeit(termin.beginn)} Uhr</dd>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-linie pt-5">
          <form action={absagenAktion}>
            <input type="hidden" name="termin" value={termin.id} />
            <button className="inline-flex items-center gap-2 rounded-full bg-fehler px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
              <CalendarX2 aria-hidden className="size-4" /> Ja, Termin absagen
            </button>
          </form>
          <Link href="/buchen/meine-termine" className={knopfNeben}>
            Nein, behalten
          </Link>
        </div>
      </Karte>
    </>
  );
}
