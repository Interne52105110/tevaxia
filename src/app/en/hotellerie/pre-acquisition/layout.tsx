import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Documented hotel acquisition | Tevaxia",description:"Cash flow analysis of an acquisition project. No market price, sector multiple, growth or purchase score is assumed. Each amount and year requires supporting evidence.",alternates:localizedAlternates("/hotellerie/pre-acquisition","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
