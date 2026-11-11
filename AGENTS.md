# AGENTS.md

## Projekt in 3 Sätzen
Online-Terminbuchung für die Gemeinschaftspraxis Demir & Kollegen (drei Ärzt:innen, Kunde K5 im Kurs SB52.2 Smart Applications, HTW Berlin).
Die App soll die telefonische Terminvergabe entlasten: Patient:innen buchen selbst, das Praxisteam behält die Kontrolle.
Die fachliche Grundlage ist ausschließlich `SPEC.md`. Was dort nicht steht, wird nicht gebaut.

## Stack
- Backend: Node.js mit Express
- Datenbank: SQLite (eine lokale Datei, Zugriff über `better-sqlite3`)
- Frontend: einfache HTML-Seiten mit etwas JavaScript, kein Framework
- Tests: eingebauter Test-Runner von Node (`node --test`)
- Die App läuft lokal auf dem eigenen Rechner. Begründung steht in `docs/decisions.md`.

## Wichtige Dateien
- `SPEC.md`: Entitäten, Beziehungen, Business Rules, Widersprüche
- `docs/decisions.md`: Entscheidungen mit Datum und Begründung
- `docs/backlog.md`: offene Punkte, Bugs, Ideen

## Fachliche Leitplanken (aus der SPEC)
- Version 1: Online-Buchung nur für Vorsorge, Beratung und Impfung (BR2). Rezept-Abholung und Fragebogen kommen später.
- Online buchen darf nur, wer als Bestandspatient:in angelegt ist und sich mit Geburtsdatum und Versichertennummer bzw. Patientennummer ausweist (BR1).
- Absagen online nur bis 24 Stunden vorher, kein Verschieben (BR3).
- Beim dritten No-Show in zwölf Monaten markiert das System nur, die Sperre setzt eine MFA von Hand (BR4).
- Fällt die Praxissoftware aus, gibt es keine Online-Buchung und keinen Zwischenspeicher (BR5).
- Rechte: MFAs sehen keine Arztnotizen, Ärzt:innen sehen nur ihre eigenen Patient:innen im Detail.

## Arbeitsweise
- Ein Feature nach dem anderen. Nie mehrere Baustellen gleichzeitig.
- Nach jedem funktionierenden Stand committen, mit kurzer, klarer Commit-Message.
- Vor jeder Änderung an Datenmodell oder Business Rules zuerst SPEC.md prüfen.
- Mit realistischen Testdaten prüfen, nicht nur mit Hello-World-Klicks.

## Bekannte Fallen
- Zeitzonen: Alle Termine in Europe/Berlin speichern und anzeigen. Datumsfelder explizit typisieren.
- Keine echten Patientendaten verwenden, nur erfundene Testdaten.
- Keine Bibliotheken erfinden: Abhängigkeiten vor dem Einbau prüfen.
- Tabellen nicht ohne Migration und Backup umbenennen.
- Doppelbuchungen: Prüfung der Slots immer in der Datenbank absichern, nicht nur im Frontend.
