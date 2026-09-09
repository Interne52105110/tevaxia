import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Monatliche Kurzzeitvermietungsprojektion",description:"Szenario für eine Einheit, die an jedem Kalendertag verfügbar ist. Ab 24 aufeinanderfolgenden Monaten: additives Holt-Winters; bei 6–23 Monaten: konstanter Mittelwert. Die Datenlänge belegt keine Zuverlässigkeit.",alternates:localizedAlternates("/str/forecast","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
