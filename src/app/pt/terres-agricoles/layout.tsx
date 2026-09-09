import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Terrenos agrícolas — cálculo documentado | Tevaxia",
  description: "Cálculo agrícola com preços e custos documentados, conversão hectare/m² e série nacional SER publicada.",
  alternates: localizedAlternates("/terres-agricoles", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
