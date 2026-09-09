import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Immobilienindizes und Gemeindebeobachtungen",description:"Nationale Eurostat-Reihe und kommunale Transaktionsmittelwerte des Wohnungsobservatoriums. Die Differenz zwischen Angebots- und registrierten Preisen ist weder zeitlicher Trend noch verhandelbarer Abschlag oder Maß für die Marktgesundheit.",alternates:localizedAlternates("/indices","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
