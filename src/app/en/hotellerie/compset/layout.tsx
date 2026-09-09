import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Documented hotel comparison | Tevaxia",description:"Compare documented observations over a common period of 1 to 366 days. No STR, Horwath or regional averages are prefilled. Results describe only the entered sample, whose relevance needs justification.",alternates:localizedAlternates("/hotellerie/compset","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
