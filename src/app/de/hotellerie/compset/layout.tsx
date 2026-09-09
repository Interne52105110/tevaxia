import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Dokumentierter Hotelvergleich | Tevaxia",description:"Dokumentierte Beobachtungen über einen gemeinsamen Zeitraum von 1 bis 366 Tagen vergleichen. Keine vorausgefüllten STR-, Horwath- oder Regionalwerte. Ergebnisse beschreiben nur die eingegebene Stichprobe; ihre Eignung ist zu begründen.",alternates:localizedAlternates("/hotellerie/compset","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
