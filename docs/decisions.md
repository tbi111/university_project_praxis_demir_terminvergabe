# decisions.md

| Datum | Entscheidung | Begründung | Alternativen |
|---|---|---|---|
| 11.11.2026 | Stack: Node.js mit Express, SQLite, einfaches HTML/JavaScript | Node wird vom Setup-Skript des Kurses ohnehin installiert. SQLite braucht keinen Server und liegt in einer Datei, das passt zum lokalen Start. Das relationale Modell aus der SPEC lässt sich direkt in Tabellen mit Fremdschlüsseln übertragen. | Python mit FastAPI (zweite Sprache, zusätzliches Setup), PostgreSQL (für den lokalen Start zu aufwendig), Frontend-Framework (für Version 1 mehr Aufwand als Nutzen) |
| 11.11.2026 | Repo liegt lokal in `~/Projekte`, nicht im iCloud-Schreibtisch | In iCloud-Ordnern werden Dateien ausgelagert oder doppelt angelegt, das stört Git | Repo im Studium-Ordner |
| 11.11.2026 | Rezept-Abholung und Fragebogen kommen nicht in Version 1 | Die Kundin nennt beides als später (Nachr. 17, 20), siehe SPEC W2 | Beides schon in Version 1 |
