import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Scénarios de prix immobiliers — hypothèses personnalisées",description:"Projection arithmétique de prix immobiliers à partir d’un prix de départ et de trois taux déclarés. Aucun historique reconstitué ni prévision statistique.",alternates:localizedAlternates('/marche/forecast','fr')};
export default function Layout({children}:{children:React.ReactNode}){return children;}
