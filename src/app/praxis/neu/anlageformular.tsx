"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { patientAnlegen, type AnlageZustand } from "../aktionen";
import { knopfHaupt } from "@/components/ui";

const feld = "w-full rounded-xl border border-linie bg-white px-4 py-2.5 outline-none focus:border-petrol aria-[invalid=true]:border-fehler";

export function Anlageformular({ aerzte }: { aerzte: { id: number; name: string }[] }) {
  const [zustand, aktion, laeuft] = useActionState<AnlageZustand, FormData>(patientAnlegen, {});
  const f = zustand.fehler ?? {};
  const w = zustand.werte ?? {};

  const fehlertext = (id: keyof typeof f) =>
    f[id] && (
      <p id={`${id}-fehler`} className="text-sm text-fehler">
        {f[id]}
      </p>
    );

  return (
    <form action={aktion} className="grid gap-5 sm:grid-cols-2" noValidate>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name <span className="text-fehler" aria-hidden>*</span>
        </label>
        <input id="name" name="name" required defaultValue={w.name} aria-invalid={Boolean(f.name)} aria-describedby={f.name ? "name-fehler" : undefined} className={feld} />
        {fehlertext("name")}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="geburtsdatum" className="text-sm font-medium">
          Geburtsdatum <span className="text-fehler" aria-hidden>*</span>
        </label>
        <input
          id="geburtsdatum"
          name="geburtsdatum"
          type="date"
          required
          defaultValue={w.geburtsdatum}
          aria-invalid={Boolean(f.geburtsdatum)}
          aria-describedby={f.geburtsdatum ? "geburtsdatum-fehler" : undefined}
          className={`${feld} tabular-nums`}
        />
        {fehlertext("geburtsdatum")}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="versichertennummer" className="text-sm font-medium">
          Versichertennummer
        </label>
        <input
          id="versichertennummer"
          name="versichertennummer"
          defaultValue={w.versichertennummer}
          aria-invalid={Boolean(f.versichertennummer)}
          aria-describedby={f.versichertennummer ? "versichertennummer-fehler" : "versichertennummer-hilfe"}
          className={`${feld} tabular-nums`}
        />
        {fehlertext("versichertennummer") || (
          <p id="versichertennummer-hilfe" className="text-xs text-gedaempft">
            Nur bei gesetzlich Versicherten. Privatversicherte melden sich online mit ihrer Patientennummer an.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="hausarzt" className="text-sm font-medium">
          Hausärzt:in
        </label>
        <select id="hausarzt" name="hausarzt" defaultValue={w.hausarzt ?? ""} className={feld}>
          <option value="">noch keine</option>
          {aerzte.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-start gap-3 self-end rounded-xl border border-linie bg-white px-4 py-3 text-sm">
        <input type="checkbox" name="sms" value="ja" className="mt-0.5 size-4 accent-[var(--color-petrol)]" />
        <span>
          Einwilligung für Bestätigungen per SMS liegt vor
          <span className="block text-xs text-gedaempft">Ohne Einwilligung geht die Bestätigung per Brief raus.</span>
        </span>
      </label>
      <div className="flex items-center justify-between sm:col-span-2">
        <p className="text-xs text-gedaempft">
          <span className="text-fehler">*</span> Pflichtfeld
        </p>
        <button type="submit" disabled={laeuft} className={knopfHaupt}>
          <UserPlus aria-hidden className="size-4" />
          {laeuft ? "Wird angelegt …" : "Patient:in anlegen"}
        </button>
      </div>
    </form>
  );
}
