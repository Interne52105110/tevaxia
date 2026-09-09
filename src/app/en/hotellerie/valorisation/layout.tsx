import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Documented hotel valuation | Tevaxia",description:"Direct capitalisation of supported income and comparison of transactions per room, with explicit evidence and weights.",alternates:localizedAlternates("/hotellerie/valorisation","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
