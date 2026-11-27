import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CalendarDays, CalendarOff, LogOut, UserPlus } from "lucide-react";
import { offeneTermineGesamt } from "@/lib/abwesenheit";
import { prisma } from "@/lib/prisma";
import { praxisAbmelden } from "./aktionen";

async function OffeneBadge() {
  await connection();
  const n = await offeneTermineGesamt(prisma, new Date());
  if (n === 0) return null;
  return (
    <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white tabular-nums" title="Termine, die wegen Abwesenheit noch umgebucht oder abgesagt werden müssen">
      {n}
    </span>
  );
}

export function PraxisKopf({ aktiv }: { aktiv: "kalender" | "neu" | "abwesenheiten" }) {
  const reiter = (href: string, name: string, an: boolean, Icon: typeof CalendarDays, extra?: React.ReactNode) => (
    <Link
      href={href}
      aria-current={an ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${an ? "bg-petrol text-white" : "text-tinte hover:bg-petrol-hell"}`}
    >
      <Icon aria-hidden className="size-4" />
      {name}
      {extra}
    </Link>
  );
  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-linie pb-4">
      <div className="flex gap-2">
        {reiter("/praxis/kalender", "Kalender", aktiv === "kalender", CalendarDays)}
        {reiter("/praxis/neu", "Termin anlegen", aktiv === "neu", UserPlus)}
        {reiter(
          "/praxis/abwesenheiten",
          "Abwesenheiten",
          aktiv === "abwesenheiten",
          CalendarOff,
          <Suspense fallback={null}>
            <OffeneBadge />
          </Suspense>,
        )}
      </div>
      <form action={praxisAbmelden}>
        <button className="inline-flex items-center gap-1.5 text-sm text-gedaempft hover:text-petrol">
          <LogOut aria-hidden className="size-4" /> Abmelden
        </button>
      </form>
    </nav>
  );
}
