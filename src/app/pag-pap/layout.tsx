import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Analyse PAG / PAP Luxembourg — Urbanisme et constructibilité",
  description: "Zones PAG, PAP Nouveau Quartier et Quartier Existant, COS, CMU, servitudes CTV/CTL, procédures d'autorisation. Guide urbanistique luxembourgeois.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
