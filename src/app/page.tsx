import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

async function DatenbankStatus() {
  await connection();
  let version: string | null = null;
  try {
    const [row] = await prisma.$queryRaw<{ version: string }[]>`SELECT sqlite_version() AS version`;
    version = row.version;
  } catch {
    version = null;
  }
  if (!version) return <p className="text-sm text-red-700">Datenbank nicht erreichbar</p>;
  return <p className="text-sm text-emerald-700">Datenbank verbunden (SQLite {version})</p>;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">Gemeinschaftspraxis</p>
      <h1 className="text-4xl font-semibold tracking-tight">Praxis Demir &amp; Kollegen</h1>
      <p className="text-lg text-stone-600">
        Online-Terminvergabe. Die erste Funktion ist die Buchung für Vorsorge, Beratung und Impfung (F-001).
      </p>
      <Suspense fallback={<p className="text-sm text-stone-500">Prüfe Datenbank …</p>}>
        <DatenbankStatus />
      </Suspense>
    </main>
  );
}
