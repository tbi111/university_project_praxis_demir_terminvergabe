# architecture.md

Stand: 19.11.2026, Grundgerüst vor dem ersten Feature.

## Stack

| Teil | Wahl | Version |
|---|---|---|
| Framework | Next.js (App Router, TypeScript, `src/`-Ordner) | 16.4 |
| UI | Tailwind CSS | 4.3 |
| Datenbank | SQLite als lokale Datei `prisma/dev.db` | – |
| Datenzugriff | Prisma 7 mit Treiber-Adapter `@prisma/adapter-better-sqlite3` | 7.10 |
| Start | `npm run dev`, danach http://localhost:3000 | – |

## Aufbau

- `src/app/`: Seiten und Layout. Die Startseite prüft, ob die Datenbank erreichbar ist.
- `src/lib/prisma.ts`: ein gemeinsamer Prisma-Client für die ganze App.
- `prisma/schema.prisma`: Datenmodell. Noch ohne Modelle, sie entstehen mit F-001.
- `prisma.config.ts`: Pfad zu Schema, Migrationen und Datenbank (`DATABASE_URL`, sonst `file:./prisma/dev.db`).
- `src/generated/prisma/`: wird von `prisma generate` erzeugt und nicht committet.

## Entscheidungen

- Prisma 7 braucht für SQLite einen Treiber-Adapter, deshalb `better-sqlite3`.
- `npm install` führt über `postinstall` automatisch `prisma generate` aus.
- Die Datenbankdatei steht in `.gitignore`. Das Schema entsteht nur über `npx prisma migrate dev`.
- `agentRules: false` in `next.config.ts`, damit Next.js beim Start nichts in die AGENTS.md schreibt.
