import { berlinZeitpunkt, plusMinuten, tagPlus, wochentag } from "./zeit";

export type SprechzeitBlock = { wochentag: number; beginn: string; ende: string; akut: boolean };
export type Belegung = { beginn: Date; ende: Date };
export type Tagesslots = { tag: string; slots: Date[] };

export function ueberschneidet(a: Belegung, b: Belegung): boolean {
  return a.beginn < b.ende && a.ende > b.beginn;
}

/**
 * Freie Startzeiten aus den Sprechzeiten. Je nach Terminart zählen nur normale
 * Sprechzeiten oder nur Akutblöcke (BR2). Belegte Zeiten und Zeiten in der
 * Vergangenheit fallen weg.
 */
export function berechneFreieSlots(params: {
  sprechzeiten: SprechzeitBlock[];
  belegungen: Belegung[];
  dauerMinuten: number;
  abTag: string;
  tage: number;
  jetzt: Date;
  bloecke?: "normal" | "akut";
}): Tagesslots[] {
  const { sprechzeiten, belegungen, dauerMinuten, abTag, tage, jetzt } = params;
  const nurAkut = params.bloecke === "akut";
  const ergebnis: Tagesslots[] = [];

  for (let i = 0; i < tage; i++) {
    const tag = tagPlus(abTag, i);
    const passendeBloecke = sprechzeiten
      .filter((s) => s.wochentag === wochentag(tag) && s.akut === nurAkut)
      .sort((a, b) => a.beginn.localeCompare(b.beginn));
    const slots: Date[] = [];

    for (const block of passendeBloecke) {
      const blockEnde = berlinZeitpunkt(tag, block.ende);
      for (let start = berlinZeitpunkt(tag, block.beginn); plusMinuten(start, dauerMinuten) <= blockEnde; start = plusMinuten(start, dauerMinuten)) {
        if (start <= jetzt) continue;
        const kandidat = { beginn: start, ende: plusMinuten(start, dauerMinuten) };
        if (belegungen.some((b) => ueberschneidet(kandidat, b))) continue;
        slots.push(start);
      }
    }
    ergebnis.push({ tag, slots });
  }
  return ergebnis;
}
