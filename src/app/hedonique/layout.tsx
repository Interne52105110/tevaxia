import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Données et limites de l’estimation",
  description: "Estimation indicative avec hypothèses internes. Consulter la méthodologie avant utilisation.",
  alternates: localizedAlternates("/hedonique", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
