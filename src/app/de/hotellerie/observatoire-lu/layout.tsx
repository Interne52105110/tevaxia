import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Hotelaufkommen in Luxemburg — Eurostat | Tevaxia",description:"Offizielle Monatsreihen für Luxemburg: Hotels und ähnliche Beherbergungsbetriebe (NACE I55.1), Inländer und Ausländer zusammen. Nationale Daten beschreiben weder ein einzelnes Hotel noch eine Sternekategorie.",alternates:localizedAlternates("/hotellerie/observatoire-lu","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
