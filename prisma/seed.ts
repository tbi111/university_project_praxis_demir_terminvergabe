// Testdaten für die Praxis Demir & Kollegen. Alle Personen und Nummern sind erfunden.
// Start: npx prisma db seed
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { berlinTag, berlinZeitpunkt, plusMinuten, tagPlus, wochentag } from "../src/lib/zeit";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

async function main() {
  await db.reservierung.deleteMany();
  await db.termin.deleteMany();
  await db.sprechzeit.deleteMany();
  await db.arztTerminart.deleteMany();
  await db.patient.deleteMany();
  await db.arzt.deleteMany();
  await db.terminart.deleteMany();

  // Terminarten laut Kundin (Nachr. 3, 4). Vorsorge mit 30 Minuten (Annahme, Nachr. 3 offen).
  const arten = [
    { bezeichnung: "Beratung", dauerMinuten: 15, onlineBuchbar: true },
    { bezeichnung: "Vorsorge", dauerMinuten: 30, onlineBuchbar: true },
    { bezeichnung: "Impfung", dauerMinuten: 10, onlineBuchbar: true },
    { bezeichnung: "Blutabnahme", dauerMinuten: 10, onlineBuchbar: false },
    { bezeichnung: "Rezept-Abholung", dauerMinuten: 5, onlineBuchbar: false },
    { bezeichnung: "Akutsprechstunde", dauerMinuten: 10, onlineBuchbar: false },
    { bezeichnung: "Erstgespräch", dauerMinuten: 30, onlineBuchbar: false },
  ];
  const terminart: Record<string, number> = {};
  for (const a of arten) terminart[a.bezeichnung] = (await db.terminart.create({ data: a })).id;

  const demir = await db.arzt.create({ data: { name: "Demir", titel: "Dr." } });
  const schaefer = await db.arzt.create({ data: { name: "Schäfer", titel: "Dr." } });
  const yilmaz = await db.arzt.create({ data: { name: "Yilmaz", titel: "Dr." } });

  // Impfungen macht nur Dr. Demir (Nachr. 3)
  for (const [bezeichnung, id] of Object.entries(terminart)) {
    await db.arztTerminart.create({ data: { arztId: demir.id, terminartId: id } });
    if (bezeichnung !== "Impfung") {
      await db.arztTerminart.create({ data: { arztId: schaefer.id, terminartId: id } });
      await db.arztTerminart.create({ data: { arztId: yilmaz.id, terminartId: id } });
    }
  }

  // Wochenpläne: Dr. Demir nach Nachr. 18, Dr. Schäfer und Dr. Yilmaz erfunden (Nachr. 18 offen).
  // Pro Tag acht Akutslots für die Praxis: vier vormittags, vier nachmittags (BR2).
  type Block = [arztId: number, wochentag: number, beginn: string, ende: string, akut?: boolean];
  const bloecke: Block[] = [];
  for (const tag of [1, 2, 3, 4, 5]) {
    bloecke.push([demir.id, tag, "08:00", "11:00"], [demir.id, tag, "11:00", "11:40", true]);
    if (tag !== 3) bloecke.push([demir.id, tag, "14:00", "16:00"]);
  }
  for (const tag of [1, 2, 4, 5]) {
    bloecke.push([schaefer.id, tag, "09:00", "12:00"], [schaefer.id, tag, "15:00", "18:00"]);
  }
  bloecke.push([schaefer.id, 3, "09:00", "12:00"]);
  for (const tag of [1, 3, 5]) bloecke.push([yilmaz.id, tag, "08:00", "12:00"]);
  for (const tag of [2, 4]) bloecke.push([yilmaz.id, tag, "13:00", "18:00"]);
  for (const tag of [1, 2, 3, 4, 5]) bloecke.push([yilmaz.id, tag, "16:00", "16:40", true]);
  for (const [arztId, wochentag, beginn, ende, akut] of bloecke) {
    await db.sprechzeit.create({ data: { arztId, wochentag, beginn, ende, akut: akut ?? false } });
  }

  const patienten = [
    { id: 1001, name: "Anna Beispiel", geburtsdatum: "1980-04-12", versichertennummer: "T000000001", hausarztId: demir.id },
    { id: 1002, name: "Paul Muster", geburtsdatum: "1975-09-30", versichertennummer: null, hausarztId: schaefer.id },
    { id: 1003, name: "Gerd Probe", geburtsdatum: "1990-01-01", versichertennummer: "T000000003", hausarztId: demir.id, onlineGesperrt: true },
    { id: 1004, name: "Lena Fiktiv", geburtsdatum: "1992-07-08", versichertennummer: "T000000004", hausarztId: yilmaz.id },
    { id: 1005, name: "Mehmet Erfunden", geburtsdatum: "1968-11-02", versichertennummer: "T000000005", hausarztId: demir.id },
    { id: 1006, name: "Sophie Platzhalter", geburtsdatum: "2001-03-15", versichertennummer: "T000000006", hausarztId: schaefer.id },
    { id: 1007, name: "Jonas Testmann", geburtsdatum: "1985-12-24", versichertennummer: null, hausarztId: yilmaz.id },
    { id: 1008, name: "Emine Demo", geburtsdatum: "1959-05-20", versichertennummer: "T000000008", hausarztId: demir.id },
    { id: 1009, name: "Karl Ausgedacht", geburtsdatum: "1949-02-11", versichertennummer: "T000000009", hausarztId: schaefer.id },
    { id: 1010, name: "Mia Vorlage", geburtsdatum: "2010-09-01", versichertennummer: "T000000010", hausarztId: yilmaz.id },
  ];
  for (const p of patienten) await db.patient.create({ data: { ...p, smsEinwilligung: p.id % 2 === 1 } });

  // Beispieltermine für die nächsten fünf Werktage, damit der Kalender nicht leer ist.
  // Ein Teil ist "heute" gebucht, damit die Kennzahlen online/telefonisch etwas zeigen.
  const jetzt = new Date();
  const plan: [arztId: number, uhrzeit: string, art: string][] = [
    [demir.id, "08:00", "Vorsorge"], [demir.id, "08:30", "Beratung"], [demir.id, "09:10", "Impfung"], [demir.id, "10:00", "Blutabnahme"],
    [schaefer.id, "09:00", "Beratung"], [schaefer.id, "09:30", "Vorsorge"], [schaefer.id, "15:00", "Erstgespräch"],
    [yilmaz.id, "08:15", "Beratung"], [yilmaz.id, "09:00", "Vorsorge"], [yilmaz.id, "13:30", "Beratung"],
  ];
  let tag = berlinTag(jetzt);
  let werktage = 0;
  let nr = 0;
  while (werktage < 5) {
    tag = tagPlus(tag, 1);
    if (wochentag(tag) > 5) continue;
    werktage++;
    for (const [arztId, uhrzeit, art] of plan) {
      const passt = bloecke.some(([a, w, b, e, akut]) => a === arztId && w === wochentag(tag) && !akut && b <= uhrzeit && uhrzeit < e);
      if (!passt || (nr + werktage) % 3 === 0) {
        nr++;
        continue;
      }
      await db.termin.create({
        data: {
          patientId: patienten[nr % patienten.length].id,
          arztId,
          terminartId: terminart[art],
          beginn: berlinZeitpunkt(tag, uhrzeit),
          quelle: nr % 3 === 1 ? "telefon" : "online",
          erstelltAm: werktage === 1 ? jetzt : plusMinuten(jetzt, -60 * 24 * (nr % 4 + 1)),
        },
      });
      nr++;
    }
    // Anna Beispiel bekommt an den ersten beiden Werktagen je einen Termin, damit "Meine Termine" etwas zeigt.
    // Liegt der erste davon weniger als 24 Stunden in der Zukunft, sieht man dort den Hinweis zur telefonischen Absage.
    if (werktage <= 2) {
      await db.termin.create({
        data: { patientId: 1001, arztId: demir.id, terminartId: terminart["Beratung"], beginn: berlinZeitpunkt(tag, "10:30"), quelle: "online", erstelltAm: plusMinuten(jetzt, -60 * 24 * 3) },
      });
    }
    // Ein heute online abgesagter Termin für die Kennzahl im Praxiskalender
    if (werktage === 3) {
      await db.termin.create({
        data: {
          patientId: 1004, arztId: yilmaz.id, terminartId: terminart["Beratung"], beginn: berlinZeitpunkt(tag, "13:45"),
          quelle: "online", erstelltAm: plusMinuten(jetzt, -60 * 24 * 5), status: "abgesagt", abgesagtAm: jetzt, abgesagtUeber: "online",
        },
      });
    }
  }

  console.log(`Testdaten angelegt: ${arten.length} Terminarten, 3 Ärzt:innen, ${bloecke.length} Sprechzeiten, ${patienten.length} Patient:innen, ${await db.termin.count()} Termine`);
}

main().finally(() => db.$disconnect());
