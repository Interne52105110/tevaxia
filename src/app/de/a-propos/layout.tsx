import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Über uns — Erwan Bargain, REV TEGOVA Immobiliensachverständiger",
  description:
    "In Luxemburg ansässiger Immobilienbewertungsexperte, zertifiziert REV TEGOVA. 16 Jahre Erfahrung, über 1.500 Bewertungen. Gründer von tevaxia.lu und bargain-expertise.fr.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
