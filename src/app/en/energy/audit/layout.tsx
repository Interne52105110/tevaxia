import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Prepare an energy assessment",description:"20 questions to gather information before meeting a professional. You may answer “I do not know”. This questionnaire does not calculate your building’s energy performance.",openGraph:{title:"Prepare an energy assessment",description:"20 questions to gather information before meeting a professional. You may answer “I do not know”. This questionnaire does not calculate your building’s energy performance.",type:"website"},alternates:localizedAlternates("/energy/audit","en")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
