import { Karte, Seitentitel } from "@/components/ui";
import { Schrittleiste } from "@/components/schrittleiste";
import { Anmeldeformular } from "./anmeldeformular";

export default function AnmeldenSeite() {
  return (
    <main>
      <Schrittleiste aktiv={1} />
      <Seitentitel titel="Bei der Praxis anmelden" unterzeile="Online buchen können alle, die bereits Patient:in unserer Praxis sind." />
      <Karte className="max-w-lg">
        <Anmeldeformular />
      </Karte>
    </main>
  );
}
