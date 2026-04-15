import type { Metadata } from "next";
import { ToolStub } from "../_ToolStub";

export const metadata: Metadata = {
  title: "Valorisation hôtelière (RevPAR / EBITDA) | tevaxia.lu",
  description:
    "Évaluez un hôtel ou motel par la méthode du revenu : RevPAR, ADR, taux d'occupation, EBITDA, multiple de transaction.",
};

export default function ValorisationHotel() {
  return (
    <ToolStub
      title="Valorisation hôtelière"
      subtitle="Méthode du revenu (DCF) + comparables transactionnels"
      description="Un calcul de valeur d'un actif hôtelier combinant approche par le revenu (capitalisation de l'EBITDA stabilisé) et comparables (multiple de RevPAR, prix par chambre). L'outil reproduit la logique des évaluateurs hôteliers professionnels (HVS, JLL, CBRE Hotels) pour des actifs entre 1 M€ et 30 M€."
      methodology={[
        "Calcul RevPAR = ADR × Taux d'occupation",
        "Reconstitution P&L USALI : revenue → GOP → EBITDA",
        "Capitalisation EBITDA stabilisé (cap rate hôtelier 7-12 %)",
        "Cross-check par multiple de prix/chambre selon catégorie",
        "Ajustement pour FF&E reserve et CAPEX différé",
      ]}
      inputs={[
        "Nombre de chambres",
        "ADR moyen et taux d'occupation 3 dernières années",
        "P&L détaillé (revenu chambres, F&B, autres)",
        "Charges opérationnelles (staff, énergie, maintenance)",
        "Catégorie (budget / midscale / upscale / luxury)",
      ]}
      outputs={[
        "Valeur de marché (fourchette basse / centrale / haute)",
        "Multiple de transaction (€/chambre, x EBITDA, x revenu)",
        "RevPAR vs marché (sur/sous-performance)",
        "Sensibilité aux taux d'occupation et ADR",
        "Export PDF synthèse pour banque / vendeur",
      ]}
    />
  );
}
