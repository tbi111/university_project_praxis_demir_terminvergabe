# Praxis Demir & Kollegen · digitale Terminvergabe

Projekt im Modul SB52.2 Smart Applications (HTW Berlin, Wintersemester 2026/27).

Die Gemeinschaftspraxis von Dr. Demir vergibt ihre Termine bisher fast nur telefonisch. Dadurch ist die Anmeldung vor allem morgens dauerhaft ausgelastet. In diesem Projekt leite ich aus zwei Kundengesprächen ein Anforderungsmodell ab und baue daraus anschließend eine Anwendung zur Terminvergabe.

## Stand

Die Anforderungsanalyse ist abgeschlossen. Das Grundgerüst der App steht (Next.js, Prisma 7, SQLite, Tailwind CSS). Als Nächstes setze ich F-001 um, die Online-Buchung für Vorsorge, Beratung und Impfung.

## Lokal starten

Voraussetzung: Node.js 20.9 oder neuer.

```
npm install
npm run dev
```

Danach http://localhost:3000 öffnen. Die Datenbank ist eine lokale Datei (`prisma/dev.db`) und wird beim ersten Zugriff angelegt.

## Inhalt

| Datei | Inhalt |
|---|---|
| `SPEC.md` | Anforderungsmodell mit Entitäten, Beziehungen, Business Rules, Widersprüchen, Prioritäten und offenen Fragen |
| `AGENTS.md` | Arbeitsregeln, Stack und Design für die Umsetzung |
| `docs/backlog.md` | Features F-001 bis F-010 mit Phase und Status |
| `docs/decisions.md` | Entscheidungen mit Datum und Begründung |
| `docs/architecture.md` | Aufbau der App |
