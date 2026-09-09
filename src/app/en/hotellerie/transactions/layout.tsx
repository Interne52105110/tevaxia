import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Published hotel transactions — European selection | Tevaxia",description:"Limited selection of transactions identified in releases by the parties, checked on 9 September 2026. Each amount retains its published scope. This selection does not measure Luxembourg or Greater Region market volume.",alternates:localizedAlternates("/hotellerie/transactions","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
