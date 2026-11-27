import type { Db } from "./prisma";
import { AKUTSPRECHSTUNDE, belegungen, freieSlots, ladeAngebot, normalisiereNummer } from "./buchung";
import { ueberschneidet } from "./slots";
import { berlinTag, berlinZeitpunkt, istGueltigerTag, plusMinuten, tagPlus, wochentag } from "./zeit";

// ---------- Patient:innen suchen und anlegen (BR1) ----------

export async function suchePatienten(db: Db, suche: string) {
  const q = suche.trim();
  if (q.length < 2) return [];
  const datum = q.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const iso = datum ? `${datum[3]}-${datum[2].padStart(2, "0")}-${datum[1].padStart(2, "0")}` : q;
  const nummer = normalisiereNummer(q);
  return db.patient.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        ...(istGueltigerTag(iso) ? [{ geburtsdatum: iso }] : []),
        ...(/^\d+$/.test(nummer) ? [{ id: Number(nummer) }] : []),
        { versichertennummer: nummer },
      ],
    },
    include: { hausarzt: true },
    orderBy: { name: "asc" },
    take: 10,
  });
}

export type NeuePatientin = {
  name: string;
  geburtsdatum: string;
  versichertennummer?: string;
  hausarztId?: number | null;
  smsEinwilligung: boolean;
};

export type AnlageErgebnis =
  | { ok: true; patientId: number }
  | { ok: false; fehler: Partial<Record<"name" | "geburtsdatum" | "versichertennummer", string>> };

/** Neupatient:innen legt die MFA an. Danach können sie auch online buchen (BR1). */
export async function legePatientAn(db: Db, eingabe: NeuePatientin, jetzt = new Date()): Promise<AnlageErgebnis> {
  const fehler: Partial<Record<"name" | "geburtsdatum" | "versichertennummer", string>> = {};
  const name = eingabe.name.trim();
  const geburtsdatum = eingabe.geburtsdatum.trim();
  const versichertennummer = eingabe.versichertennummer ? normalisiereNummer(eingabe.versichertennummer) : "";

  if (name.length < 2) fehler.name = "Bitte den vollständigen Namen eingeben.";
  if (!istGueltigerTag(geburtsdatum) || geburtsdatum > berlinTag(jetzt)) fehler.geburtsdatum = "Bitte ein gültiges Geburtsdatum eingeben.";
  if (versichertennummer && !/^[A-Z]\d{9}$/.test(versichertennummer)) {
    fehler.versichertennummer = "Die Versichertennummer besteht aus einem Buchstaben und neun Ziffern.";
  } else if (versichertennummer && (await db.patient.findUnique({ where: { versichertennummer } }))) {
    fehler.versichertennummer = "Diese Versichertennummer ist schon vergeben.";
  }
  if (Object.keys(fehler).length > 0) return { ok: false, fehler };

  const patient = await db.patient.create({
    data: {
      name,
      geburtsdatum,
      versichertennummer: versichertennummer || null,
      hausarztId: eingabe.hausarztId ?? null,
      smsEinwilligung: eingabe.smsEinwilligung,
    },
  });
  return { ok: true, patientId: patient.id };
}

// ---------- Telefonisch buchen und absagen ----------

export type PraxisBuchung = { ok: true; terminId: number } | { ok: false; grund: "nicht_buchbar" | "belegt" };

/**
 * Die MFA bucht sofort, ohne Reservierung. Sie kann alle Terminarten vergeben,
 * die Akutsprechstunde aber nur in Akutblöcken (BR2). Laufende Online-Reservierungen
 * sind auch für die MFA belegt.
 */
export async function buchePraxis(
  db: Db,
  params: { patientId: number; arztId: number; terminartId: number; beginn: Date; jetzt: Date; ersetztTerminId?: number },
): Promise<PraxisBuchung> {
  const { patientId, arztId, terminartId, beginn, jetzt, ersetztTerminId } = params;
  const patient = await db.patient.findUnique({ where: { id: patientId } });
  const angebot = await ladeAngebot(db, arztId, terminartId, "praxis");
  if (!patient || !angebot) return { ok: false, grund: "nicht_buchbar" };

  const tag = berlinTag(beginn);
  const frei = await freieSlots(db, { arztId, terminartId, abTag: tag, tage: 1, jetzt, modus: "praxis" });
  if (!frei?.[0]?.slots.some((s) => s.getTime() === beginn.getTime())) return { ok: false, grund: "belegt" };

  const ende = plusMinuten(beginn, angebot.terminart.dauerMinuten);
  return db.$transaction(async (tx) => {
    const konflikte = await belegungen(tx as unknown as Db, arztId, plusMinuten(beginn, -1), ende, jetzt);
    if (konflikte.some((b) => ueberschneidet({ beginn, ende }, b))) return { ok: false as const, grund: "belegt" as const };
    const termin = await tx.termin.create({
      data: { patientId, arztId, terminartId, beginn, status: "gebucht", quelle: "telefon", erstelltAm: jetzt },
    });
    // Umbuchen (F-004): der alte Termin wird erst abgesagt, wenn der neue sicher gebucht ist
    if (ersetztTerminId) {
      await tx.termin.updateMany({
        where: { id: ersetztTerminId, patientId, status: "gebucht" },
        data: { status: "abgesagt", abgesagtAm: jetzt, abgesagtUeber: "telefon" },
      });
    }
    return { ok: true as const, terminId: termin.id };
  });
}

/** MFAs dürfen alle Termine bearbeiten. Abgesagte Termine geben die Zeit wieder frei. */
export async function sageTerminAb(db: Db, terminId: number, jetzt = new Date()): Promise<boolean> {
  const { count } = await db.termin.updateMany({
    where: { id: terminId, status: "gebucht" },
    data: { status: "abgesagt", abgesagtAm: jetzt, abgesagtUeber: "telefon" },
  });
  return count === 1;
}

// ---------- Nächste freie Termine fürs Telefonat ----------

export type Vorschlag = { arztId: number; arztName: string; beginn: Date; istHausarzt: boolean };

/**
 * Die nächsten freien Zeiten über alle Ärzt:innen, die die Terminart anbieten.
 * Der früheste Termin bei der Hausärzt:in steht vorne, danach geht es nach Uhrzeit.
 */
export async function naechsteFreieTermine(
  db: Db,
  params: { terminartId: number; hausarztId: number | null; jetzt: Date; anzahl?: number; tage?: number },
): Promise<Vorschlag[]> {
  const anzahl = params.anzahl ?? 3;
  const aerzte = await db.arzt.findMany({ where: { aktiv: true, terminarten: { some: { terminartId: params.terminartId } } } });
  const alle: Vorschlag[] = [];
  for (const arzt of aerzte) {
    const tage = await freieSlots(db, {
      arztId: arzt.id,
      terminartId: params.terminartId,
      abTag: berlinTag(params.jetzt),
      tage: params.tage ?? 14,
      jetzt: params.jetzt,
      modus: "praxis",
    });
    const slots = (tage ?? []).flatMap((t) => t.slots).slice(0, anzahl);
    for (const beginn of slots) {
      alle.push({ arztId: arzt.id, arztName: `${arzt.titel} ${arzt.name}`, beginn, istHausarzt: arzt.id === params.hausarztId });
    }
  }
  alle.sort((a, b) => a.beginn.getTime() - b.beginn.getTime());
  const hausarzt = alle.find((v) => v.istHausarzt);
  const rest = alle.filter((v) => v !== hausarzt);
  return (hausarzt ? [hausarzt, ...rest] : rest).slice(0, anzahl);
}

// ---------- Tageskalender und Kennzahlen ----------

/** Wie viele Termine heute online und telefonisch gebucht und wie viele online abgesagt wurden (Erfolgsmaß aus Nachr. 11). */
export async function tagesKennzahlen(db: Db, jetzt: Date) {
  const heute = berlinTag(jetzt);
  const von = berlinZeitpunkt(heute, "00:00");
  const bis = berlinZeitpunkt(tagPlus(heute, 1), "00:00");
  const gruppen = await db.termin.groupBy({ by: ["quelle"], where: { erstelltAm: { gte: von, lt: bis } }, _count: true });
  const online = gruppen.find((g) => g.quelle === "online")?._count ?? 0;
  const telefon = gruppen.find((g) => g.quelle === "telefon")?._count ?? 0;
  const summe = online + telefon;
  const onlineAbgesagt = await db.termin.count({ where: { abgesagtUeber: "online", abgesagtAm: { gte: von, lt: bis } } });
  return { online, telefon, anteilOnline: summe === 0 ? null : Math.round((online / summe) * 100), onlineAbgesagt };
}

export async function tagesKalender(db: Db, tag: string, jetzt: Date) {
  const von = berlinZeitpunkt(tag, "00:00");
  const bis = berlinZeitpunkt(tagPlus(tag, 1), "00:00");
  const aerzte = await db.arzt.findMany({
    where: { aktiv: true },
    orderBy: { id: "asc" },
    include: {
      sprechzeiten: { where: { wochentag: wochentag(tag) }, orderBy: { beginn: "asc" } },
      termine: { where: { beginn: { gte: von, lt: bis } }, include: { patient: true, terminart: true }, orderBy: { beginn: "asc" } },
      reservierungen: { where: { beginn: { gte: von, lt: bis }, ablaufAm: { gt: jetzt } }, include: { terminart: true } },
      abwesenheiten: { where: { von: { lt: bis }, bis: { gt: von } } },
    },
  });
  const praxisweit = await db.abwesenheit.findMany({ where: { arztId: null, von: { lt: bis }, bis: { gt: von } } });
  const spalten = aerzte.map((a) => ({
    id: a.id,
    name: `${a.titel} ${a.name}`,
    bloecke: a.sprechzeiten.map((s) => ({ beginn: berlinZeitpunkt(tag, s.beginn), ende: berlinZeitpunkt(tag, s.ende), akut: s.akut })),
    termine: a.termine.map((t) => ({
      id: t.id,
      beginn: t.beginn,
      ende: plusMinuten(t.beginn, t.terminart.dauerMinuten),
      patient: t.patient.name,
      terminart: t.terminart.bezeichnung,
      status: t.status,
      quelle: t.quelle,
    })),
    reservierungen: a.reservierungen.map((r) => ({ id: r.id, beginn: r.beginn, ende: r.ende, terminart: r.terminart.bezeichnung })),
    abwesenheiten: [...a.abwesenheiten, ...praxisweit].map((w) => ({
      id: w.id,
      beginn: w.von < von ? von : w.von,
      ende: w.bis > bis ? bis : w.bis,
      grund: w.grund,
      praxisweit: w.arztId === null,
    })),
  }));
  return { spalten, praxisweit: praxisweit.map((w) => w.grund) };
}

export { AKUTSPRECHSTUNDE };
