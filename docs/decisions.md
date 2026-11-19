# decisions.md

| Datum | Entscheidung | Begründung | Alternativen |
|---|---|---|---|
| 11.11.2026 | Stack: Node.js mit Express, SQLite, einfaches HTML/JavaScript | Node wird vom Setup-Skript des Kurses ohnehin installiert. SQLite braucht keinen Server und liegt in einer Datei, das passt zum lokalen Start. Das relationale Modell aus der SPEC lässt sich direkt in Tabellen mit Fremdschlüsseln übertragen. | Python mit FastAPI (zweite Sprache, zusätzliches Setup), PostgreSQL (für den lokalen Start zu aufwendig), Frontend-Framework (für Version 1 mehr Aufwand als Nutzen) |
| 11.11.2026 | Repo liegt lokal in `~/Projekte`, nicht im iCloud-Schreibtisch | In iCloud-Ordnern werden Dateien ausgelagert oder doppelt angelegt, das stört Git | Repo im Studium-Ordner |
| 11.11.2026 | Rezept-Abholung und Fragebogen kommen nicht in Version 1 | Die Kundin nennt beides als später (Nachr. 17, 20), siehe SPEC W2 | Beides schon in Version 1 |
| 19.11.2026 | Stack geändert: Next.js, SQLite über Prisma 7, Tailwind CSS (ersetzt den Eintrag vom 11.11.) | Die aktualisierte AGENTS.md-Vorlage des Kurses gibt diesen Stack vor. Prisma bringt Migrationen mit, SQLite bleibt als lokale Datei, Next.js deckt Oberfläche und Server in einem Projekt ab. | Bei Express bleiben (weicht von der Kursvorlage ab) |
| 19.11.2026 | Backlog als Feature-Tabelle F-001 bis F-010, fünf davon in Phase 1 | Vorgabe aus AGENTS.md: 8 bis 15 Abläufe, keine eigenen Features für Datenmodell oder Rechte. Rechte und Vertretung stecken in F-005, das Datenmodell entsteht mit F-001. | Feature je Entität (laut Vorgabe nicht erlaubt) |
