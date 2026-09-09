import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Méintlech Projektioun fir Kuerzzäitverlounen",description:"Szenario fir eng Eenheet, déi all Kalennerdag disponibel ass. Vun 24 konsekutive Méint un: additiven Holt-Winters; bei 6–23 Méint: konstante Mëttelwäert. D’Längt vun der Historik beweist keng Zouverlässegkeet.",alternates:localizedAlternates("/str/forecast","lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
