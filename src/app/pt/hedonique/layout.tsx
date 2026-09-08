import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Dados e limites da estimativa",
  description: "Estimativa indicativa com hipóteses internas. Leia a metodologia antes de utilizar.",
  alternates: localizedAlternates("/hedonique", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
