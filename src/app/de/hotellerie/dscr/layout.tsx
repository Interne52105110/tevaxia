import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Dokumentierte Hotel-Schuldendienstdeckung | Tevaxia",description:"Monatliche Tilgung, dokumentierter Cashflow, erfasster Ziel-DSCR, LTV mit belegtem Wert und explizites Stressszenario.",alternates:localizedAlternates("/hotellerie/dscr","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
