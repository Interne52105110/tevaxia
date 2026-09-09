import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Monthly short-stay projection",description:"Scenario for one unit available every calendar day. With 24 consecutive months: additive Holt-Winters; with 6–23 months: constant mean. History length does not establish reliability.",alternates:localizedAlternates("/str/forecast","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
