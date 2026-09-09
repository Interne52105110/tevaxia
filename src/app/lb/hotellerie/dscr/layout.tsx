import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Dokumentéiert Hotel-Scholdendeckung | Tevaxia",description:"Monatlech Amortiséierung, dokumentéierte Cashflow, aginnenen Zil-DSCR, LTV mat belegtem Wäert an explizitte Stresscashflow.",alternates:localizedAlternates("/hotellerie/dscr","lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
