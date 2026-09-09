import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Atividade hoteleira no Luxemburgo — Eurostat | Tevaxia",description:"Séries mensais oficiais para o Luxemburgo: hotéis e alojamentos similares (NACE I55.1), residentes e não residentes em conjunto. Os dados nacionais não descrevem um hotel individual nem uma categoria de estrelas.",alternates:localizedAlternates("/hotellerie/observatoire-lu","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
