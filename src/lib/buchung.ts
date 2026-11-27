import type { Db } from "./prisma";
import { berechneFreieSlots, ueberschneidet, type Belegung, type Tagesslots } from "./slots";
import { berlinTag, istGueltigerTag, plusMinuten, tagPlus } from "./zeit";

export const RESERVIERUNG_MINUTEN = 2;
/** Diese Terminart gehört in die Akutblöcke und wird nur telefonisch vergeben (BR2). */
export const AKUTSPRECHSTUNDE = "Akutsprechstunde";

export type Modus = "online" | "praxis";
export const BUCHBAR_TAGE_IM_VORAUS = 56;

// ---------- BR1: Identifikation ----------

export type Anmeldeergebnis =
  | { ok: true; patientId: number }
  | { ok: false; grund: "eingabe" | "nicht_gefunden" | "gesperrt" };

export function normalisiereNummer(nummer: string): string {
  return nummer.replace(/\s+/g, "").toUpperCase();
}

/**
 * Online buchen dürfen nur Bestandspatient:innen mit Geburtsdatum und
 * Versichertennummer bzw. Patientennummer (BR1). Gesperrte Patient:innen nicht.
 */
export async function identifiziere(db: Db, eingabe: { geburtsdatum: string; nummer: string }): Promise<Anmeldeergebnis> {
  const geburtsdatum = eingabe.geburtsdatum.trim();
  const nummer = normalisiereNummer(eingabe.nummer);
  if (!istGueltigerTag(geburtsdatum) || nummer.length === 0) return { ok: false, grund: "eingabe" };

  const patientennummer = /^\d+$/.test(nummer) ? Number(nummer) : null;
  const patient = await db.patient.findFirst({
    where: {
      geburtsdatum,
      OR: [{ versichertennummer: nummer }, ...(patientennummer !== null ? [{ id: patientennummer }] : [])],
    },
  });

  if (!patient) return { ok: false, grund: "nicht_gefunden" };
  if (patient.onlineGesperrt) return { ok: false, grund: "gesperrt" };
  return { ok: true, patientId: patient.id };
}

export async function ladeOnlinePatient(db: Db, patientId: number) {
  const patient = await db.patient.findUnique({ where: { id: patientId }, include: { hausarzt: true } });
  if (!patient || patient.onlineGesperrt) return null;
  return patient;
}

// ---------- BR2: was online buchbar ist ----------

export function onlineTerminarten(db: Db) {
  return db.terminart.findMany({ where: { onlineBuchbar: true }, orderBy: { bezeichnung: "asc" } });
}

/** Ärzt:innen, die die Terminart anbieten. Die Hausärzt:in steht oben. */
export async function aerzteFuerTerminart(db: Db, terminartId: number, hausarztId: number | null) {
  const aerzte = await db.arzt.findMany({
    where: { aktiv: true, terminarten: { some: { terminartId } } },
    orderBy: { name: "asc" },
  });
  return aerzte.sort((a, b) => Number(b.id === hausarztId) - Number(a.id === hausarztId));
}

export async function ladeAngebot(db: Db, arztId: number, terminartId: number, modus: Modus = "online") {
  const terminart = await db.terminart.findUnique({ where: { id: terminartId } });
  if (!terminart || (modus === "online" && !terminart.onlineBuchbar)) return null;
  const angebot = await db.arztTerminart.findUnique({ where: { arztId_terminartId: { arztId, terminartId } } });
  const arzt = await db.arzt.findUnique({ where: { id: arztId } });
  if (!angebot || !arzt?.aktiv) return null;
  return { terminart, arzt };
}

export async function belegungen(db: Db, arztId: number, von: Date, bis: Date, jetzt: Date, ohneReservierungVon?: number): Promise<Belegung[]> {
  const termine = await db.termin.findMany({
    where: { arztId, status: { not: "abgesagt" }, beginn: { gte: plusMinuten(von, -120), lt: bis } },
    include: { terminart: true },
  });
  const reservierungen = await db.reservierung.findMany({
    where: {
      arztId,
      ablaufAm: { gt: jetzt },
      beginn: { lt: bis },
      ende: { gt: von },
      ...(ohneReservierungVon !== undefined ? { patientId: { not: ohneReservierungVon } } : {}),
    },
  });
  // Abwesenheiten der Ärzt:in oder der ganzen Praxis sperren die Zeit ebenfalls (F-004)
  const abwesenheiten = await db.abwesenheit.findMany({
    where: { OR: [{ arztId }, { arztId: null }], von: { lt: bis }, bis: { gt: von } },
  });
  return [
    ...termine.map((t) => ({ beginn: t.beginn, ende: plusMinuten(t.beginn, t.terminart.dauerMinuten) })),
    ...reservierungen.map((r) => ({ beginn: r.beginn, ende: r.ende })),
    ...abwesenheiten.map((a) => ({ beginn: a.von, ende: a.bis })),
  ];
}

export async function freieSlots(
  db: Db,
  params: { arztId: number; terminartId: number; abTag: string; tage: number; jetzt: Date; patientId?: number; modus?: Modus },
): Promise<Tagesslots[] | null> {
  const angebot = await ladeAngebot(db, params.arztId, params.terminartId, params.modus);
  if (!angebot) return null;
  const heute = berlinTag(params.jetzt);
  const letzterTag = tagPlus(heute, BUCHBAR_TAGE_IM_VORAUS);
  const abTag = params.abTag < heute ? heute : params.abTag;
  const tage = Math.max(0, Math.min(params.tage, Math.round((Date.parse(letzterTag) - Date.parse(abTag)) / 86400000)));

  const sprechzeiten = await db.sprechzeit.findMany({ where: { arztId: params.arztId } });
  const von = new Date(Date.parse(abTag) - 86400000);
  const bis = new Date(Date.parse(tagPlus(abTag, tage)) + 86400000);
  return berechneFreieSlots({
    sprechzeiten,
    belegungen: await belegungen(db, params.arztId, von, bis, params.jetzt, params.patientId),
    dauerMinuten: angebot.terminart.dauerMinuten,
    abTag,
    tage,
    jetzt: params.jetzt,
    bloecke: angebot.terminart.bezeichnung === AKUTSPRECHSTUNDE ? "akut" : "normal",
  });
}

// ---------- Reservieren und Buchen ----------

export type Reservierungsergebnis = { ok: true; reservierungId: string } | { ok: false; grund: "nicht_buchbar" | "belegt" };

export async function reserviere(
  db: Db,
  params: { patientId: number; arztId: number; terminartId: number; beginn: Date; jetzt: Date },
): Promise<Reservierungsergebnis> {
  const { patientId, arztId, terminartId, beginn, jetzt } = params;
  const patient = await ladeOnlinePatient(db, patientId);
  const angebot = await ladeAngebot(db, arztId, terminartId);
  if (!patient || !angebot) return { ok: false, grund: "nicht_buchbar" };

  const tag = berlinTag(beginn);
  const frei = await freieSlots(db, { arztId, terminartId, abTag: tag, tage: 1, jetzt, patientId });
  const passtInRaster = frei?.[0]?.tag === tag && frei[0].slots.some((s) => s.getTime() === beginn.getTime());
  if (!passtInRaster) return { ok: false, grund: "belegt" };

  const ende = plusMinuten(beginn, angebot.terminart.dauerMinuten);
  return db.$transaction(async (tx) => {
    await tx.reservierung.deleteMany({ where: { OR: [{ patientId }, { ablaufAm: { lte: jetzt } }] } });
    const konflikte = await belegungen(tx as unknown as Db, arztId, plusMinuten(beginn, -1), ende, jetzt);
    if (konflikte.some((b) => ueberschneidet({ beginn, ende }, b))) return { ok: false as const, grund: "belegt" as const };
    const r = await tx.reservierung.create({
      data: { patientId, arztId, terminartId, beginn, ende, ablaufAm: plusMinuten(jetzt, RESERVIERUNG_MINUTEN) },
    });
    return { ok: true as const, reservierungId: r.id };
  });
}

export type Buchungsergebnis = { ok: true; terminId: number } | { ok: false; grund: "nicht_gefunden" | "abgelaufen" | "belegt" };

export async function bucheReservierung(db: Db, params: { reservierungId: string; patientId: number; jetzt: Date }): Promise<Buchungsergebnis> {
  const { reservierungId, patientId, jetzt } = params;
  return db.$transaction(async (tx) => {
    const r = await tx.reservierung.findUnique({ where: { id: reservierungId } });
    if (!r || r.patientId !== patientId) return { ok: false as const, grund: "nicht_gefunden" as const };
    if (r.ablaufAm <= jetzt) {
      await tx.reservierung.delete({ where: { id: r.id } });
      return { ok: false as const, grund: "abgelaufen" as const };
    }
    const termine = await tx.termin.findMany({
      where: { arztId: r.arztId, status: { not: "abgesagt" }, beginn: { gte: plusMinuten(r.beginn, -120), lt: r.ende } },
      include: { terminart: true },
    });
    const abwesend = await tx.abwesenheit.count({
      where: { OR: [{ arztId: r.arztId }, { arztId: null }], von: { lt: r.ende }, bis: { gt: r.beginn } },
    });
    const belegt =
      abwesend > 0 || termine.some((t) => ueberschneidet(r, { beginn: t.beginn, ende: plusMinuten(t.beginn, t.terminart.dauerMinuten) }));
    if (belegt) return { ok: false as const, grund: "belegt" as const };

    const termin = await tx.termin.create({
      data: { patientId, arztId: r.arztId, terminartId: r.terminartId, beginn: r.beginn, status: "gebucht", quelle: "online" },
    });
    await tx.reservierung.delete({ where: { id: r.id } });
    return { ok: true as const, terminId: termin.id };
  });
}

// ---------- BR3: eigene Termine und Online-Absage ----------

export const ABSAGE_FRIST_STUNDEN = 24;

/** Online abgesagt werden darf nur bis 24 Stunden vor Beginn (BR3). Genau 24 Stunden sind noch erlaubt. */
export function onlineAbsagbar(beginn: Date, jetzt: Date): boolean {
  return beginn.getTime() - jetzt.getTime() >= ABSAGE_FRIST_STUNDEN * 3600000;
}

/** Kommende gebuchte Termine einer Person, egal ob online oder telefonisch gebucht. */
export async function eigeneTermine(db: Db, patientId: number, jetzt: Date) {
  const termine = await db.termin.findMany({
    where: { patientId, status: "gebucht", beginn: { gt: jetzt } },
    include: { arzt: true, terminart: true },
    orderBy: { beginn: "asc" },
  });
  return termine.map((t) => ({ ...t, absagbar: onlineAbsagbar(t.beginn, jetzt) }));
}

export type Absageergebnis = { ok: true } | { ok: false; grund: "nicht_gefunden" | "zu_spaet" | "nicht_gebucht" };

export async function sageOnlineAb(db: Db, params: { terminId: number; patientId: number; jetzt: Date }): Promise<Absageergebnis> {
  const { terminId, patientId, jetzt } = params;
  const termin = await db.termin.findUnique({ where: { id: terminId } });
  if (!termin || termin.patientId !== patientId) return { ok: false, grund: "nicht_gefunden" };
  if (termin.status !== "gebucht") return { ok: false, grund: "nicht_gebucht" };
  if (!onlineAbsagbar(termin.beginn, jetzt)) return { ok: false, grund: "zu_spaet" };
  const { count } = await db.termin.updateMany({
    where: { id: terminId, patientId, status: "gebucht" },
    data: { status: "abgesagt", abgesagtAm: jetzt, abgesagtUeber: "online" },
  });
  return count === 1 ? { ok: true } : { ok: false, grund: "nicht_gebucht" };
}
