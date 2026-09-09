import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Energie- a Kuelestofftrajektorië vergläichen",description:"Berechent Intensitéiten aus engem dokumentéierte Joresbilan a vergläicht e Gebaiszenario Joer fir Joer mat enger Referenztrajektorie, déi Dir liwwert.",alternates:localizedAlternates("/esg/crrem-pathways","lb")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
