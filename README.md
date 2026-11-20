# Praxis Demir & Kollegen · digitale Terminvergabe

Projekt im Modul SB52.2 Smart Applications (HTW Berlin, Wintersemester 2026/27).

Die Gemeinschaftspraxis von Dr. Demir vergibt ihre Termine bisher fast nur telefonisch. Dadurch ist die Anmeldung vor allem morgens dauerhaft ausgelastet. In diesem Projekt leite ich aus zwei Kundengesprächen ein Anforderungsmodell ab und baue daraus anschließend eine Anwendung zur Terminvergabe.

## Stand

Die Anforderungsanalyse ist abgeschlossen und das erste Feature ist fertig. Mit F-001 können sich Patient:innen mit Geburtsdatum und Versicherten- bzw. Patientennummer anmelden und online Vorsorge, Beratung oder Impfung buchen. Akutslots sind dabei nie sichtbar, und eine gewählte Uhrzeit ist zwei Minuten für die Person reserviert. Als Nächstes folgt F-002, der Praxiskalender für die MFAs.

## Lokal starten

Voraussetzung: Node.js 20.9 oder neuer.

```
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Danach http://localhost:3000 öffnen. Die Datenbank ist eine lokale Datei (`prisma/dev.db`). Der zweite Befehl legt die Tabellen an, der dritte füllt sie mit erfundenen Testdaten.

Zum Ausprobieren eignet sich zum Beispiel Anna Beispiel mit dem Geburtsdatum 12.04.1980 und der Versichertennummer T000000001. Paul Muster (30.09.1975) ist privat versichert und meldet sich mit der Patientennummer 1002 an. Gerd Probe (01.01.1990, T000000003) ist gesperrt und kommt deshalb nicht in die Online-Buchung.

Die Tests starten mit `npm test`. Sie legen dafür eine eigene Testdatenbank an.

## Inhalt

| Datei | Inhalt |
|---|---|
| `SPEC.md` | Anforderungsmodell mit Entitäten, Beziehungen, Business Rules, Widersprüchen, Prioritäten und offenen Fragen |
| `AGENTS.md` | Arbeitsregeln, Stack und Design für die Umsetzung |
| `docs/backlog.md` | Features F-001 bis F-010 mit Phase und Status |
| `docs/decisions.md` | Entscheidungen mit Datum und Begründung |
| `docs/architecture.md` | Aufbau der App |
