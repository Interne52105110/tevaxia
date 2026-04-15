import type { Metadata } from "next";
import { ToolStub } from "../_ToolStub";

export const metadata: Metadata = {
  title: "Score visa E-2 / investisseur | tevaxia.lu",
  description:
    "Évaluez l'éligibilité d'une acquisition hôtelière au visa investisseur E-2 (US) : capital substantiel, création d'emplois, marginalité.",
};

export default function ScoreE2() {
  return (
    <ToolStub
      title="Score visa E-2 / investisseur"
      subtitle="Éligibilité E-2 (US) : capital substantiel, emplois créés, non-marginal"
      description="L'acquisition d'un hôtel ou motel reste l'une des voies privilégiées pour le visa E-2 (Treaty Investor) américain — accessible aux ressortissants de pays en traité (FR, BE, LU, DE, etc.). Les critères USCIS sont flous : capital « substantiel », entreprise « non-marginale », « création d'emplois ». Cet outil calcule un score d'éligibilité basé sur les critères réels appliqués par les officiers consulaires."
      methodology={[
        "Substantiality test : capital investi vs coût total du business (ratio cible >50 %)",
        "At-risk test : fonds réellement engagés (escrow, signature, travaux)",
        "Marginality test : revenu attendu > simple revenu de subsistance pour la famille",
        "Job creation : nombre d'emplois US créés ou maintenus",
        "Real & operating : business actif (vs holding) — l'hôtel coche par défaut",
      ]}
      inputs={[
        "Prix d'acquisition + travaux + working capital",
        "Apport personnel et provenance des fonds",
        "Effectif post-acquisition (FTE US)",
        "EBITDA prévisionnel année 2-3",
        "Composition du foyer (visas dépendants)",
      ]}
      outputs={[
        "Score global E-2 sur 100 (avec breakdown par critère)",
        "Diagnostic par sous-test (substantiality, marginality, etc.)",
        "Points d'attention pour le dossier (red flags)",
        "Comparaison avec seuils de jurisprudence consulaire",
        "Liste documents à préparer pour le formulaire DS-160",
      ]}
    />
  );
}
