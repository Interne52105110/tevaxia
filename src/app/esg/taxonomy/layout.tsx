import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Taxonomie UE : préparer le contrôle 7.7",description:"Acquisition et propriété de bâtiments, contribution à l’atténuation du changement climatique. Vérifiez les seuils et rassemblez les justificatifs pour une revue du dossier.",alternates:localizedAlternates("/esg/taxonomy","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
