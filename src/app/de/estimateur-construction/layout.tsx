import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Dokumentiertes Baubudget",description:"Erstellen Sie ein Budget aus Ihren Angeboten und benannten Annahmen. Geben Sie alle Preise einschließlich MwSt. in Euro an. Es werden keine Tarife, Honorare oder Energieaufschläge vorausgesetzt.",alternates:localizedAlternates('/estimateur-construction',"de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
