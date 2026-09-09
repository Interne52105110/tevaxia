import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ: Klassifizierungsschwellen prüfen",description:"Geben Sie die Erfüllungsgrade aus Ihrer vollständigen LENOZ-Akte ein, um die veröffentlichten Schwellen des Ministeriums zu prüfen. Diese Seite ersetzt nicht die fachliche Kriterienbewertung.",alternates:localizedAlternates("/energy/lenoz","de")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
