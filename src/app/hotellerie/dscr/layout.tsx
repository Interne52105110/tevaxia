import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Couverture de dette hôtelière documentée | Tevaxia",description:"Amortissement mensuel, flux disponible documenté, DSCR cible saisi, LTV sur valeur justifiée et scénario de flux explicite.",alternates:localizedAlternates("/hotellerie/dscr","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
