import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sitzungPatientId } from "@/lib/sitzung";
import { formatTag, formatUhrzeit } from "@/lib/zeit";
import { Karte, Laden, knopfNeben } from "@/components/ui";
import { abmelden } from "../aktionen";

export default function FertigSeite({ searchParams }: PageProps<"/buchen/fertig">) {
  return (
    <main>
      <Suspense fallback={<Laden />}>
        <Inhalt suche={searchParams as Promise<{ t?: string }>} />
      </Suspense>
    </main>
  );
}

async function Inhalt({ suche }: { suche: Promise<{ t?: string }> }) {
  const patientId = await sitzungPatientId();
  if (!patientId) redirect("/buchen");
  const { t } = await suche;
  const termin = Number.isInteger(Number(t))
    ? await prisma.termin.findUnique({ where: { id: Number(t) }, include: { arzt: true, terminart: true } })
    : null;
  if (!termin || termin.patientId !== patientId) redirect("/buchen/termin");

  return (
    <Karte className="mx-auto flex max-w-lg flex-col items-center gap-4 py-10 text-center">
      <CircleCheck aria-hidden className="size-10 text-petrol" />
      <h1 className="font-display text-3xl font-semibold">Ihr Termin ist gebucht</h1>
      <p className="text-gedaempft">
        {termin.terminart.bezeichnung} bei {termin.arzt.titel} {termin.arzt.name}
        <br />
        <span className="font-medium text-tinte">
          {formatTag(termin.beginn)}, <span className="tabular-nums">{formatUhrzeit(termin.beginn)}</span> Uhr
        </span>
      </p>
      <p className="text-sm text-gedaempft">Bitte notieren Sie sich den Termin.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/buchen/meine-termine" className={knopfNeben}>
          Meine Termine
        </Link>
        <form action={abmelden}>
          <button className={knopfNeben}>Fertig und abmelden</button>
        </form>
      </div>
    </Karte>
  );
}
