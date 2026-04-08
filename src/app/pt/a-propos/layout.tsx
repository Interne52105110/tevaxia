import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre — Erwan Bargain, perito imobiliário REV TEGOVA",
  description:
    "Perito em avaliação imobiliária certificado REV TEGOVA, sediado no Luxemburgo. 16 anos de experiência, mais de 1.500 avaliações. Criador de tevaxia.lu e bargain-expertise.fr.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
