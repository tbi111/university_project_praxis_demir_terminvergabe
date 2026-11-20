"use server";

import { redirect } from "next/navigation";
import { bucheReservierung, identifiziere, reserviere } from "@/lib/buchung";
import { prisma } from "@/lib/prisma";
import { beendeSitzung, sitzungPatientId, starteSitzung } from "@/lib/sitzung";

export type AnmeldeZustand = {
  fehler?: { geburtsdatum?: string; nummer?: string; allgemein?: string };
  werte?: { geburtsdatum: string; nummer: string };
};

export async function anmelden(_vorher: AnmeldeZustand, formData: FormData): Promise<AnmeldeZustand> {
  const geburtsdatum = String(formData.get("geburtsdatum") ?? "");
  const nummer = String(formData.get("nummer") ?? "");
  const werte = { geburtsdatum, nummer };

  const fehler: AnmeldeZustand["fehler"] = {};
  if (!geburtsdatum) fehler.geburtsdatum = "Bitte geben Sie Ihr Geburtsdatum ein.";
  if (!nummer.trim()) fehler.nummer = "Bitte geben Sie Ihre Versichertennummer oder Patientennummer ein.";
  if (fehler.geburtsdatum || fehler.nummer) return { fehler, werte };

  const ergebnis = await identifiziere(prisma, { geburtsdatum, nummer });
  if (!ergebnis.ok) {
    const text = {
      eingabe: "Das Geburtsdatum ist ungültig.",
      nicht_gefunden:
        "Wir haben Sie mit diesen Angaben nicht gefunden. Neupatient:innen melden sich bitte zuerst telefonisch in der Praxis.",
      gesperrt: "Eine Online-Buchung ist für Sie gerade nicht möglich. Bitte rufen Sie in der Praxis an.",
    }[ergebnis.grund];
    return { fehler: { allgemein: text }, werte };
  }

  await starteSitzung(ergebnis.patientId);
  redirect("/buchen/termin");
}

export async function reservierenAktion(formData: FormData) {
  const patientId = await sitzungPatientId();
  if (!patientId) redirect("/buchen");
  const arztId = Number(formData.get("arzt"));
  const terminartId = Number(formData.get("art"));
  const beginn = new Date(String(formData.get("beginn")));
  const ab = String(formData.get("ab") ?? "");

  const ergebnis = await reserviere(prisma, { patientId, arztId, terminartId, beginn, jetzt: new Date() });
  if (!ergebnis.ok) redirect(`/buchen/termin?art=${terminartId}&arzt=${arztId}&ab=${ab}&fehler=${ergebnis.grund}`);
  redirect(`/buchen/bestaetigen?r=${ergebnis.reservierungId}`);
}

export async function buchenAktion(formData: FormData) {
  const patientId = await sitzungPatientId();
  if (!patientId) redirect("/buchen");
  const reservierungId = String(formData.get("reservierung"));

  const ergebnis = await bucheReservierung(prisma, { reservierungId, patientId, jetzt: new Date() });
  if (!ergebnis.ok) redirect(`/buchen/termin?fehler=${ergebnis.grund}`);
  redirect(`/buchen/fertig?t=${ergebnis.terminId}`);
}

export async function abmelden() {
  await beendeSitzung();
  redirect("/");
}
