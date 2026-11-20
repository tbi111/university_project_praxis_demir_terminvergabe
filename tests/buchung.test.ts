import { beforeEach, describe, expect, it } from "vitest";
import { bucheReservierung, freieSlots, reserviere } from "@/lib/buchung";
import { berlinZeitpunkt, plusMinuten } from "@/lib/zeit";
import { db, testdatenAnlegen } from "./testdaten";

const MONTAG = "2026-11-23";
const JETZT = berlinZeitpunkt("2026-11-16", "12:00");
const ACHT_UHR = berlinZeitpunkt(MONTAG, "08:00");

describe("Reservieren und Buchen ohne Doppelbuchung", () => {
  let daten: Awaited<ReturnType<typeof testdatenAnlegen>>;
  beforeEach(async () => {
    daten = await testdatenAnlegen();
  });

  const reserviereVorsorge = (patientId: number, jetzt = JETZT) =>
    reserviere(db, { patientId, arztId: daten.demir.id, terminartId: daten.arten.vorsorge.id, beginn: ACHT_UHR, jetzt });

  it("bucht einen reservierten Termin", async () => {
    const r = await reserviereVorsorge(daten.anna.id);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b = await bucheReservierung(db, { reservierungId: r.reservierungId, patientId: daten.anna.id, jetzt: JETZT });
    expect(b.ok).toBe(true);
    expect(await db.termin.count({ where: { arztId: daten.demir.id, beginn: ACHT_UHR, status: "gebucht" } })).toBe(1);
  });

  it("blockiert einen reservierten Slot für andere", async () => {
    expect((await reserviereVorsorge(daten.anna.id)).ok).toBe(true);
    expect(await reserviereVorsorge(daten.privat.id)).toEqual({ ok: false, grund: "belegt" });
    const [montag] = (await freieSlots(db, { arztId: daten.demir.id, terminartId: daten.arten.beratung.id, abTag: MONTAG, tage: 1, jetzt: JETZT }))!;
    expect(montag.slots.some((s) => s < plusMinuten(ACHT_UHR, 30))).toBe(false);
  });

  it("verhindert eine Doppelbuchung desselben Slots", async () => {
    const r = await reserviereVorsorge(daten.anna.id);
    if (!r.ok) throw new Error("Reservierung fehlgeschlagen");
    await bucheReservierung(db, { reservierungId: r.reservierungId, patientId: daten.anna.id, jetzt: JETZT });
    expect(await reserviereVorsorge(daten.privat.id)).toEqual({ ok: false, grund: "belegt" });
  });

  it("gibt den Slot nach zwei Minuten wieder frei", async () => {
    const r = await reserviereVorsorge(daten.anna.id);
    if (!r.ok) throw new Error("Reservierung fehlgeschlagen");
    const spaeter = plusMinuten(JETZT, 3);
    expect(await bucheReservierung(db, { reservierungId: r.reservierungId, patientId: daten.anna.id, jetzt: spaeter })).toEqual({
      ok: false,
      grund: "abgelaufen",
    });
    expect((await reserviereVorsorge(daten.privat.id, spaeter)).ok).toBe(true);
  });

  it("lässt nur die eigene Reservierung buchen", async () => {
    const r = await reserviereVorsorge(daten.anna.id);
    if (!r.ok) throw new Error("Reservierung fehlgeschlagen");
    expect(await bucheReservierung(db, { reservierungId: r.reservierungId, patientId: daten.privat.id, jetzt: JETZT })).toEqual({
      ok: false,
      grund: "nicht_gefunden",
    });
  });

  it("gibt einen abgesagten Termin wieder frei", async () => {
    await db.termin.create({
      data: { patientId: daten.privat.id, arztId: daten.demir.id, terminartId: daten.arten.vorsorge.id, beginn: ACHT_UHR, status: "abgesagt" },
    });
    expect((await reserviereVorsorge(daten.anna.id)).ok).toBe(true);
  });
});
