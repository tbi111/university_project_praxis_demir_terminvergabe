# SPEC.md · Praxis Demir & Kollegen

Quelle: Meeting 1 (Nachricht 1–12) und Meeting 2 (Nachricht 13–20) mit Dr. Aylin Demir. Hinter jeder Regel steht die Nachricht, aus der sie stammt.

## Ausgangslage

In der Gemeinschaftspraxis arbeiten Dr. Demir, Dr. Schäfer und Dr. Yilmaz. Termine werden fast nur telefonisch vergeben. Montags stehen bis 8:15 Uhr schon zwölf bis fünfzehn Anrufe in der Warteschleife, und jedes Gespräch dauert drei bis fünf Minuten (Nachr. 1, 11). Bei Routineterminen ist das laut Dr. Demir reine „Matching-Arbeit“ zwischen Patient, Arzt, Terminart und freiem Slot (Nachr. 2). Deshalb sollen Bestandspatient:innen einfache Termine künftig selbst online buchen können. Als Erfolg nennt die Kundin nur noch fünf bis sechs Anrufe montags früh (Nachr. 11). Die Praxissoftware (PVS) bleibt dabei das führende System (Nachr. 10).

## Entitäten

Die erste Angabe jeder Zeile ist der Schlüssel, ein Pfeil (→) kennzeichnet einen Verweis auf eine andere Entität.

| Entität | Attribute |
|---|---|
| Patient | patient_id, name, geburtsdatum, versichertennummer (nur GKV), online_gesperrt |
| Arzt | arzt_id, name, titel, aktiv |
| Terminart | terminart_id, bezeichnung, dauer_minuten, online_buchbar |
| Sprechzeit | sprechzeit_id, arzt → Arzt, wochentag, beginn, ende |
| Termin | termin_id, patient → Patient, arzt → Arzt, terminart → Terminart, beginn, status (gebucht, abgesagt, wahrgenommen, no_show) |
| Abwesenheit | abwesenheit_id, arzt → Arzt (leer = ganze Praxis), von, bis, grund |
| Wiederholungsrezept | rezept_id, patient → Patient, medikament, status (beantragt, freigegeben, abgeholt) |
| Notiz | notiz_id, termin → Termin, typ (MFA, Arzt intern, Vertretung), text |

Terminarten laut Kundin (Nachr. 3, 4): Beratung 15 min, Vorsorge 20–30 min, Impfung 10 min, Blutabnahme 10 min, Rezept-Abholung 5 min, Akutsprechstunde 10 min, Erstgespräch 30 min. Räume und Geräte nehme ich nicht auf, da die Praxis das intern regelt (Nachr. 3).

## Beziehungen

- Patient 1:n Termin (Nachr. 2)
- Arzt 1:n Termin (Nachr. 2)
- Terminart 1:n Termin, die Terminart legt die Dauer fest (Nachr. 2, 3)
- Arzt n:m Terminart: Nicht jeder Arzt bietet jede Terminart an, Impfungen macht z. B. nur Dr. Demir (Nachr. 3)
- Arzt 1:n Patient als Hausärzt:in, das bleibt auch bei einer Vertretung so. Eine Vertretung liegt vor, wenn der Arzt am Termin nicht die Hausärzt:in des Patienten ist (Nachr. 2, 9, 13)
- Arzt 1:n Sprechzeit, da jeder Arzt einen eigenen Wochenplan hat (Nachr. 18)
- Arzt 0..1:n Abwesenheit, ohne Arzt gilt sie für die ganze Praxis (Nachr. 12, 14)
- Patient 1:n Wiederholungsrezept (Nachr. 19)
- Termin 1:n Notiz (Nachr. 5, 13)

## Business Rules

- **BR1** Wenn jemand online buchen will, dann nur mit Geburtsdatum und Versichertennummer bzw. interner Patientennummer. Neupatient:innen müssen zuerst anrufen und von einer MFA angelegt werden (Nachr. 2, 4)
- **BR2** Wenn online gebucht wird, dann nur Vorsorge, Beratung und Impfung. Die acht Akutslots pro Tag (vier vormittags, vier nachmittags) sind nie online sichtbar (Nachr. 4, 7, 18, 20)
- **BR3** Wenn ein Termin online abgesagt wird, dann nur bis 24 Stunden vorher. Verschieben geht online nicht, dafür muss man absagen und neu buchen (Nachr. 5)
- **BR4** Wenn jemand innerhalb von zwölf Monaten zum dritten Mal nicht erscheint, dann markiert das System den Fall zur Prüfung. Gesperrt wird nur, wenn die MFA das bestätigt (Nachr. 6, 8)
- **BR5** Wenn die Verbindung zur Praxissoftware ausfällt, dann sind keine Online-Buchungen möglich. Es gibt keinen Zwischenspeicher, der später nachträgt (Nachr. 15)

## Widersprüche

- **W1** „Beim dritten Mal wird die Online-Buchung gesperrt“ steht gegen „nicht automatisch, das will ich nicht“ (beides Nachr. 6). Auf Nachfrage hat die Kundin klargestellt, dass das System nur markiert und die MFA entscheidet (Nachr. 8) → BR4, `online_gesperrt`. *Annahme im Modell:* Zählen und Markieren laufen automatisch, die Sperre selbst setzt nur eine MFA von Hand.
- **W2** Zum Start sollen vier Terminarten online buchbar sein, darunter die Rezept-Abholung (Nachr. 4, 11). Den Rezept-Ablauf nennt die Kundin aber nur „Nice-to-have“, und ohne ärztliche Freigabe darf keine Abholung gebucht werden (Nachr. 11, 19). Geklärt wurde, dass die Rezept-Abholung erst mit der Freigabe in Version 2 kommt und in Version 1 nur drei Terminarten online sind (Nachr. 20) → BR2, `status` beim Rezept. *Annahme im Modell:* Die Entität Wiederholungsrezept bleibt im Datenmodell, die Online-Abholung wird aber erst in Version 2 freigeschaltet.

## Neue Anforderung (Meeting 2)

Auf die Frage, was die Praxis als Nächstes plant, nannte Dr. Demir einen **Fragebogen nach der Online-Buchung** (Nachr. 16). Bei etwa 30 % der Patient:innen ist vorher unklar, weshalb sie kommen, und die Abfrage am Tresen kostet jedes Mal etwa fünf Minuten. Der Fragebogen passt zur Terminart, ist freiwillig, und die Antworten hängen am Termin. Er kommt erst in Version 2 (Nachr. 17). Dafür braucht das Modell später die Entitäten Fragebogen und Fragebogenantwort.

## Weitere Anforderungen

- Rechte: MFAs dürfen alle Termine bearbeiten, aber keine Arztnotizen sehen. Ärzt:innen sehen nur ihre eigenen Patient:innen im Detail. Patient:innen sehen nur ihre eigenen Termine (Nachr. 5)
- Vertretung: Die vertretende Ärzt:in sieht nur Termingrund, MFA-Notiz und Basisakte, und das nur für diesen einen Termin (Nachr. 9, 13)
- Abwesenheiten trägt die MFA ein. Betroffene Termine erscheinen als Liste, werden aber nicht automatisch umgebucht (Nachr. 7, 14)
- Startet jemand eine Buchung, ist der Slot etwa zwei Minuten reserviert, damit es keine Doppelbuchungen gibt (Nachr. 15)
- Bestätigungen gehen per Brief oder, mit Einwilligung der Patient:innen, per SMS raus. E-Mail wird nicht genutzt. Die Einwilligung muss deshalb bei den Patient:innen gespeichert werden (Nachr. 10)

## Prioritäten

1. Online-Buchung für Vorsorge, Beratung und Impfung (Version 1)
2. Vollständiger Kalender für die MFAs, abgeglichen mit der Praxissoftware, ohne Doppelbuchungen (Version 1)
3. Sprechzeiten, Akutslots, Abwesenheiten und Rechte (Version 1)
4. No-Show-Zählung und SMS-Erinnerungen (Version 1, falls Zeit bleibt)
5. Rezept-Abholung mit Freigabe (später)
6. Fragebogen (später)

## Offene Fragen

- Dürfen MFAs die Antworten aus dem Fragebogen sehen? Das bespricht Dr. Demir noch im Team (Nachr. 17)
- Wie sehen die Wochenpläne von Dr. Schäfer und Dr. Yilmaz aus (Nachr. 18)?
- Welche Vorsorge dauert 20 und welche 30 Minuten (Nachr. 3)?
- Ab wann wird statt der Hausärzt:in ein anderer Arzt angeboten (Nachr. 2)?
- Welche Praxissoftware wird genutzt, und hat sie eine Schnittstelle (Nachr. 10)?
