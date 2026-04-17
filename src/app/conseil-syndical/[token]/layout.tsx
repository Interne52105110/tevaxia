import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard conseil syndical — tevaxia.lu",
  description: "Espace lecture-seule conseil syndical : comptes, travaux, alertes anomalies.",
  robots: "noindex,nofollow", // Lien magique privé
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
