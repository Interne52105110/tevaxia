import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Bilan promoteur documenté | Tevaxia",
  description: "Recettes et dépenses documentées, bénéfice avant impôt, marge cible et budget foncier résiduel. Échéancier mensuel déclaré et dossier JSON rechargeable.",
  alternates: localizedAlternates("/bilan-promoteur", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
