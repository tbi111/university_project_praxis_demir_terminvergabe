import type { Db } from "./prisma";
import { berlinTag, berlinZeitpunkt, formatTagKurz, formatUhrzeit, istGueltigerTag, plusMinuten, tagPlus } from "./zeit";

export type AbwesenheitEingabe = {
  arztId: number | null;
  vonTag: string;
  bisTag: string;
  vonUhrzeit?: string;
  bisUhrzeit?: string;
  grund: string;
};

type Feld = "vonTag" | "bisTag" | "grund" | "zeitraum";
export type AbwesenheitErgebnis = { ok: true; id: number } | { ok: false; fehler: Partial<Record<Feld, string>> };

const UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Zeitraum aus der Eingabe. Ohne Uhrzeit gilt der ganze Tag, also bis Mitternacht des letzten Tages. */
export function zeitraum(e: AbwesenheitEingabe) {
  const von = berlinZeitpunkt(e.vonTag, e.vonUhrzeit || "00:00");
  const bis = e.bisUhrzeit ? berlinZeitpunkt(e.bisTag, e.bisUhrzeit) : berlinZeitpunkt(tagPlus(e.bisTag, 1), "00:00");
  return { von, bis };
}

/** Die MFA trägt Abwesenheiten ein. Termine werden dabei nicht automatisch umgebucht (Nachr. 7, 14). */
export async function legeAbwesenheitAn(db: Db, e: AbwesenheitEingabe, jetzt: Date): Promise<AbwesenheitErgebnis> {
  const fehler: Partial<Record<Feld, string>> = {};
  if (!istGueltigerTag(e.vonTag)) fehler.vonTag = "Bitte ein gültiges Datum eingeben.";
  if (!istGueltigerTag(e.bisTag)) fehler.bisTag = "Bitte ein gültiges Datum eingeben.";
  if (e.grund.trim().length < 2) fehler.grund = "Bitte einen Grund angeben.";
  if ((e.vonUhrzeit && !UHRZEIT.test(e.vonUhrzeit)) || (e.bisUhrzeit && !UHRZEIT.test(e.bisUhrzeit))) {
    fehler.zeitraum = "Die Uhrzeit hat das Format HH:MM.";
  }
  if (Object.keys(fehler).length > 0) return { ok: false, fehler };

  const { von, bis } = zeitraum(e);
  if (bis <= von) return { ok: false, fehler: { zeitraum: "Das Ende muss nach dem Beginn liegen." } };
  if (bis <= jetzt) return { ok: false, fehler: { zeitraum: "Der Zeitraum liegt komplett in der Vergangenheit." } };
  if (e.arztId !== null && !(await db.arzt.findUnique({ where: { id: e.arztId } }))) {
    return { ok: false, fehler: { zeitraum: "Diese Ärzt:in gibt es nicht." } };
  }

  const a = await db.abwesenheit.create({ data: { arztId: e.arztId, von, bis, grund: e.grund.trim() } });
  return { ok: true, id: a.id };
}

/** Gebuchte Termine, die in den Zeitraum fallen. Sie bleiben gebucht, bis die MFA sie umbucht oder absagt. */
export async function betroffeneTermine(db: Db, abwesenheitId: number) {
  const a = await db.abwesenheit.findUnique({ where: { id: abwesenheitId } });
  if (!a) return [];
  const termine = await db.termin.findMany({
    where: { status: "gebucht", beginn: { gte: plusMinuten(a.von, -120), lt: a.bis }, ...(a.arztId !== null ? { arztId: a.arztId } : {}) },
    include: { patient: true, arzt: true, terminart: true },
    orderBy: { beginn: "asc" },
  });
  return termine.filter((t) => plusMinuten(t.beginn, t.terminart.dauerMinuten) > a.von);
}

/** Kommende und laufende Abwesenheiten mit der Zahl der noch offenen Termine. */
export async function kommendeAbwesenheiten(db: Db, jetzt: Date) {
  const liste = await db.abwesenheit.findMany({ where: { bis: { gt: jetzt } }, include: { arzt: true }, orderBy: { von: "asc" } });
  return Promise.all(liste.map(async (a) => ({ ...a, offen: (await betroffeneTermine(db, a.id)).length })));
}

export async function offeneTermineGesamt(db: Db, jetzt: Date) {
  return (await kommendeAbwesenheiten(db, jetzt)).reduce((summe, a) => summe + a.offen, 0);
}

export async function loescheAbwesenheit(db: Db, id: number) {
  const { count } = await db.abwesenheit.deleteMany({ where: { id } });
  return count === 1;
}

/** Zeitraum lesbar, z. B. „Mo., 23.11. bis Fr., 27.11.“ oder „Mo., 23.11., 14:00–18:00 Uhr“ */
export function zeitraumText(von: Date, bis: Date) {
  const ganzerTag = formatUhrzeit(von) === "00:00" && formatUhrzeit(bis) === "00:00";
  if (ganzerTag) {
    const letzter = new Date(bis.getTime() - 1);
    return berlinTag(von) === berlinTag(letzter) ? formatTagKurz(von) : `${formatTagKurz(von)} bis ${formatTagKurz(letzter)}`;
  }
  return berlinTag(von) === berlinTag(bis)
    ? `${formatTagKurz(von)}, ${formatUhrzeit(von)}–${formatUhrzeit(bis)} Uhr`
    : `${formatTagKurz(von)} ${formatUhrzeit(von)} bis ${formatTagKurz(bis)} ${formatUhrzeit(bis)} Uhr`;
}

