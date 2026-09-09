import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Immobilienbewertung — Szenarien und Referenzen",
  description: "Vergleichen Sie dokumentierte Verkäufe, kapitalisieren Sie Erträge oder diskontieren Sie Zahlungsströme und wählen Sie passende Gewichte.",
  alternates: localizedAlternates("/valorisation", "de"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
