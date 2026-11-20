"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

export function Countdown({ ablaufAm }: { ablaufAm: string }) {
  const ende = new Date(ablaufAm).getTime();
  const [jetzt, setJetzt] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setJetzt(Date.now());
    const erster = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(erster);
      clearInterval(t);
    };
  }, []);

  if (jetzt === null) return <p className="text-sm text-gedaempft">Reservierung wird geprüft …</p>;
  const rest = Math.max(0, Math.round((ende - jetzt) / 1000));
  if (rest === 0) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-fehler" role="alert">
        <Timer aria-hidden className="size-4" />
        Die Reservierung ist abgelaufen. Bitte wählen Sie die Uhrzeit neu.
      </p>
    );
  }
  const min = Math.floor(rest / 60);
  const sek = String(rest % 60).padStart(2, "0");
  return (
    <p className="flex items-center gap-2 text-sm text-gedaempft" aria-live="polite">
      <Timer aria-hidden className="size-4 text-petrol" />
      Für Sie reserviert noch <span className="font-semibold tabular-nums text-tinte">{min}:{sek}</span> Minuten
    </p>
  );
}
