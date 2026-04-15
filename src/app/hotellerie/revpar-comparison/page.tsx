import type { Metadata } from "next";
import { ToolStub } from "../_ToolStub";

export const metadata: Metadata = {
  title: "RevPAR vs marché — benchmark | tevaxia.lu",
  description:
    "Comparez RevPAR et ADR de votre hôtel à la concurrence locale. Calcul MPI, ARI, RGI (fair share index) façon STR.",
};

export default function RevparComparison() {
  return (
    <ToolStub
      title="RevPAR vs marché — benchmark"
      subtitle="MPI, ARI, RGI : votre fair share par rapport au compset"
      description="Le RevPAR brut ne dit pas grand-chose : tout dépend du marché. Les indices de performance (MPI, ARI, RGI) calculés par STR ou Hotstats positionnent un hôtel par rapport à un compset (competitive set) — au prix d'un abonnement coûteux. Cet outil reproduit la même logique avec des données saisies ou estimées pour votre marché local."
      methodology={[
        "MPI = (Occupation hôtel / Occupation compset) × 100 — fair share occupation",
        "ARI = (ADR hôtel / ADR compset) × 100 — fair share prix",
        "RGI = (RevPAR hôtel / RevPAR compset) × 100 — fair share global",
        "Identification : sur-prix avec sous-occupation = problème prix",
        "Identification : sous-prix avec sur-occupation = manque à gagner",
      ]}
      inputs={[
        "RevPAR / ADR / occupation de votre hôtel",
        "RevPAR / ADR / occupation moyens du compset (3-5 hôtels)",
        "Saisonnalité (mensuel ou trimestriel)",
        "Catégorie de référence (budget/mid/upscale)",
      ]}
      outputs={[
        "Indices MPI, ARI, RGI mensuels / annuels",
        "Diagnostic (problème prix / problème commercial / sain)",
        "Recommandation stratégique (yield management)",
        "Estimation manque à gagner annuel si RGI < 100",
      ]}
    />
  );
}
