import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Dokumentiertes Tiefbaubudget und Aufmaß",description:"Kalkulieren Sie Straßen- und Leitungsarbeiten mit dokumentierten Mengen und Bruttopreisen. Die neun vorgeschlagenen Lose dienen der Gliederung, ohne integrierte Batiprix-, CTG- oder Creos-Tarife. Gefälle, Bodenverhältnisse und Transportentfernungen müssen in Ihren Angeboten berücksichtigt sein; es wird kein Faktor automatisch hinzugefügt.",alternates:localizedAlternates('/calculateur-vrd',"de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
