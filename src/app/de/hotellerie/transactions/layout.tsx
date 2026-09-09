import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Veröffentlichte Hoteltransaktionen — europäische Auswahl | Tevaxia",description:"Begrenzte Auswahl von Transaktionen aus Mitteilungen der Parteien, geprüft am 9. September 2026. Jeder Betrag behält seinen veröffentlichten Umfang. Die Auswahl misst kein Marktvolumen Luxemburgs oder der Großregion.",alternates:localizedAlternates("/hotellerie/transactions","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
