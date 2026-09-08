import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Simulateur d'aides au logement Luxembourg — Bëllegen Akt, Klimabonus",
  description:
    "Estimez les primes au logement 2026 selon les revenus et le foyer. Distinguez Bëllegen Akt, TVA, subvention mensuelle et aides énergétiques à faire chiffrer.",
  alternates: localizedAlternates("/simulateur-aides", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
