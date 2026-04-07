import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Flächenumrechner Luxemburg — BGF, GF, Wohnfläche ILNAS 101",
  description: "Umrechnung zwischen BGF, Geschossfläche, Nutzfläche und Wohnfläche (ILNAS 101:2016). ACT-Gewichtung für Balkone, Keller, Terrassen. OAI FC.04 Normen.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
