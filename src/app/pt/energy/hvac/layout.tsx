import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Aquecimento: comparar necessidades, orçamentos e custos",description:"Compare dois cenários com necessidades de calor, desempenho sazonal, preços e orçamentos introduzidos. Os valores iniciais ilustram o método; não são medições do imóvel nem ofertas comerciais.",alternates:localizedAlternates("/energy/hvac","pt")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
