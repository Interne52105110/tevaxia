import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Impact CPE sur la valeur immobilière",
  description: "Testez des hypothèses modifiables de valeur par classe CPE. Scénario de sensibilité illustratif, formule et limites explicites.",
  alternates: localizedAlternates("/energy/impact", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
