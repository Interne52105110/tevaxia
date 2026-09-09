import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Dokumentéierten Hotelverglach | Tevaxia",description:"Dokumentéiert Observatiounen iwwer eng gemeinsam Period vun 1 bis 366 Deeg vergläichen. Keng virausgefëllte STR-, Horwath- oder regional Moyennen. D’Resultater beschreiwen nëmmen déi aginne Stéchprouf; hir Relevanz muss begrënnt ginn.",alternates:localizedAlternates("/hotellerie/compset","lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
