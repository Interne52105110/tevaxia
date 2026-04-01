import type { Metadata } from "next";
import EnergyHeader from "@/components/energy/EnergyHeader";
import EnergyFooter from "@/components/energy/EnergyFooter";

export const metadata: Metadata = {
  title: {
    default: "energy.tevaxia.eu — Simulateurs Énergie Immobilier Luxembourg",
    template: "%s | energy.tevaxia.eu",
  },
  description:
    "Simulateurs de performance énergétique pour l'immobilier au Luxembourg. Impact CPE sur la valeur, ROI rénovation, communautés d'énergie.",
  openGraph: {
    title: "energy.tevaxia.eu — Simulateurs Énergie Immobilier",
    description:
      "Impact énergétique sur la valeur, ROI rénovation, communautés d'énergie renouvelable. Outils de simulation pour le Luxembourg.",
    url: "https://energy.tevaxia.eu",
    siteName: "energy.tevaxia.eu",
    locale: "fr_LU",
    type: "website",
  },
};

export default function EnergyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EnergyHeader />
      <main className="flex-1">{children}</main>
      <EnergyFooter />
    </>
  );
}
