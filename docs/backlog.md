# backlog.md

| ID | Name | Phase | Status | BR/Entitäten |
|---|---|---|---|---|
| F-001 | Patient:in meldet sich mit Geburtsdatum und Versicherten- bzw. Patientennummer an und bucht online einen Termin (Vorsorge, Beratung, Impfung), Slot ist während der Buchung ca. zwei Minuten reserviert | 1 | fertig | BR1, BR2 · Patient, Arzt, Terminart, Sprechzeit, Termin |
| F-002 | MFA legt Patient:in an und bucht telefonisch einen Termin im Praxiskalender, auch in Akutslots, ohne Doppelbuchung | 1 | fertig | BR1, BR2 · Patient, Arzt, Terminart, Sprechzeit, Termin |
| F-003 | Patient:in sieht die eigenen Termine und sagt einen Termin bis 24 Stunden vorher online ab | 1 | offen | BR3 · Patient, Termin |
| F-004 | MFA trägt eine Abwesenheit (Ärzt:in oder ganze Praxis) ein und arbeitet die Liste der betroffenen Termine ab | 1 | offen | Abwesenheit, Arzt, Termin |
| F-005 | Ärzt:in öffnet die eigene Tagesliste, sieht Termingrund und Notizen und behandelt als Vertretung mit eingeschränkter Sicht | 1 | offen | Arzt, Patient, Termin, Notiz |
| F-006 | MFA erfasst ein Nichterscheinen, das System markiert beim dritten No-Show in zwölf Monaten, die MFA sperrt von Hand | 2 | offen | BR4 · Patient, Termin |
| F-007 | Patient:in mit gespeicherter Einwilligung bekommt Bestätigung und Erinnerung per SMS | 2 | offen | Patient, Termin |
| F-008 | Fällt die Praxissoftware aus, sieht die Patient:in einen Hinweis statt der Buchung, und nichts wird zwischengespeichert | 2 | offen | BR5 · Termin |
| F-009 | Patient:in beantragt ein Wiederholungsrezept, Ärzt:in gibt es frei, danach wird die Abholung gebucht | 3 | offen | BR2 · Wiederholungsrezept, Patient, Arzt, Terminart, Termin |
| F-010 | Patient:in füllt nach der Online-Buchung freiwillig den Fragebogen zur Terminart aus | 3 | offen | Termin, Terminart (neu: Fragebogen, Fragebogenantwort) |

Phase 1 = Version 1, Phase 2 = Version 1 falls Zeit bleibt, Phase 3 = später (siehe SPEC, Prioritäten).

## Offene Kundenfragen

- [ ] Dürfen MFAs die Antworten aus dem Fragebogen sehen? (Nachr. 17)
- [ ] Wochenpläne von Dr. Schäfer und Dr. Yilmaz (Nachr. 18)
- [ ] Welche Vorsorge dauert 20 und welche 30 Minuten? (Nachr. 3)
- [ ] Ab wann wird statt der Hausärzt:in ein anderer Arzt angeboten? (Nachr. 2)
- [ ] Welche Praxissoftware wird genutzt, und hat sie eine Schnittstelle? (Nachr. 10)

## Bugs

- [ ]
