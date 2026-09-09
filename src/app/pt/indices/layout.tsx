import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Índices imobiliários e observações municipais",description:"Série nacional Eurostat e médias municipais de transações do Observatório da Habitação. A diferença entre preços anunciados e registados não é uma tendência temporal, desconto negociável ou medida da saúde do mercado.",alternates:localizedAlternates("/indices","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
