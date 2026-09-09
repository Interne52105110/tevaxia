import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ : vérifier les seuils de classement",description:"Renseignez les degrés de réalisation issus de votre dossier LENOZ complet pour vérifier les seuils publiés par le ministère. Cette page ne remplace pas l’évaluation des critères par l’expert.",alternates:localizedAlternates("/energy/lenoz","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
