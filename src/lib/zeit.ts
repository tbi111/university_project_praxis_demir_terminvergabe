// Alle Termine gelten in der Zeitzone der Praxis.
export const ZEITZONE = "Europe/Berlin";

function teile(datum: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZEITZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(datum);
  const wert = (typ: string) => Number(parts.find((p) => p.type === typ)?.value);
  return { j: wert("year"), m: wert("month"), t: wert("day"), h: wert("hour"), min: wert("minute"), s: wert("second") };
}

function versatzMinuten(datum: Date): number {
  const p = teile(datum);
  const alsUtc = Date.UTC(p.j, p.m - 1, p.t, p.h, p.min, p.s);
  return Math.round((alsUtc - datum.getTime()) / 60000);
}

/** Tag (JJJJ-MM-TT) und Uhrzeit (HH:MM) in Berlin als Zeitpunkt. */
export function berlinZeitpunkt(tag: string, uhrzeit: string): Date {
  const [j, m, t] = tag.split("-").map(Number);
  const [h, min] = uhrzeit.split(":").map(Number);
  const geschaetzt = Date.UTC(j, m - 1, t, h, min);
  let ergebnis = geschaetzt - versatzMinuten(new Date(geschaetzt)) * 60000;
  const korrektur = versatzMinuten(new Date(ergebnis));
  ergebnis = geschaetzt - korrektur * 60000;
  return new Date(ergebnis);
}

/** Kalendertag in Berlin als JJJJ-MM-TT. */
export function berlinTag(datum: Date): string {
  const p = teile(datum);
  return `${p.j}-${String(p.m).padStart(2, "0")}-${String(p.t).padStart(2, "0")}`;
}

/** 1 = Montag … 7 = Sonntag */
export function wochentag(tag: string): number {
  const [j, m, t] = tag.split("-").map(Number);
  const w = new Date(Date.UTC(j, m - 1, t)).getUTCDay();
  return w === 0 ? 7 : w;
}

export function tagPlus(tag: string, tage: number): string {
  const [j, m, t] = tag.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, t + tage)).toISOString().slice(0, 10);
}

export function plusMinuten(datum: Date, minuten: number): Date {
  return new Date(datum.getTime() + minuten * 60000);
}

export function istGueltigerTag(tag: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tag)) return false;
  const [j, m, t] = tag.split("-").map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t;
}

export const formatTag = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", { timeZone: ZEITZONE, weekday: "long", day: "numeric", month: "long" }).format(d);

export const formatTagKurz = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", { timeZone: ZEITZONE, weekday: "short", day: "2-digit", month: "2-digit" }).format(d);

export const formatUhrzeit = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", { timeZone: ZEITZONE, hour: "2-digit", minute: "2-digit" }).format(d);
