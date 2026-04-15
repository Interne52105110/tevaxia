import type { Metadata } from "next";
import { ToolStub } from "../_ToolStub";

export const metadata: Metadata = {
  title: "Rénovation énergétique hôtel | tevaxia.lu",
  description:
    "Coût de rénovation énergétique d'un hôtel par chambre, ROI sur factures énergie, impact RevPAR (label éco), aides Klimabonus tertiaire.",
};

export default function RenovationHotel() {
  return (
    <ToolStub
      title="Rénovation énergétique hôtelière"
      subtitle="Coûts par chambre, ROI factures, impact RevPAR, aides tertiaire"
      description="La rénovation énergétique d'un hôtel a un double ROI : économies sur les factures (énergie = 4-8 % du revenu) et gain RevPAR via labels (Green Key, EU Ecolabel, BREEAM). Au Luxembourg, le Klimabonus tertiaire couvre une partie significative des travaux. Cet outil quantifie les deux effets et calcule le payback."
      methodology={[
        "Coûts de rénovation par poste (isolation, CVC, ECS, éclairage LED)",
        "Réduction consommation modélisée (ratio kWh/m²/an avant/après)",
        "Aides Klimabonus tertiaire applicables (taux selon type travaux)",
        "Gain RevPAR estimé via labels écologiques (+2 à 5 %)",
        "Payback simple et VAN actualisée 10 ans",
      ]}
      inputs={[
        "Surface chauffée totale",
        "Nombre de chambres",
        "Consommation actuelle (kWh/an, ou estimée par classe CPE)",
        "Travaux envisagés (cases à cocher par poste)",
        "ADR actuel et taux d'occupation",
      ]}
      outputs={[
        "Coût total travaux + aides Klimabonus déduites",
        "Économies annuelles factures énergie (10 ans)",
        "Gain RevPAR potentiel via labels",
        "Payback (avec et sans gain RevPAR)",
        "Note CPE projetée après travaux",
      ]}
    />
  );
}
