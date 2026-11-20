import { beforeEach, describe, expect, it } from "vitest";
import { identifiziere } from "@/lib/buchung";
import { db, testdatenAnlegen } from "./testdaten";

describe("BR1: Online buchen nur mit Geburtsdatum und Versicherten- bzw. Patientennummer", () => {
  beforeEach(async () => {
    await testdatenAnlegen();
  });

  it("lässt Bestandspatient:innen mit Versichertennummer herein", async () => {
    expect(await identifiziere(db, { geburtsdatum: "1980-04-12", nummer: "t000 000 001" })).toEqual({ ok: true, patientId: 1001 });
  });

  it("lässt Privatversicherte mit Patientennummer herein", async () => {
    expect(await identifiziere(db, { geburtsdatum: "1975-09-30", nummer: "1002" })).toEqual({ ok: true, patientId: 1002 });
  });

  it("lehnt ein falsches Geburtsdatum ab", async () => {
    expect(await identifiziere(db, { geburtsdatum: "1980-04-13", nummer: "T000000001" })).toEqual({ ok: false, grund: "nicht_gefunden" });
  });

  it("lehnt Neupatient:innen ab, die noch nicht angelegt sind", async () => {
    expect(await identifiziere(db, { geburtsdatum: "2000-01-01", nummer: "T999999999" })).toEqual({ ok: false, grund: "nicht_gefunden" });
  });

  it("lehnt gesperrte Patient:innen ab", async () => {
    expect(await identifiziere(db, { geburtsdatum: "1990-01-01", nummer: "T000000003" })).toEqual({ ok: false, grund: "gesperrt" });
  });

  it("lehnt unvollständige Eingaben ab", async () => {
    expect(await identifiziere(db, { geburtsdatum: "1980-02-30", nummer: "T000000001" })).toEqual({ ok: false, grund: "eingabe" });
    expect(await identifiziere(db, { geburtsdatum: "1980-04-12", nummer: "  " })).toEqual({ ok: false, grund: "eingabe" });
  });
});
