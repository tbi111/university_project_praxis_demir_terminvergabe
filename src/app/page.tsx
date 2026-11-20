import Link from "next/link";
import { CalendarCheck, PhoneCall } from "lucide-react";
import { Karte, knopfHaupt } from "@/components/ui";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-10">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-gedaempft">Gemeinschaftspraxis</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Termine online buchen</h1>
        <p className="mt-4 text-lg text-gedaempft">
          Als Patient:in unserer Praxis buchen Sie Vorsorge, Beratung und Impfung direkt hier. Sie brauchen dafür Ihr Geburtsdatum und
          Ihre Versichertennummer oder Patientennummer.
        </p>
        <Link href="/buchen" className={`${knopfHaupt} mt-8`}>
          <CalendarCheck aria-hidden className="size-4" />
          Termin buchen
        </Link>
      </div>
      <Karte className="flex max-w-2xl items-start gap-4">
        <PhoneCall aria-hidden className="mt-1 size-5 shrink-0 text-petrol" />
        <p className="text-sm text-gedaempft">
          <span className="font-semibold text-tinte">Akute Beschwerden, Neupatient:innen und andere Terminarten</span> bitte weiterhin
          telefonisch. Akutsprechstunden vergeben wir nur am Telefon.
        </p>
      </Karte>
    </main>
  );
}
