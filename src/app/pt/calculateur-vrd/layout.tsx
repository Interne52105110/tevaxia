import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Orçamento VRD e medições declaradas",description:"Orçamente vias e redes com quantidades e preços com IVA documentados. Os nove lotes sugeridos auxiliam a classificação, sem tarifas Batiprix, CTG ou Creos integradas. O declive, solo e distâncias de transporte devem constar das suas propostas; não é aplicado qualquer coeficiente automático.",alternates:localizedAlternates('/calculateur-vrd',"pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
