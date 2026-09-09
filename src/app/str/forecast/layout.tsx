import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Projection mensuelle STR",description:"Scénario pour un logement disponible tous les jours du calendrier. À partir de 24 mois consécutifs : Holt-Winters additif ; de 6 à 23 mois : moyenne constante. Aucun niveau de fiabilité n’est déduit du nombre de mois.",alternates:localizedAlternates("/str/forecast","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
