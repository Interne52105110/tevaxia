import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Hotelfrequentatioun zu Lëtzebuerg — Eurostat | Tevaxia",description:"Offiziell Mountsreie fir Lëtzebuerg: Hoteller an änlech Ënnerkonften (NACE I55.1), Awunner an Net-Awunner zesummen. National Date beschreiwe weder en eenzelen Hotel nach eng Stärekategorie.",alternates:localizedAlternates("/hotellerie/observatoire-lu","lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
