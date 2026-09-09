import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Valorisation hôtelière documentée | Tevaxia",description:"Capitalisation directe d’un revenu justifié et comparaison de transactions par chambre, avec références et pondérations explicites.",alternates:localizedAlternates("/hotellerie/valorisation","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
