import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ: verificar limiares de classificação",description:"Introduza percentagens de realização do dossier LENOZ completo para verificar os limiares publicados pelo ministério. Esta página não substitui a avaliação dos critérios pelo perito.",alternates:localizedAlternates("/energy/lenoz","pt")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
