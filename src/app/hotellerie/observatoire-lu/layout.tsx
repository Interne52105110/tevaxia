import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Fréquentation hôtelière au Luxembourg — Eurostat | Tevaxia",description:"Séries mensuelles officielles pour le Luxembourg : hôtels et hébergements similaires (NACE I55.1), résidents et non-résidents réunis. Les données nationales ne décrivent ni un hôtel particulier ni une catégorie d’étoiles.",alternates:localizedAlternates("/hotellerie/observatoire-lu","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
