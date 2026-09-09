import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Hotel activity in Luxembourg — Eurostat | Tevaxia",description:"Official monthly series for Luxembourg: hotels and similar accommodation (NACE I55.1), residents and non-residents combined. National data describes neither an individual hotel nor a star category.",alternates:localizedAlternates("/hotellerie/observatoire-lu","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
