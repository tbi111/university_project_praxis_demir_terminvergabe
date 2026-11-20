import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

// Kurze Sitzung nach der Anmeldung (BR1). Das Geheimnis kommt aus der Umgebung
// oder wird beim Start zufällig erzeugt, es steht nie in einer Datei.
const NAME = "praxis_sitzung";
const DAUER_SEKUNDEN = 30 * 60;

const g = globalThis as unknown as { sitzungsGeheimnis?: Buffer };
const geheimnis = process.env.SESSION_SECRET
  ? Buffer.from(process.env.SESSION_SECRET)
  : (g.sitzungsGeheimnis ??= randomBytes(32));

function signatur(text: string) {
  return createHmac("sha256", geheimnis).update(text).digest("base64url");
}

export async function starteSitzung(patientId: number) {
  const ablauf = Math.floor(Date.now() / 1000) + DAUER_SEKUNDEN;
  const inhalt = `${patientId}.${ablauf}`;
  (await cookies()).set(NAME, `${inhalt}.${signatur(inhalt)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DAUER_SEKUNDEN,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function beendeSitzung() {
  (await cookies()).delete(NAME);
}

export async function sitzungPatientId(): Promise<number | null> {
  await connection();
  const wert = (await cookies()).get(NAME)?.value;
  if (!wert) return null;
  const [id, ablauf, sig] = wert.split(".");
  if (!id || !ablauf || !sig) return null;
  const erwartet = Buffer.from(signatur(`${id}.${ablauf}`));
  const erhalten = Buffer.from(sig);
  if (erwartet.length !== erhalten.length || !timingSafeEqual(erwartet, erhalten)) return null;
  if (Number(ablauf) < Date.now() / 1000) return null;
  return Number(id);
}

// ---------- Praxis-Zugang für die MFAs (F-002) ----------
// Gemeinsames Praxis-Passwort aus PRAXIS_PASSWORT in der .env, noch ohne einzelne Benutzerkonten.
const PRAXIS_NAME = "praxis_team";
const PRAXIS_DAUER_SEKUNDEN = 10 * 60 * 60;

export function praxisPasswortGesetzt() {
  return Boolean(process.env.PRAXIS_PASSWORT);
}

export function praxisPasswortStimmt(eingabe: string) {
  const soll = process.env.PRAXIS_PASSWORT;
  if (!soll) return false;
  const a = Buffer.from(signatur(eingabe));
  const b = Buffer.from(signatur(soll));
  return timingSafeEqual(a, b);
}

export async function startePraxisSitzung() {
  const ablauf = Math.floor(Date.now() / 1000) + PRAXIS_DAUER_SEKUNDEN;
  const inhalt = `mfa.${ablauf}`;
  (await cookies()).set(PRAXIS_NAME, `${inhalt}.${signatur(inhalt)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/praxis",
    maxAge: PRAXIS_DAUER_SEKUNDEN,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function beendePraxisSitzung() {
  (await cookies()).delete({ name: PRAXIS_NAME, path: "/praxis" });
}

export async function istPraxisSitzung(): Promise<boolean> {
  await connection();
  const wert = (await cookies()).get(PRAXIS_NAME)?.value;
  if (!wert) return false;
  const [rolle, ablauf, sig] = wert.split(".");
  if (rolle !== "mfa" || !ablauf || !sig) return false;
  const erwartet = Buffer.from(signatur(`${rolle}.${ablauf}`));
  const erhalten = Buffer.from(sig);
  if (erwartet.length !== erhalten.length || !timingSafeEqual(erwartet, erhalten)) return false;
  return Number(ablauf) >= Date.now() / 1000;
}
