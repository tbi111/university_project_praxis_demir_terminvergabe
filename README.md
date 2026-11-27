# Praxis Demir & Kollegen · digitale Terminvergabe

Projekt im Modul SB52.2 Smart Applications (HTW Berlin, Wintersemester 2026/27).

Die Gemeinschaftspraxis von Dr. Demir vergibt ihre Termine bisher fast nur telefonisch. Dadurch ist die Anmeldung vor allem morgens dauerhaft ausgelastet. In diesem Projekt leite ich aus zwei Kundengesprächen ein Anforderungsmodell ab und baue daraus anschließend eine Anwendung zur Terminvergabe.

## Stand

Die Anforderungsanalyse ist abgeschlossen, und die ersten vier Features sind fertig. Mit F-001 können sich Patient:innen anmelden und online Vorsorge, Beratung oder Impfung buchen. Akutslots sind dabei nie sichtbar, und eine gewählte Uhrzeit ist zwei Minuten reserviert. Mit F-002 hat das Praxisteam einen Tageskalender für alle drei Ärzt:innen. Dort legt die MFA Neupatient:innen an, bucht telefonisch und sagt Termine ab. Der Kalender zeigt außerdem jeden Tag, wie viele Termine online und wie viele telefonisch gebucht wurden. Daran misst die Praxis, ob die App die Anrufe wirklich reduziert. Mit F-003 sehen Patient:innen ihre eigenen Termine und können sie bis 24 Stunden vorher selbst absagen. Danach ist die Zeit sofort wieder frei. Mit F-004 trägt die MFA Urlaub, Fortbildung oder Krankheit ein. In diesem Zeitraum sind keine Termine mehr buchbar, und die schon gebuchten Termine erscheinen als Liste, die die MFA Schritt für Schritt umbucht oder absagt. Als Nächstes folgt F-005, die Tagesliste für die Ärzt:innen.

## Lokal starten

Voraussetzung: Node.js 20.9 oder neuer.

```
npm install
npm run db:migrate
npx prisma db seed
npm run dev
```

Danach http://localhost:3000 öffnen. Die Datenbank ist eine lokale Datei (`prisma/dev.db`). Der zweite Befehl legt die Tabellen an, der dritte füllt sie mit erfundenen Testdaten.

Zum Ausprobieren eignet sich zum Beispiel Anna Beispiel mit dem Geburtsdatum 12.04.1980 und der Versichertennummer T000000001. Paul Muster (30.09.1975) ist privat versichert und meldet sich mit der Patientennummer 1002 an. Gerd Probe (01.01.1990, T000000003) ist gesperrt und kommt deshalb nicht in die Online-Buchung.

Für den Praxisbereich unter http://localhost:3000/praxis braucht es ein Passwort. Das lege ich einmalig in der Datei `.env` an, die nicht ins Repo kommt:

```
echo 'PRAXIS_PASSWORT="ein-eigenes-passwort"' >> .env
```

Die Tests starten mit `npm test`. Sie legen dafür eine eigene Testdatenbank an.

## Inhalt

| Datei | Inhalt |
|---|---|
| `SPEC.md` | Anforderungsmodell mit Entitäten, Beziehungen, Business Rules, Widersprüchen, Prioritäten und offenen Fragen |
| `AGENTS.md` | Arbeitsregeln, Stack und Design für die Umsetzung |
| `docs/backlog.md` | Features F-001 bis F-010 mit Phase und Status |
| `docs/decisions.md` | Entscheidungen mit Datum und Begründung |
| `docs/architecture.md` | Aufbau der App |
