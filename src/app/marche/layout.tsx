import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Base de données marché immobilier Luxembourg — Prix, loyers, bureaux, commerces",
  description:
    "Données de marché immobilier au Luxembourg : prix résidentiels par commune, bureaux, commerces, logistique, terrains à bâtir et indicateurs macroéconomiques. Sources officielles.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
