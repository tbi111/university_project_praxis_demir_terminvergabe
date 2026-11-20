"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { anmelden, type AnmeldeZustand } from "./aktionen";
import { Meldung, knopfHaupt } from "@/components/ui";

const feld =
  "w-full rounded-xl border border-linie bg-white px-4 py-2.5 text-base tabular-nums outline-none transition focus:border-petrol aria-[invalid=true]:border-fehler";

export function Anmeldeformular() {
  const [zustand, aktion, laeuft] = useActionState<AnmeldeZustand, FormData>(anmelden, {});
  const f = zustand.fehler ?? {};

  return (
    <form action={aktion} className="flex flex-col gap-5" noValidate>
      {f.allgemein && <Meldung art="fehler">{f.allgemein}</Meldung>}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="geburtsdatum" className="text-sm font-medium">
          Geburtsdatum <span className="text-fehler" aria-hidden>*</span>
        </label>
        <input
          id="geburtsdatum"
          name="geburtsdatum"
          type="date"
          required
          defaultValue={zustand.werte?.geburtsdatum}
          aria-invalid={Boolean(f.geburtsdatum)}
          aria-describedby={f.geburtsdatum ? "geburtsdatum-fehler" : undefined}
          className={feld}
        />
        {f.geburtsdatum && (
          <p id="geburtsdatum-fehler" className="text-sm text-fehler">
            {f.geburtsdatum}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nummer" className="text-sm font-medium">
          Versichertennummer oder Patientennummer <span className="text-fehler" aria-hidden>*</span>
        </label>
        <input
          id="nummer"
          name="nummer"
          type="text"
          required
          autoComplete="off"
          defaultValue={zustand.werte?.nummer}
          aria-invalid={Boolean(f.nummer)}
          aria-describedby={f.nummer ? "nummer-fehler" : "nummer-hilfe"}
          className={feld}
        />
        {f.nummer ? (
          <p id="nummer-fehler" className="text-sm text-fehler">
            {f.nummer}
          </p>
        ) : (
          <p id="nummer-hilfe" className="text-xs text-gedaempft">
            Gesetzlich versichert: Nummer auf der Gesundheitskarte. Privat versichert: Ihre Patientennummer aus der Praxis.
          </p>
        )}
      </div>

      <p className="text-xs text-gedaempft">
        <span className="text-fehler">*</span> Pflichtfeld
      </p>
      <button type="submit" disabled={laeuft} className={`${knopfHaupt} self-start`}>
        <LogIn aria-hidden className="size-4" />
        {laeuft ? "Wird geprüft …" : "Weiter"}
      </button>
    </form>
  );
}
