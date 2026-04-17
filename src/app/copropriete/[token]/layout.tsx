import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portail copropriétaire — tevaxia.lu",
  description: "Espace personnel copropriétaire : charges, PV d'AG, règlement, historique paiements.",
  robots: "noindex,nofollow", // Lien magique privé
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
