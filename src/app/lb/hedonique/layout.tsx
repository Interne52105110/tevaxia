import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Donnéeën a Grenze vun der Schätzung",
  description: "Indikativ Schätzung mat internen Hypotheesen. Liest d’Method virum Gebrauch.",
  alternates: localizedAlternates("/hedonique", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
