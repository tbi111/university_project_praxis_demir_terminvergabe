import { beforeEach, describe, expect, it } from "vitest";
import { freieSlots, onlineTerminarten, reserviere } from "@/lib/buchung";
import { berechneFreieSlots } from "@/lib/slots";
import { berlinZeitpunkt, formatUhrzeit } from "@/lib/zeit";
import { db, testdatenAnlegen } from "./testdaten";

// Montag, 23.11.2026; "jetzt" liegt in der Vorwoche
const MONTAG = "2026-11-23";
const JETZT = berlinZeitpunkt("2026-11-16", "12:00");

describe("BR2: Online nur Vorsorge, Beratung und Impfung, Akutslots nie sichtbar", () => {
  let daten: Awaited<ReturnType<typeof testdatenAnlegen>>;
  beforeEach(async () => {
    daten = await testdatenAnlegen();
  });

  it("bietet online genau drei Terminarten an", async () => {
    const arten = await onlineTerminarten(db);
    expect(arten.map((a) => a.bezeichnung).sort()).toEqual(["Beratung", "Impfung", "Vorsorge"]);
  });

  it("zeigt keine Zeiten aus dem Akutblock", async () => {
    const [montag] = (await freieSlots(db, { arztId: daten.demir.id, terminartId: daten.arten.impfung.id, abTag: MONTAG, tage: 1, jetzt: JETZT }))!;
    const zeiten = montag.slots.map(formatUhrzeit);
    expect(zeiten[0]).toBe("08:00");
    expect(zeiten.at(-1)).toBe("08:50");
    expect(zeiten.some((z) => z >= "09:00")).toBe(false);
  });

  it("liefert für nicht online buchbare Terminarten keine Zeiten", async () => {
    expect(await freieSlots(db, { arztId: daten.demir.id, terminartId: daten.arten.akut.id, abTag: MONTAG, tage: 1, jetzt: JETZT })).toBeNull();
    const r = await reserviere(db, {
      patientId: daten.anna.id,
      arztId: daten.demir.id,
      terminartId: daten.arten.rezept.id,
      beginn: berlinZeitpunkt(MONTAG, "08:00"),
      jetzt: JETZT,
    });
    expect(r).toEqual({ ok: false, grund: "nicht_buchbar" });
  });

  it("lässt keine Reservierung im Akutblock zu", async () => {
    const r = await reserviere(db, {
      patientId: daten.anna.id,
      arztId: daten.demir.id,
      terminartId: daten.arten.impfung.id,
      beginn: berlinZeitpunkt(MONTAG, "09:00"),
      jetzt: JETZT,
    });
    expect(r).toEqual({ ok: false, grund: "belegt" });
  });

  it("bietet Impfung nur bei Ärzt:innen an, die impfen", async () => {
    expect(await freieSlots(db, { arztId: daten.schaefer.id, terminartId: daten.arten.impfung.id, abTag: MONTAG, tage: 1, jetzt: JETZT })).toBeNull();
  });
});

describe("Slot-Berechnung", () => {
  it("überspringt belegte Zeiten und die Vergangenheit", () => {
    const [tag] = berechneFreieSlots({
      sprechzeiten: [{ wochentag: 1, beginn: "08:00", ende: "09:00", akut: false }],
      belegungen: [{ beginn: berlinZeitpunkt(MONTAG, "08:30"), ende: berlinZeitpunkt(MONTAG, "08:45") }],
      dauerMinuten: 15,
      abTag: MONTAG,
      tage: 1,
      jetzt: berlinZeitpunkt(MONTAG, "08:05"),
    });
    expect(tag.slots.map(formatUhrzeit)).toEqual(["08:15", "08:45"]);
  });

  it("rechnet über die Zeitumstellung in Europe/Berlin richtig", () => {
    expect(berlinZeitpunkt("2026-03-30", "08:00").toISOString()).toBe("2026-03-30T06:00:00.000Z");
    expect(berlinZeitpunkt("2026-11-23", "08:00").toISOString()).toBe("2026-11-23T07:00:00.000Z");
  });
});
