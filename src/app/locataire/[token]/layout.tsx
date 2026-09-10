import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portail locataire — tevaxia.lu",
  description: "Espace locataire : bail, quittances, paiements, signalement d'incidents.",
  robots: "noindex,nofollow", // Lien magique privé
  referrer: "no-referrer",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
