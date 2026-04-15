import type { Metadata } from "next";
import { ToolStub } from "../_ToolStub";

export const metadata: Metadata = {
  title: "DSCR & financement hôtelier | tevaxia.lu",
  description:
    "Calculez la couverture du service de la dette pour une acquisition hôtelière. Stress test occupation, LTV, taux SBA / banque commerciale.",
};

export default function DscrHotel() {
  return (
    <ToolStub
      title="DSCR & financement hôtelier"
      subtitle="Couverture du service de la dette + stress test occupation"
      description="L'acquisition hôtelière est financée différemment d'un immeuble résidentiel : DSCR cible 1,3x à 1,5x, LTV plafonné à 60-70 %, taux supérieurs à l'immobilier classique. Cet outil simule plusieurs structures de financement (bancaire LU/EU, SBA 7(a) US pour visa E-2, equity friends & family) et stresse les hypothèses d'occupation."
      methodology={[
        "DSCR = EBITDA stabilisé / Service de la dette annuel",
        "Stress test : occupation -10 pts, ADR -5 %, double choc",
        "Comparaison structures : amortissement français, in fine, bullet",
        "Calcul du LTV maximum acceptable selon DSCR cible",
        "Coût total du crédit incluant frais de dossier et hypothèque",
      ]}
      inputs={[
        "EBITDA prévisionnel (de l'outil Valorisation ou saisie directe)",
        "Prix d'acquisition + travaux",
        "Apport personnel (equity)",
        "Taux d'intérêt et durée souhaités",
        "DSCR cible (défaut 1,3x banque commerciale)",
      ]}
      outputs={[
        "DSCR scénario central et stressé",
        "Montant maximum empruntable",
        "Tableau d'amortissement annuel",
        "Coût total du crédit (intérêts + frais)",
        "Recommandation structure (bancaire / SBA / mezzanine)",
      ]}
    />
  );
}
