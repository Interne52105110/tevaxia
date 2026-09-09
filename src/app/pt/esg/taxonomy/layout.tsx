import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Taxonomia UE: preparar a análise 7.7",description:"Aquisição e propriedade de edifícios, mitigação das alterações climáticas. Verifique os limiares e reúna os comprovativos para análise do processo.",alternates:localizedAlternates("/esg/taxonomy","pt")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
