import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Terres agricoles — calcul documenté | Tevaxia",
  description: "Calcul agricole avec prix et coûts documentés, conversion hectare/m² et série nationale SER publiée.",
  alternates: localizedAlternates("/terres-agricoles", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
