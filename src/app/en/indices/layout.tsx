import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Property indices and municipal observations",description:"Eurostat national series and municipal transaction averages from the Housing Observatory. The gap between asking and recorded prices is neither a time trend, a negotiable discount nor a measure of market health.",alternates:localizedAlternates("/indices","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
