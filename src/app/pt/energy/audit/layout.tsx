import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Preparar um estudo energético",description:"20 perguntas para reunir informações antes de consultar um profissional. Pode responder « Não sei ». Este questionário não calcula o desempenho energético do edifício.",openGraph:{title:"Preparar um estudo energético",description:"20 perguntas para reunir informações antes de consultar um profissional. Pode responder « Não sei ». Este questionário não calcula o desempenho energético do edifício.",type:"website"},alternates:localizedAlternates("/energy/audit","pt")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
