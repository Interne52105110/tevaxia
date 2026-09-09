import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Energetische Untersuchung vorbereiten",description:"20 Fragen zum Sammeln Ihrer Angaben vor einem Fachtermin. Sie können „Ich weiß es nicht“ wählen. Dieser Fragebogen berechnet nicht die Energieeffizienz Ihres Gebäudes.",openGraph:{title:"Energetische Untersuchung vorbereiten",description:"20 Fragen zum Sammeln Ihrer Angaben vor einem Fachtermin. Sie können „Ich weiß es nicht“ wählen. Dieser Fragebogen berechnet nicht die Energieeffizienz Ihres Gebäudes.",type:"website"},alternates:localizedAlternates("/energy/audit","de")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
