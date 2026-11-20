"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { praxisAnmelden, type PraxisAnmeldeZustand } from "../aktionen";
import { Meldung, knopfHaupt } from "@/components/ui";

export function PraxisAnmeldeformular() {
  const [zustand, aktion, laeuft] = useActionState<PraxisAnmeldeZustand, FormData>(praxisAnmelden, {});
  return (
    <form action={aktion} className="flex flex-col gap-5">
      {zustand.fehler && <Meldung art="fehler">{zustand.fehler}</Meldung>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="passwort" className="text-sm font-medium">
          Praxis-Passwort <span className="text-fehler" aria-hidden>*</span>
        </label>
        <input
          id="passwort"
          name="passwort"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-linie bg-white px-4 py-2.5 outline-none focus:border-petrol"
        />
      </div>
      <button type="submit" disabled={laeuft} className={`${knopfHaupt} self-start`}>
        <KeyRound aria-hidden className="size-4" />
        {laeuft ? "Wird geprüft …" : "Anmelden"}
      </button>
    </form>
  );
}
