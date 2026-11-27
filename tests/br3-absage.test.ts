import { beforeEach, describe, expect, it } from "vitest";
import { eigeneTermine, freieSlots, sageOnlineAb } from "@/lib/buchung";
import { sageTerminAb, tagesKennzahlen } from "@/lib/praxis";
import { berlinZeitpunkt, formatUhrzeit, plusMinuten } from "@/lib/zeit";
import { db, testdatenAnlegen } from "./testdaten";

const MONTAG = "2026-11-23";
const ACHT_UHR = berlinZeitpunkt(MONTAG, "08:00");
const vorher = (stunden: number) => plusMinuten(ACHT_UHR, -stunden * 60);

describe("BR3: Online-Absage nur bis 24 Stunden vorher", () => {
  let daten: Awaited<ReturnType<typeof testdatenAnlegen>>;
  let terminId: number;
  beforeEach(async () => {
    daten = await testdatenAnlegen();
    const t = await db.termin.create({
      data: { patientId: daten.anna.id, arztId: daten.demir.id, terminartId: daten.arten.vorsorge.id, beginn: ACHT_UHR, quelle: "telefon" },
    });
    terminId = t.id;
  });

  const absagen = (jetzt: Date, patientId = daten.anna.id) => sageOnlineAb(db, { terminId, patientId, jetzt });

  it("nimmt eine Absage 25 Stunden vorher an, auch für telefonisch gebuchte Termine", async () => {
    expect(await absagen(vorher(25))).toEqual({ ok: true });
    const t = await db.termin.findUnique({ where: { id: terminId } });
    expect(t).toMatchObject({ status: "abgesagt", abgesagtUeber: "online" });
  });

  it("erlaubt die Absage genau 24 Stunden vorher", async () => {
    expect(await absagen(vorher(24))).toEqual({ ok: true });
  });

  it("lehnt eine Absage 23 Stunden vorher ab", async () => {
    expect(await absagen(vorher(23))).toEqual({ ok: false, grund: "zu_spaet" });
    expect((await db.termin.findUnique({ where: { id: terminId } }))?.status).toBe("gebucht");
  });

  it("lässt nur eigene und noch gebuchte Termine absagen", async () => {
    expect(await absagen(vorher(48), daten.privat.id)).toEqual({ ok: false, grund: "nicht_gefunden" });
    await absagen(vorher(48));
    expect(await absagen(vorher(48))).toEqual({ ok: false, grund: "nicht_gebucht" });
  });

  it("zeigt die eigenen Termine mit dem Hinweis, ob sie online absagbar sind", async () => {
    const frueh = await eigeneTermine(db, daten.anna.id, vorher(48));
    expect(frueh.map((t) => [t.id, t.absagbar])).toEqual([[terminId, true]]);
    const spaet = await eigeneTermine(db, daten.anna.id, vorher(2));
    expect(spaet[0].absagbar).toBe(false);
    expect(await eigeneTermine(db, daten.privat.id, vorher(48))).toEqual([]);
  });

  it("gibt die Zeit nach der Absage wieder für die Online-Buchung frei", async () => {
    const jetzt = vorher(48);
    const slots = async () =>
      (await freieSlots(db, { arztId: daten.demir.id, terminartId: daten.arten.vorsorge.id, abTag: MONTAG, tage: 1, jetzt }))![0].slots.map(formatUhrzeit);
    expect(await slots()).not.toContain("08:00");
    await absagen(jetzt);
    expect(await slots()).toContain("08:00");
  });

  it("lässt die MFA auch kurzfristig absagen", async () => {
    expect(await sageTerminAb(db, terminId, vorher(1))).toBe(true);
    expect((await db.termin.findUnique({ where: { id: terminId } }))?.abgesagtUeber).toBe("telefon");
  });

  it("zählt Online-Absagen in den Tageskennzahlen", async () => {
    const jetzt = vorher(48);
    await absagen(jetzt);
    expect((await tagesKennzahlen(db, jetzt)).onlineAbgesagt).toBe(1);
  });
});
