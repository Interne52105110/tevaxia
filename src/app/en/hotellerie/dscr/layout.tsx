import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Documented hotel debt coverage | Tevaxia",description:"Monthly amortisation, documented available cash, entered DSCR target, evidenced-value LTV and explicit cash-flow stress.",alternates:localizedAlternates("/hotellerie/dscr","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
