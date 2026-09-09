import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Dokumentierter Hotelankauf | Tevaxia",description:"Zahlungsstromanalyse eines Erwerbsprojekts. Keine angenommenen Marktpreise, Branchenmultiplikatoren, Wachstumsraten oder Kaufbewertungen. Jeder Betrag und jedes Jahr benötigt einen Beleg.",alternates:localizedAlternates("/hotellerie/pre-acquisition","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
