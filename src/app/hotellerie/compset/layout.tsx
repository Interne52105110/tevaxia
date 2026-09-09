import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Comparatif hôtelier documenté | Tevaxia",description:"Comparer des observations documentées sur une période commune de 1 à 366 jours. Aucune donnée STR, Horwath ou moyenne régionale n’est préremplie. Les résultats décrivent uniquement l’échantillon saisi et sa pertinence doit être justifiée.",alternates:localizedAlternates("/hotellerie/compset","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
