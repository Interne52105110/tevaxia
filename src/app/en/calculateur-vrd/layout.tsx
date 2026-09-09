import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Documented civil works budget and quantities",description:"Price road and utility works using documented quantities and VAT-inclusive prices. The nine suggested lots are classification aids, with no integrated Batiprix, CTG or Creos tariff. Slope, soil conditions and transport distances must be reflected in your quotes; no multiplier is added automatically.",alternates:localizedAlternates('/calculateur-vrd',"en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
