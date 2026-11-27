# architecture.md

Stand: 27.11.2026, nach F-003.

## Stack

| Teil | Wahl | Version |
|---|---|---|
| Framework | Next.js mit App Router und TypeScript | 16.4 |
| Gestaltung | Tailwind CSS, Icons von lucide | 4.3 |
| Datenbank | SQLite, lokale Datei `prisma/dev.db` | – |
| Datenzugriff | Prisma 7 mit dem Treiber `better-sqlite3` | 7.10 |
| Tests | Vitest mit eigener Testdatenbank `prisma/test.db` | 5.1 |

## Aufbau

Die App ist in drei Schichten aufgeteilt. Die Seiten unter `src/app/` zeigen nur an und nehmen Eingaben entgegen. Die Regeln aus der SPEC stecken in `src/lib/`, damit ich sie ohne Oberfläche testen kann. Die Datenbank erreiche ich nur über Prisma.

- `src/app/buchen/`: der Bereich für Patient:innen. Er enthält den Buchungsablauf in vier Schritten (Anmelden, Terminart und Ärzt:in, Uhrzeit, Bestätigen) und unter `meine-termine` die eigenen Termine mit Online-Absage. Die Formulare rufen Server Actions in `aktionen.ts` auf.
- `src/app/praxis/`: der Bereich für die MFAs mit Tageskalender, Kennzahlen, Patient:innen anlegen, telefonisch buchen und absagen. Ohne Praxis-Anmeldung ist er nicht erreichbar.
- `src/lib/buchung.ts`: Anmeldung (BR1), Online-Angebot (BR2), freie Zeiten, Reservierung, Buchung und die Online-Absage mit 24-Stunden-Frist (BR3).
- `src/lib/praxis.ts`: Suche und Anlage von Patient:innen, telefonische Buchung, Absage, Vorschläge für die nächsten freien Termine und die Tageskennzahlen.
- `src/lib/slots.ts`: berechnet freie Zeiten aus den Sprechzeiten. Die Akutsprechstunde bekommt nur Akutblöcke, alle anderen Terminarten nur normale Sprechzeiten. Belegte Zeiten fallen weg.
- `src/lib/zeit.ts`: rechnet alle Zeiten in Europe/Berlin, auch über die Zeitumstellung.
- `src/lib/sitzung.ts`: zwei getrennte Anmeldungen über signierte Cookies. Patient:innen bleiben 30 Minuten angemeldet, das Praxisteam einen Arbeitstag lang.
- `prisma/schema.prisma`: Datenmodell. `prisma/seed.ts` legt erfundene Testdaten an.
- `tests/`: Tests für BR1, BR2, BR3, den Schutz vor Doppelbuchungen und den Praxisbereich.

## Doppelbuchungen

Eine Uhrzeit kann nur einmal vergeben werden. Wählt jemand eine Uhrzeit, lege ich zuerst eine Reservierung für zwei Minuten an. Erst beim Bestätigen wird daraus ein Termin. Beide Schritte laufen in einer Datenbank-Transaktion und prüfen dort noch einmal, ob sich etwas überschneidet. Die Prüfung nur in der Oberfläche würde nicht reichen, da zwei Personen gleichzeitig dieselbe Seite offen haben können.

Die MFA bucht am Telefon direkt, ohne Reservierung. Läuft gerade eine Online-Reservierung, ist diese Zeit aber auch für sie belegt. Umgekehrt scheitert eine Online-Buchung, wenn die MFA die Zeit inzwischen vergeben hat.

## Wichtige Befehle

| Befehl | Wofür |
|---|---|
| `npm install` | Pakete installieren, erzeugt auch den Prisma-Client |
| `npm run db:migrate` | Datenbank auf den Stand des Schemas bringen und den Prisma-Client neu erzeugen |
| `npx prisma db seed` | Testdaten anlegen |
| `npm run dev` | App starten, danach http://localhost:3000 |
| `npm test` | Tests ausführen |
