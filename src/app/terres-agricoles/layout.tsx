import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Évaluation terres agricoles Luxembourg",
  description: "Estimation de la valeur des terres agricoles au Luxembourg. Prix par hectare, bâtiments d'exploitation, démolition, désamiantage, constructibilité PAG.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
