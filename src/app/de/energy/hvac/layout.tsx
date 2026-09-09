import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Heizung: Bedarf, Angebote und Kosten vergleichen",description:"Vergleichen Sie zwei Szenarien anhand eingegebener Wärmebedarfe, saisonaler Leistung, Preise und Angebote. Die Anfangswerte erläutern die Methode; sie sind weder Messwerte Ihrer Immobilie noch Angebote.",alternates:localizedAlternates("/energy/hvac","de")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
