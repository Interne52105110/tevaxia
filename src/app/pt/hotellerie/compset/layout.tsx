import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Comparação hoteleira documentada | Tevaxia",description:"Comparar observações documentadas num período comum de 1 a 366 dias. Não existem médias STR, Horwath ou regionais pré-preenchidas. Os resultados descrevem apenas a amostra introduzida, cuja relevância deve ser justificada.",alternates:localizedAlternates("/hotellerie/compset","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
