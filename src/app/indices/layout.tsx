import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Indices immobiliers et observations communales",description:"Série nationale Eurostat et moyennes de transactions par commune issues de l’Observatoire de l’Habitat. L’écart entre prix annoncés et prix enregistrés ne constitue ni une tendance temporelle, ni une décote négociable, ni une mesure de santé du marché.",alternates:localizedAlternates("/indices","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
