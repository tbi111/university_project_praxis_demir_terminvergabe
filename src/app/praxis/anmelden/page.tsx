import { Karte, Seitentitel } from "@/components/ui";
import { PraxisAnmeldeformular } from "./formular";

export default function PraxisAnmelden() {
  return (
    <main className="mx-auto w-full max-w-4xl">
      <Seitentitel titel="Praxisbereich" unterzeile="Kalender und telefonische Terminvergabe für das Team am Empfang." />
      <Karte className="max-w-lg">
        <PraxisAnmeldeformular />
      </Karte>
    </main>
  );
}
