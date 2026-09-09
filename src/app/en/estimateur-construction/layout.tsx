import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Documented construction budget",description:"Build a budget from your quotes and identified assumptions. Enter all prices including VAT in euros. No tariff, professional fee or energy premium is assumed.",alternates:localizedAlternates('/estimateur-construction',"en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
