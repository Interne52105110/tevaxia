import type { Metadata } from "next";
import { localizedAlternates, NOINDEX_METADATA } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Portfolio énergétique multi-biens",
  description: "Inventoriez vos biens, leurs classes CPE déclarées, surfaces et valeurs saisies. Répartition du portefeuille, import CSV et rapport PDF.",
  alternates: localizedAlternates("/energy/portfolio", "fr"),
  ...NOINDEX_METADATA,
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
