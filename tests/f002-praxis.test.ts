import { beforeEach, describe, expect, it } from "vitest";
import { bucheReservierung, identifiziere, reserviere } from "@/lib/buchung";
import { buchePraxis, legePatientAn, naechsteFreieTermine, sageTerminAb, suchePatienten, tagesKennzahlen } from "@/lib/praxis";
import { berlinZeitpunkt, formatUhrzeit, plusMinuten } from "@/lib/zeit";
import { db, testdatenAnlegen } from "./testdaten";

const MONTAG = "2026-11-23";
const JETZT = berlinZeitpunkt("2026-11-16", "12:00");
const um = (uhrzeit: string) => berlinZeitpunkt(MONTAG, uhrzeit);

describe("F-002: MFA legt Patient:innen an (BR1)", () => {
  let daten: Awaited<ReturnType<typeof testdatenAnlegen>>;
  beforeEach(async () => {
    daten = await testdatenAnlegen();
  });

  it("legt eine Neupatientin an, die danach online buchen darf", async () => {
    expect(await identifiziere(db, { geburtsdatum: "1999-05-05", nummer: "T123456789" })).toEqual({ ok: false, grund: "nicht_gefunden" });
    const r = await legePatientAn(db, {
      name: "Nina Neu",
      geburtsdatum: "1999-05-05",
      versichertennummer: "t123 456 789",
      hausarztId: daten.demir.id,
      smsEinwilligung: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(await identifiziere(db, { geburtsdatum: "1999-05-05", nummer: "T123456789" })).toEqual({ ok: true, patientId: r.patientId });
    expect((await db.patient.findUnique({ where: { id: r.patientId } }))?.smsEinwilligung).toBe(true);
  });

  it("prüft die Eingaben beim Anlegen", async () => {
    const r = await legePatientAn(db, { name: "X", geburtsdatum: "2099-01-01", versichertennummer: "T000000001", smsEinwilligung: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.fehler).sort()).toEqual(["geburtsdatum", "name", "versichertennummer"]);
  });

  it("findet Patient:innen über Name, Geburtsdatum oder Nummer", async () => {
    expect((await suchePatienten(db, "Testfrau")).map((p) => p.id)).toEqual([1001]);
    expect((await suchePatienten(db, "30.09.1975")).map((p) => p.id)).toEqual([1002]);
    expect((await suchePatienten(db, "1003")).map((p) => p.id)).toEqual([1003]);
  });
});

describe("F-002: MFA bucht telefonisch (BR2, ohne Doppelbuchung)", () => {
  let daten: Awaited<ReturnType<typeof testdatenAnlegen>>;
  beforeEach(async () => {
    daten = await testdatenAnlegen();
  });

  const buche = (terminartId: number, uhrzeit: string, patientId = daten.anna.id, jetzt = JETZT) =>
    buchePraxis(db, { patientId, arztId: daten.demir.id, terminartId, beginn: um(uhrzeit), jetzt });

  it("darf auch Terminarten buchen, die online gesperrt sind", async () => {
    const r = await buche(daten.arten.blutabnahme.id, "08:00");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((await db.termin.findUnique({ where: { id: r.terminId } }))?.quelle).toBe("telefon");
  });

  it("vergibt die Akutsprechstunde nur im Akutblock", async () => {
    expect((await buche(daten.arten.akut.id, "09:00")).ok).toBe(true);
    expect(await buche(daten.arten.akut.id, "08:00")).toEqual({ ok: false, grund: "belegt" });
    expect(await buche(daten.arten.impfung.id, "09:10")).toEqual({ ok: false, grund: "belegt" });
  });

  it("darf auch gesperrte Patient:innen telefonisch einbuchen", async () => {
    expect((await buche(daten.arten.beratung.id, "08:00", daten.gesperrt.id)).ok).toBe(true);
  });

  it("verhindert eine Doppelbuchung", async () => {
    expect((await buche(daten.arten.vorsorge.id, "08:00")).ok).toBe(true);
    expect(await buche(daten.arten.beratung.id, "08:15", daten.privat.id)).toEqual({ ok: false, grund: "belegt" });
  });

  it("respektiert laufende Online-Reservierungen und umgekehrt", async () => {
    const online = await reserviere(db, { patientId: daten.privat.id, arztId: daten.demir.id, terminartId: daten.arten.vorsorge.id, beginn: um("08:00"), jetzt: JETZT });
    expect(online.ok).toBe(true);
    expect(await buche(daten.arten.beratung.id, "08:00")).toEqual({ ok: false, grund: "belegt" });
    expect((await buche(daten.arten.beratung.id, "08:00", daten.anna.id, plusMinuten(JETZT, 3))).ok).toBe(true);
    if (online.ok) {
      expect(await bucheReservierung(db, { reservierungId: online.reservierungId, patientId: daten.privat.id, jetzt: plusMinuten(JETZT, 1) })).toEqual({
        ok: false,
        grund: "belegt",
      });
    }
  });

  it("gibt nach einer Absage die Zeit wieder frei", async () => {
    const r = await buche(daten.arten.vorsorge.id, "08:00");
    if (!r.ok) throw new Error("Buchung fehlgeschlagen");
    expect(await sageTerminAb(db, r.terminId)).toBe(true);
    expect(await sageTerminAb(db, r.terminId)).toBe(false);
    expect((await buche(daten.arten.vorsorge.id, "08:00", daten.privat.id)).ok).toBe(true);
  });
});

describe("F-002: Hilfen fürs Telefonat", () => {
  let daten: Awaited<ReturnType<typeof testdatenAnlegen>>;
  beforeEach(async () => {
    daten = await testdatenAnlegen();
  });

  it("schlägt die nächsten freien Termine vor, die Hausärzt:in zuerst", async () => {
    const v = await naechsteFreieTermine(db, { terminartId: daten.arten.beratung.id, hausarztId: daten.schaefer.id, jetzt: JETZT, tage: 10 });
    expect(v).toHaveLength(3);
    expect(v[0]).toMatchObject({ arztId: daten.schaefer.id, istHausarzt: true });
    expect(formatUhrzeit(v[0].beginn)).toBe("10:00");
    expect(v.slice(1).map((x) => formatUhrzeit(x.beginn))).toEqual(["08:00", "08:15"]);
  });

  it("zählt, wie viele Termine heute online und telefonisch gebucht wurden", async () => {
    await buchePraxis(db, { patientId: daten.anna.id, arztId: daten.demir.id, terminartId: daten.arten.beratung.id, beginn: um("08:00"), jetzt: JETZT });
    const r = await reserviere(db, { patientId: daten.privat.id, arztId: daten.demir.id, terminartId: daten.arten.beratung.id, beginn: um("08:15"), jetzt: JETZT });
    if (r.ok) await bucheReservierung(db, { reservierungId: r.reservierungId, patientId: daten.privat.id, jetzt: JETZT });
    await db.termin.updateMany({ data: { erstelltAm: JETZT } });
    expect(await tagesKennzahlen(db, JETZT)).toEqual({ online: 1, telefon: 1, anteilOnline: 50, onlineAbgesagt: 0 });
  });
});
