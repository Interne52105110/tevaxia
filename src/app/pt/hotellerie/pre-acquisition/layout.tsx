import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Aquisição hoteleira documentada | Tevaxia",description:"Análise dos fluxos de caixa de uma aquisição. Não se pressupõem preços de mercado, múltiplos setoriais, crescimento ou pontuações de compra. Cada montante e ano exige justificação.",alternates:localizedAlternates("/hotellerie/pre-acquisition","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
