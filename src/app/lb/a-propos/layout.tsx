import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iwwer — Erwan Bargain, REV TEGOVA Immobilienexpert",
  description:
    "Immobiliebewäertungsexpert zertifizéiert REV TEGOVA, baséiert zu Lëtzebuerg. 16 Joer Erfarung, méi wéi 1.500 Bewäertungen. Grënner vun tevaxia.lu a bargain-expertise.fr.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
