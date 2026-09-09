import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Energie- und CO₂-Trajektorien vergleichen",description:"Berechnen Sie Intensitäten aus einem dokumentierten Jahresbericht und vergleichen Sie ein Gebäudeszenario jährlich mit einer von Ihnen bereitgestellten Referenztrajektorie.",alternates:localizedAlternates("/esg/crrem-pathways","de")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
