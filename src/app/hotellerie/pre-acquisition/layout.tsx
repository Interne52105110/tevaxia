import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Pré-acquisition hôtelière documentée | Tevaxia",description:"Analyse de trésorerie d’un projet d’acquisition. Aucun prix de marché, multiple sectoriel, croissance ou score d’achat n’est présumé. Chaque montant et chaque année nécessitent une justification.",alternates:localizedAlternates("/hotellerie/pre-acquisition","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
