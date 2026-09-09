import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Eng Energiestudie virbereeden",description:"20 Froen, fir Är Informatioune virun engem Rendez-vous mat engem Fachmann ze sammelen. Dir kënnt „Ech weess et net“ wielen. Dëse Questionnaire berechent net d’Energieeffizienz vun Ärem Gebai.",openGraph:{title:"Eng Energiestudie virbereeden",description:"20 Froen, fir Är Informatioune virun engem Rendez-vous mat engem Fachmann ze sammelen. Dir kënnt „Ech weess et net“ wielen. Dëse Questionnaire berechent net d’Energieeffizienz vun Ärem Gebai.",type:"website"},alternates:localizedAlternates("/energy/audit","lb")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
