import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Cobertura documentada da dívida hoteleira | Tevaxia",description:"Amortização mensal, fluxo documentado, DSCR pretendido, LTV com valor justificado e cenário de fluxo explícito.",alternates:localizedAlternates("/hotellerie/dscr","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
