import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Dokumentéierten Hotelkaf | Tevaxia",description:"Geldflossanalyse vun engem Kafprojet. Keng ugeholl Maartpräisser, Branchenmultiple, Wuesstemsraten oder Kafscoren. All Betrag an all Joer brauch eng Begrënnung.",alternates:localizedAlternates("/hotellerie/pre-acquisition","lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
