import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Transações hoteleiras publicadas — seleção europeia | Tevaxia",description:"Seleção limitada de operações identificadas em comunicados das partes, verificados em 9 de setembro de 2026. Cada montante mantém o âmbito publicado. Esta seleção não mede o volume do mercado luxemburguês nem da Grande Região.",alternates:localizedAlternates("/hotellerie/transactions","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
