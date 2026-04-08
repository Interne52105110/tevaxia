import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "À propos — Erwan Bargain, expert immobilier REV TEGOVA",
  description: "Expert en évaluation immobilière certifié REV TEGOVA, basé au Luxembourg. 16 ans d'expérience, +1 500 évaluations. Créateur de tevaxia.lu et bargain-expertise.fr.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
