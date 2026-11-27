"use client";

import { useActionState } from "react";
import { CalendarOff } from "lucide-react";
import { abwesenheitAnlegen, type AbwesenheitZustand } from "../aktionen";
import { Meldung, knopfHaupt } from "@/components/ui";

const feld = "w-full rounded-xl border border-linie bg-white px-4 py-2.5 outline-none focus:border-petrol aria-[invalid=true]:border-fehler";
const label = "text-sm font-medium";

export function AbwesenheitFormular({ aerzte, heute }: { aerzte: { id: number; name: string }[]; heute: string }) {
  const [zustand, aktion, laeuft] = useActionState<AbwesenheitZustand, FormData>(abwesenheitAnlegen, {});
  const f = zustand.fehler ?? {};
  const w = zustand.werte ?? {};
  const fehler = (id: keyof typeof f) =>
    f[id] && (
      <p id={`${id}-fehler`} className="text-sm text-fehler">
        {f[id]}
      </p>
    );

  return (
    <form action={aktion} className="grid gap-5 sm:grid-cols-2" noValidate>
      {f.zeitraum && (
        <div className="sm:col-span-2">
          <Meldung art="fehler">{f.zeitraum}</Meldung>
        </div>
      )}
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="arzt" className={label}>
          Wer ist nicht da? <span className="text-fehler" aria-hidden>*</span>
        </label>
        <select id="arzt" name="arzt" defaultValue={w.arzt ?? String(aerzte[0]?.id ?? "")} className={feld}>
          {aerzte.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          <option value="praxis">Ganze Praxis (z. B. Betriebsurlaub)</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="vonTag" className={label}>
          Von <span className="text-fehler" aria-hidden>*</span>
        </label>
        <input id="vonTag" name="vonTag" type="date" required min={heute} defaultValue={w.vonTag ?? heute} aria-invalid={Boolean(f.vonTag)} className={`${feld} tabular-nums`} />
        {fehler("vonTag")}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bisTag" className={label}>
          Bis einschließlich <span className="text-fehler" aria-hidden>*</span>
        </label>
        <input id="bisTag" name="bisTag" type="date" required min={heute} defaultValue={w.bisTag ?? heute} aria-invalid={Boolean(f.bisTag)} className={`${feld} tabular-nums`} />
        {fehler("bisTag")}
      </div>
      <details className="rounded-xl border border-linie bg-white px-4 py-3 sm:col-span-2" open={Boolean(w.vonUhrzeit || w.bisUhrzeit)}>
        <summary className="cursor-pointer text-sm font-medium">Nur einen Teil des Tages? Uhrzeit angeben</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vonUhrzeit" className={label}>
              Ab Uhrzeit
            </label>
            <input id="vonUhrzeit" name="vonUhrzeit" type="time" defaultValue={w.vonUhrzeit} className={`${feld} tabular-nums`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bisUhrzeit" className={label}>
              Bis Uhrzeit
            </label>
            <input id="bisUhrzeit" name="bisUhrzeit" type="time" defaultValue={w.bisUhrzeit} className={`${feld} tabular-nums`} />
          </div>
          <p className="text-xs text-gedaempft sm:col-span-2">Ohne Uhrzeit gilt die Abwesenheit für die ganzen Tage.</p>
        </div>
      </details>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="grund" className={label}>
          Grund <span className="text-fehler" aria-hidden>*</span>
        </label>
        <input id="grund" name="grund" list="gruende" required defaultValue={w.grund} aria-invalid={Boolean(f.grund)} className={feld} />
        <datalist id="gruende">
          <option value="Urlaub" />
          <option value="Fortbildung" />
          <option value="Krankheit" />
          <option value="Betriebsurlaub" />
        </datalist>
        {fehler("grund")}
      </div>
      <div className="flex items-center justify-between sm:col-span-2">
        <p className="text-xs text-gedaempft">
          <span className="text-fehler">*</span> Pflichtfeld
        </p>
        <button type="submit" disabled={laeuft} className={knopfHaupt}>
          <CalendarOff aria-hidden className="size-4" />
          {laeuft ? "Wird gespeichert …" : "Abwesenheit eintragen"}
        </button>
      </div>
    </form>
  );
}
