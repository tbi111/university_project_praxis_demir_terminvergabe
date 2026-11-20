import { erstellePrisma, type Db } from "@/lib/prisma";

export const db: Db = erstellePrisma("file:./prisma/test.db");

/** Kleiner, fester Datenbestand für die Tests (erfundene Personen). */
export async function testdatenAnlegen() {
  await db.reservierung.deleteMany();
  await db.termin.deleteMany();
  await db.sprechzeit.deleteMany();
  await db.arztTerminart.deleteMany();
  await db.patient.deleteMany();
  await db.arzt.deleteMany();
  await db.terminart.deleteMany();

  const demir = await db.arzt.create({ data: { name: "Demir", titel: "Dr." } });
  const schaefer = await db.arzt.create({ data: { name: "Schäfer", titel: "Dr." } });

  const arten = {
    beratung: await db.terminart.create({ data: { bezeichnung: "Beratung", dauerMinuten: 15, onlineBuchbar: true } }),
    vorsorge: await db.terminart.create({ data: { bezeichnung: "Vorsorge", dauerMinuten: 30, onlineBuchbar: true } }),
    impfung: await db.terminart.create({ data: { bezeichnung: "Impfung", dauerMinuten: 10, onlineBuchbar: true } }),
    blutabnahme: await db.terminart.create({ data: { bezeichnung: "Blutabnahme", dauerMinuten: 10 } }),
    rezept: await db.terminart.create({ data: { bezeichnung: "Rezept-Abholung", dauerMinuten: 5 } }),
    akut: await db.terminart.create({ data: { bezeichnung: "Akutsprechstunde", dauerMinuten: 10 } }),
    erstgespraech: await db.terminart.create({ data: { bezeichnung: "Erstgespräch", dauerMinuten: 30 } }),
  };

  for (const art of Object.values(arten)) {
    await db.arztTerminart.create({ data: { arztId: demir.id, terminartId: art.id } });
    if (art.id !== arten.impfung.id) await db.arztTerminart.create({ data: { arztId: schaefer.id, terminartId: art.id } });
  }

  // Montag: 08:00–09:00 normal, 09:00–09:40 Akut
  await db.sprechzeit.create({ data: { arztId: demir.id, wochentag: 1, beginn: "08:00", ende: "09:00" } });
  await db.sprechzeit.create({ data: { arztId: demir.id, wochentag: 1, beginn: "09:00", ende: "09:40", akut: true } });
  // Montag: Dr. Schäfer erst ab 10:00
  await db.sprechzeit.create({ data: { arztId: schaefer.id, wochentag: 1, beginn: "10:00", ende: "11:00" } });

  const anna = await db.patient.create({
    data: { id: 1001, name: "Anna Testfrau", geburtsdatum: "1980-04-12", versichertennummer: "T000000001", hausarztId: demir.id },
  });
  const privat = await db.patient.create({ data: { id: 1002, name: "Paul Privat", geburtsdatum: "1975-09-30", hausarztId: schaefer.id } });
  const gesperrt = await db.patient.create({
    data: { id: 1003, name: "Gerd Gesperrt", geburtsdatum: "1990-01-01", versichertennummer: "T000000003", onlineGesperrt: true },
  });

  return { demir, schaefer, arten, anna, privat, gesperrt };
}
