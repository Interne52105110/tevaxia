import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Orçamento de construção documentado",description:"Prepare um orçamento com base nas suas propostas e hipóteses identificadas. Introduza todos os preços com IVA em euros. Não se presume qualquer tarifa, honorário ou acréscimo energético.",alternates:localizedAlternates('/estimateur-construction',"pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
