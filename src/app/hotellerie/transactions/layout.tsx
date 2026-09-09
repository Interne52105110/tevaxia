import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Transactions hôtelières publiées — sélection européenne | Tevaxia",description:"Sélection limitée d’opérations identifiées dans des communiqués des parties, vérifiés le 9 septembre 2026. Chaque montant conserve son périmètre publié. Cette sélection ne mesure pas le volume du marché luxembourgeois ni celui de la Grande Région.",alternates:localizedAlternates("/hotellerie/transactions","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
