"use server";

import { redirect } from "next/navigation";
import { buchePraxis, legePatientAn, sageTerminAb } from "@/lib/praxis";
import { prisma } from "@/lib/prisma";
import { beendePraxisSitzung, istPraxisSitzung, praxisPasswortGesetzt, praxisPasswortStimmt, startePraxisSitzung } from "@/lib/sitzung";
import { berlinTag } from "@/lib/zeit";

async function nurPraxis() {
  if (!(await istPraxisSitzung())) redirect("/praxis/anmelden");
}

export type PraxisAnmeldeZustand = { fehler?: string };

export async function praxisAnmelden(_vorher: PraxisAnmeldeZustand, formData: FormData): Promise<PraxisAnmeldeZustand> {
  if (!praxisPasswortGesetzt()) return { fehler: "Es ist noch kein Praxis-Passwort eingerichtet (PRAXIS_PASSWORT in der Datei .env)." };
  if (!praxisPasswortStimmt(String(formData.get("passwort") ?? ""))) return { fehler: "Das Passwort stimmt nicht." };
  await startePraxisSitzung();
  redirect("/praxis/kalender");
}

export async function praxisAbmelden() {
  await beendePraxisSitzung();
  redirect("/praxis/anmelden");
}

export type AnlageZustand = {
  fehler?: Partial<Record<"name" | "geburtsdatum" | "versichertennummer", string>>;
  werte?: Record<string, string>;
};

export async function patientAnlegen(_vorher: AnlageZustand, formData: FormData): Promise<AnlageZustand> {
  await nurPraxis();
  const werte = {
    name: String(formData.get("name") ?? ""),
    geburtsdatum: String(formData.get("geburtsdatum") ?? ""),
    versichertennummer: String(formData.get("versichertennummer") ?? ""),
    hausarzt: String(formData.get("hausarzt") ?? ""),
  };
  const ergebnis = await legePatientAn(prisma, {
    name: werte.name,
    geburtsdatum: werte.geburtsdatum,
    versichertennummer: werte.versichertennummer,
    hausarztId: werte.hausarzt ? Number(werte.hausarzt) : null,
    smsEinwilligung: formData.get("sms") === "ja",
  });
  if (!ergebnis.ok) return { fehler: ergebnis.fehler, werte };
  redirect(`/praxis/neu?patient=${ergebnis.patientId}&angelegt=1`);
}

export async function terminBuchen(formData: FormData) {
  await nurPraxis();
  const patientId = Number(formData.get("patient"));
  const arztId = Number(formData.get("arzt"));
  const terminartId = Number(formData.get("art"));
  const beginn = new Date(String(formData.get("beginn")));
  const ergebnis = await buchePraxis(prisma, { patientId, arztId, terminartId, beginn, jetzt: new Date() });
  if (!ergebnis.ok) redirect(`/praxis/neu?patient=${patientId}&art=${terminartId}&arzt=${arztId}&tag=${berlinTag(beginn)}&fehler=${ergebnis.grund}`);
  redirect(`/praxis/kalender?tag=${berlinTag(beginn)}&neu=${ergebnis.terminId}`);
}

export async function terminAbsagen(formData: FormData) {
  await nurPraxis();
  const terminId = Number(formData.get("termin"));
  const termin = await prisma.termin.findUnique({ where: { id: terminId } });
  const ok = await sageTerminAb(prisma, terminId);
  redirect(`/praxis/kalender?tag=${termin ? berlinTag(termin.beginn) : ""}&${ok ? "abgesagt=1" : "fehler=absage"}`);
}
