import { Check } from "lucide-react";

const SCHRITTE = ["Anmelden", "Terminart", "Uhrzeit", "Bestätigen"];

export function Schrittleiste({ aktiv }: { aktiv: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mb-10 grid grid-cols-4 gap-2" aria-label="Fortschritt der Buchung">
      {SCHRITTE.map((name, i) => {
        const nr = i + 1;
        const erledigt = nr < aktiv;
        const jetzt = nr === aktiv;
        return (
          <li key={name} aria-current={jetzt ? "step" : undefined} className="flex flex-col gap-2">
            <span className={`h-1.5 rounded-full ${nr <= aktiv ? "bg-petrol" : "bg-linie"}`} />
            <span className={`flex items-center gap-1.5 text-xs ${jetzt ? "font-semibold text-tinte" : "text-gedaempft"}`}>
              {erledigt && <Check aria-hidden className="size-3.5 text-petrol" />}
              <span className="tabular-nums">{nr}.</span> {name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
