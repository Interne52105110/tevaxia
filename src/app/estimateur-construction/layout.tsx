import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Budget de construction documenté",description:"Construisez un budget à partir de vos devis et hypothèses identifiées. Saisissez tous les prix TTC, dans une même devise (euro). Aucun tarif, honoraire ou surcoût énergétique n’est présumé.",alternates:localizedAlternates('/estimateur-construction',"fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
