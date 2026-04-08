import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "PropCalc — Calculateur Immobilier pour WordPress",
  description: "Le calculateur d'investissement immobilier multi-pays pour WordPress. 10 pays, 10 modules, 7 langues. Frais, capacité d'emprunt, rendement locatif, comparateur.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
