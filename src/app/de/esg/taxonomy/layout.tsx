import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"EU-Taxonomie: Prüfung nach 7.7 vorbereiten",description:"Erwerb und Eigentum von Gebäuden, Klimaschutz. Prüfen Sie Schwellenwerte und stellen Sie Belege für die Prüfung des Dossiers zusammen.",alternates:localizedAlternates("/esg/taxonomy","de")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
