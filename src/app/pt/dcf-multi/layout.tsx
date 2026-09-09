import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "DCF multiarrendatário — fluxos mensais esperados",
  description: "Cenário determinístico: entradas iguais produzem resultados iguais. Os parâmetros iniciais são indicativos e os exemplos fictícios. Os fluxos mensais são agrupados por ano e descontados no final do ano.",
  alternates: localizedAlternates("/dcf-multi", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
