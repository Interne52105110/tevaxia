import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Valorisation immobilière — scénarios et références",
  description: "Comparez des ventes documentées, capitalisez un revenu ou actualisez des flux, puis choisissez les pondérations adaptées à votre dossier.",
  alternates: localizedAlternates("/valorisation", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
