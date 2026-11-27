import Link from "next/link";
import { CalendarPlus, ListChecks } from "lucide-react";
import { abmelden } from "@/app/buchen/aktionen";

/** Kopfzeile für angemeldete Patient:innen: Buchen oder eigene Termine. */
export function Patientenkopf({ name, aktiv }: { name: string; aktiv: "buchen" | "termine" }) {
  const reiter = (href: string, text: string, an: boolean, Icon: typeof ListChecks) => (
    <Link
      href={href}
      aria-current={an ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${an ? "bg-petrol text-white" : "text-tinte hover:bg-petrol-hell"}`}
    >
      <Icon aria-hidden className="size-4" />
      {text}
    </Link>
  );
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-linie pb-4">
      <div className="flex gap-2">
        {reiter("/buchen/termin", "Termin buchen", aktiv === "buchen", CalendarPlus)}
        {reiter("/buchen/meine-termine", "Meine Termine", aktiv === "termine", ListChecks)}
      </div>
      <div className="flex items-center gap-3 text-sm text-gedaempft">
        <span>Angemeldet als {name}</span>
        <form action={abmelden}>
          <button className="underline underline-offset-4 hover:text-petrol">Abmelden</button>
        </form>
      </div>
    </div>
  );
}
