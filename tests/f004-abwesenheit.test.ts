import { beforeEach, describe, expect, it } from "vitest";
import { betroffeneTermine, kommendeAbwesenheiten, legeAbwesenheitAn, loescheAbwesenheit, offeneTermineGesamt } from "@/lib/abwesenheit";
import { freieSlots, reserviere } from "@/lib/buchung";
import { buchePraxis, naechsteFreieTermine } from "@/lib/praxis";
import { berlinZeitpunkt, formatUhrzeit } from "@/lib/zeit";
import { db, testdatenAnlegen } from "./testdaten";

const MONTAG = "2026-11-23";
const JETZT = berlinZeitpunkt("2026-11-16", "12:00");
const um = (uhrzeit: string) => berlinZeitpunkt(MONTAG, uhrzeit);

describe("F-004: Abwesenheiten", () => {
  let daten: Awaited<ReturnType<typeof testdatenAnlegen>>;
  let termin8: number;
  let termin830: number;
  beforeEach(async () => {
    daten = await testdatenAnlegen();
    const mk = (patientId: number, arztId: number, uhrzeit: string) =>
      db.termin.create({ data: { patientId, arztId, terminartId: daten.arten.beratung.id, beginn: um(uhrzeit), quelle: "online" } });
    termin8 = (await mk(daten.anna.id, daten.demir.id, "08:00")).id;
    termin830 = (await mk(daten.privat.id, daten.demir.id, "08:30")).id;
    await mk(daten.anna.id, daten.schaefer.id, "10:00");
  });

  const demirMontag = (extra: Partial<Parameters<typeof legeAbwesenheitAn>[1]> = {}) =>
    legeAbwesenheitAn(db, { arztId: daten.demir.id, vonTag: MONTAG, bisTag: MONTAG, grund: "Fortbildung", ...extra }, JETZT);

  const zeiten = async (arztId: number) =>
    ((await freieSlots(db, { arztId, terminartId: daten.arten.beratung.id, abTag: MONTAG, tage: 1, jetzt: JETZT, modus: "praxis" })) ?? [])[0].slots.map(formatUhrzeit);

  it("sperrt während der Abwesenheit alle freien Zeiten der Ärzt:in, online und am Telefon", async () => {
    expect(await zeiten(daten.demir.id)).not.toHaveLength(0);
    expect((await demirMontag()).ok).toBe(true);
    expect(await zeiten(daten.demir.id)).toEqual([]);
    expect(await zeiten(daten.schaefer.id)).not.toHaveLength(0);
    const r = await reserviere(db, { patientId: daten.anna.id, arztId: daten.demir.id, terminartId: daten.arten.beratung.id, beginn: um("08:15"), jetzt: JETZT });
    expect(r).toEqual({ ok: false, grund: "belegt" });
  });

  it("sperrt bei einer Abwesenheit der ganzen Praxis alle Ärzt:innen", async () => {
    await legeAbwesenheitAn(db, { arztId: null, vonTag: MONTAG, bisTag: MONTAG, grund: "Betriebsurlaub" }, JETZT);
    expect(await zeiten(daten.demir.id)).toEqual([]);
    expect(await zeiten(daten.schaefer.id)).toEqual([]);
    const v = await naechsteFreieTermine(db, { terminartId: daten.arten.beratung.id, hausarztId: null, jetzt: JETZT, tage: 10 });
    expect(v.some((x) => x.beginn >= um("00:00") && x.beginn < berlinZeitpunkt("2026-11-24", "00:00"))).toBe(false);
  });

  it("sperrt bei einer Uhrzeit nur diesen Teil des Tages", async () => {
    await demirMontag({ vonUhrzeit: "08:00", bisUhrzeit: "08:45" });
    expect((await zeiten(daten.demir.id))[0]).toBe("08:45");
  });

  it("listet nur die betroffenen gebuchten Termine und bucht nichts automatisch um", async () => {
    const r = await demirMontag();
    if (!r.ok) throw new Error("Anlage fehlgeschlagen");
    expect((await betroffeneTermine(db, r.id)).map((t) => t.id)).toEqual([termin8, termin830]);
    expect(await db.termin.count({ where: { status: "gebucht" } })).toBe(3);
    expect(await offeneTermineGesamt(db, JETZT)).toBe(2);
  });

  it("sagt beim Umbuchen den alten Termin ab, sobald der neue gebucht ist", async () => {
    const r = await demirMontag();
    if (!r.ok) throw new Error("Anlage fehlgeschlagen");
    const neu = await buchePraxis(db, {
      patientId: daten.anna.id, arztId: daten.schaefer.id, terminartId: daten.arten.beratung.id, beginn: um("10:15"), jetzt: JETZT, ersetztTerminId: termin8,
    });
    expect(neu.ok).toBe(true);
    expect((await db.termin.findUnique({ where: { id: termin8 } }))?.status).toBe("abgesagt");
    expect((await betroffeneTermine(db, r.id)).map((t) => t.id)).toEqual([termin830]);
  });

  it("lässt den alten Termin stehen, wenn die neue Buchung scheitert", async () => {
    await demirMontag();
    const neu = await buchePraxis(db, {
      patientId: daten.anna.id, arztId: daten.schaefer.id, terminartId: daten.arten.beratung.id, beginn: um("10:00"), jetzt: JETZT, ersetztTerminId: termin8,
    });
    expect(neu.ok).toBe(false);
    expect((await db.termin.findUnique({ where: { id: termin8 } }))?.status).toBe("gebucht");
  });

  it("prüft die Eingaben", async () => {
    const r = await demirMontag({ bisTag: "2026-11-22", grund: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fehler.grund).toBeDefined();
    const z = await demirMontag({ bisTag: "2026-11-22" });
    expect(z).toEqual({ ok: false, fehler: { zeitraum: "Das Ende muss nach dem Beginn liegen." } });
    expect((await legeAbwesenheitAn(db, { arztId: daten.demir.id, vonTag: "2026-11-02", bisTag: "2026-11-03", grund: "Urlaub" }, JETZT)).ok).toBe(false);
  });

  it("gibt die Zeiten nach dem Löschen wieder frei", async () => {
    const r = await demirMontag();
    if (!r.ok) throw new Error("Anlage fehlgeschlagen");
    expect(await kommendeAbwesenheiten(db, JETZT)).toHaveLength(1);
    expect(await loescheAbwesenheit(db, r.id)).toBe(true);
    expect(await zeiten(daten.demir.id)).not.toHaveLength(0);
  });
});
