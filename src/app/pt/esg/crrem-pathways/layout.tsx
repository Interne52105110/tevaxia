import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Comparar trajetórias de energia e carbono",description:"Calcule intensidades a partir de um balanço anual documentado e compare, ano a ano, um cenário do edifício com uma trajetória de referência fornecida por si.",alternates:localizedAlternates("/esg/crrem-pathways","pt")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
