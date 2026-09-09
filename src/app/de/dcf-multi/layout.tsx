import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Mehrmieter-DCF — erwartete monatliche Zahlungsströme",
  description: "Deterministisches Szenario: Gleiche Eingaben ergeben gleiche Ergebnisse. Anfangsparameter sind indikativ, Beispiele fiktiv. Monatswerte werden jährlich zusammengefasst und zum Jahresende diskontiert.",
  alternates: localizedAlternates("/dcf-multi", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
