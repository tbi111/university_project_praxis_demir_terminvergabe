import Link from "next/link";
import { CalendarDays, LogOut, UserPlus } from "lucide-react";
import { praxisAbmelden } from "./aktionen";

export function PraxisKopf({ aktiv }: { aktiv: "kalender" | "neu" }) {
  const reiter = (href: string, name: string, an: boolean, Icon: typeof CalendarDays) => (
    <Link
      href={href}
      aria-current={an ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${an ? "bg-petrol text-white" : "text-tinte hover:bg-petrol-hell"}`}
    >
      <Icon aria-hidden className="size-4" />
      {name}
    </Link>
  );
  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-linie pb-4">
      <div className="flex gap-2">
        {reiter("/praxis/kalender", "Kalender", aktiv === "kalender", CalendarDays)}
        {reiter("/praxis/neu", "Termin anlegen", aktiv === "neu", UserPlus)}
      </div>
      <form action={praxisAbmelden}>
        <button className="inline-flex items-center gap-1.5 text-sm text-gedaempft hover:text-petrol">
          <LogOut aria-hidden className="size-4" /> Abmelden
        </button>
      </form>
    </nav>
  );
}
