# architecture.md

Stand: 19.11.2026, nach F-001.

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

- `src/app/buchen/`: der Buchungsablauf in vier Schritten (Anmelden, Terminart und Ärzt:in, Uhrzeit, Bestätigen). Die Formulare rufen Server Actions in `aktionen.ts` auf.
- `src/lib/buchung.ts`: Anmeldung (BR1), Online-Angebot (BR2), freie Zeiten, Reservierung und Buchung.
- `src/lib/slots.ts`: berechnet freie Zeiten aus den Sprechzeiten. Akutblöcke und belegte Zeiten fallen dabei weg.
- `src/lib/zeit.ts`: rechnet alle Zeiten in Europe/Berlin, auch über die Zeitumstellung.
- `src/lib/sitzung.ts`: merkt sich nach der Anmeldung für 30 Minuten, wer gebucht wird. Dafür nutze ich ein signiertes Cookie.
- `prisma/schema.prisma`: Datenmodell. `prisma/seed.ts` legt erfundene Testdaten an.
- `tests/`: Tests für BR1, BR2 und den Schutz vor Doppelbuchungen.

## Doppelbuchungen

Eine Uhrzeit kann nur einmal vergeben werden. Wählt jemand eine Uhrzeit, lege ich zuerst eine Reservierung für zwei Minuten an. Erst beim Bestätigen wird daraus ein Termin. Beide Schritte laufen in einer Datenbank-Transaktion und prüfen dort noch einmal, ob sich etwas überschneidet. Die Prüfung nur in der Oberfläche würde nicht reichen, da zwei Personen gleichzeitig dieselbe Seite offen haben können.

## Wichtige Befehle

| Befehl | Wofür |
|---|---|
| `npm install` | Pakete installieren, erzeugt auch den Prisma-Client |
| `npx prisma migrate dev` | Datenbank auf den Stand des Schemas bringen |
| `npx prisma db seed` | Testdaten anlegen |
| `npm run dev` | App starten, danach http://localhost:3000 |
| `npm test` | Tests ausführen |
