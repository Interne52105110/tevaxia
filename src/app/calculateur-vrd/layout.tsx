import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Budget VRD et métrés déclarés",description:"Chiffrez les travaux de voirie et réseaux à partir de quantités et prix TTC documentés. Les neuf lots proposés sont des repères de classement, sans tarif Batiprix, CTG ou Creos intégré. La pente, la nature du sol et les distances de transport doivent être prises en compte dans vos devis ; aucun coefficient n’est ajouté automatiquement.",alternates:localizedAlternates('/calculateur-vrd',"fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
