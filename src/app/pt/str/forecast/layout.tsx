import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Projeção mensal de alojamento local",description:"Cenário para uma unidade disponível todos os dias do calendário. A partir de 24 meses consecutivos: Holt-Winters aditivo; com 6–23 meses: média constante. A duração do histórico não comprova fiabilidade.",alternates:localizedAlternates("/str/forecast","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
