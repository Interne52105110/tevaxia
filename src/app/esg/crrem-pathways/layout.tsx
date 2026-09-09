import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Comparer des trajectoires énergie et carbone",description:"Calculez des intensités à partir d’un bilan documenté, puis comparez année par année un scénario de bâtiment avec une trajectoire de référence que vous fournissez.",alternates:localizedAlternates("/esg/crrem-pathways","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
