"use client";

import Link from "next/link";
import { Meldung, knopfNeben } from "@/components/ui";

export default function Fehler({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-lg">
      <Meldung art="fehler">Da ist etwas schiefgelaufen. Bitte versuchen Sie es noch einmal.</Meldung>
      <div className="flex gap-3">
        <button onClick={reset} className={knopfNeben}>
          Erneut versuchen
        </button>
        <Link href="/buchen" className={knopfNeben}>
          Zur Anmeldung
        </Link>
      </div>
    </main>
  );
}
