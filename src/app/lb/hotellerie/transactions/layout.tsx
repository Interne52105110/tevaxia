import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Publizéiert Hoteltransaktiounen — europäesch Auswiel | Tevaxia",description:"Begrenzt Auswiel vun Transaktiounen aus Communiquéë vun de Parteien, gepréift den 9. September 2026. All Betrag behält säi publizéierten Ëmfang. D’Auswiel moosst kee Maartvolume vu Lëtzebuerg oder der Groussregioun.",alternates:localizedAlternates("/hotellerie/transactions","lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
