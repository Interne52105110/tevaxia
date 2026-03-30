// ============================================================
// NARRATIVE — Génération de texte d'analyse (templates, 0 coût)
// ============================================================
// Assemble un texte structuré à partir des résultats de valorisation.
// Pas d'IA — du remplissage de templates intelligent.

import { formatEUR, formatPct } from "./calculations";

interface NarrativeInput {
  // Contexte
  commune?: string;
  quartier?: string;
  assetType: string;
  evsType: string;
  surface: number;
  // Valeurs
  valeurComparaison?: number;
  valeurCapitalisation?: number;
  valeurDCF?: number;
  valeurReconciliee?: number;
  // Capitalisation
  noi?: number;
  tauxCap?: number;
  rendementInitial?: number;
  rendementReversionnaire?: number;
  sousLoue?: boolean;
  // DCF
  irr?: number;
  tauxActualisation?: number;
  tauxCapSortie?: number;
  // MLV
  mlv?: number;
  ratioMLV?: number;
  // ESG
  esgScore?: number;
  esgNiveau?: string;
  esgImpact?: number;
  classeEnergie?: string;
  // Marché
  prixM2Commune?: number;
  nbTransactions?: number;
}

function positionVsMarche(valeurM2: number, marchM2: number): string {
  const ecart = ((valeurM2 - marchM2) / marchM2) * 100;
  if (ecart > 10) return `nettement au-dessus de la moyenne communale (${formatEUR(marchM2)}/m², +${ecart.toFixed(0)}%)`;
  if (ecart > 3) return `légèrement au-dessus de la moyenne communale (${formatEUR(marchM2)}/m², +${ecart.toFixed(0)}%)`;
  if (ecart > -3) return `en ligne avec la moyenne communale (${formatEUR(marchM2)}/m²)`;
  if (ecart > -10) return `légèrement en dessous de la moyenne communale (${formatEUR(marchM2)}/m², ${ecart.toFixed(0)}%)`;
  return `nettement en dessous de la moyenne communale (${formatEUR(marchM2)}/m², ${ecart.toFixed(0)}%)`;
}

function coherenceMethodes(vals: number[]): string {
  if (vals.length < 2) return "";
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const moy = vals.reduce((s, v) => s + v, 0) / vals.length;
  const ecart = ((max - min) / moy) * 100;
  if (ecart < 5) return "Les méthodes convergent de manière remarquable, ce qui renforce la fiabilité de l'estimation.";
  if (ecart < 15) return "Les méthodes présentent une cohérence satisfaisante, l'écart restant dans les limites acceptables.";
  if (ecart < 25) return "Un écart significatif est constaté entre les méthodes. Il convient d'analyser les hypothèses retenues pour identifier la source de divergence.";
  return "L'écart important entre les méthodes appelle une analyse approfondie. Les hypothèses de chaque approche doivent être revues et justifiées.";
}

export function genererNarrative(input: NarrativeInput): string {
  const sections: string[] = [];

  // 1. Introduction
  const localisation = input.quartier
    ? `${input.quartier}, commune de ${input.commune}`
    : input.commune || "localisation non précisée";

  sections.push(
    `Le bien objet de la présente analyse est un ${input.assetType.toLowerCase()} d'une surface de ${input.surface} m², situé à ${localisation}. L'évaluation est réalisée sur la base de la ${input.evsType} conformément aux European Valuation Standards 2025 (TEGOVA, 10e édition).`
  );

  // 2. Contexte marché
  if (input.prixM2Commune) {
    const contexte = input.nbTransactions && input.nbTransactions > 50
      ? `Le marché local présente un volume de transactions significatif (${input.nbTransactions} transactions sur la dernière période), ce qui confère une bonne fiabilité aux données de référence.`
      : input.nbTransactions
      ? `Le marché local présente un volume de transactions limité (${input.nbTransactions} transactions), ce qui appelle à la prudence dans l'interprétation des comparables.`
      : "";
    sections.push(
      `Le prix moyen observé sur la commune s'établit à ${formatEUR(input.prixM2Commune)}/m² pour les appartements existants (source : Observatoire de l'Habitat, actes notariés). ${contexte}`
    );
  }

  // 3. Résultats par méthode
  const valeurs: number[] = [];

  if (input.valeurComparaison && input.valeurComparaison > 0) {
    valeurs.push(input.valeurComparaison);
    const m2 = input.surface > 0 ? input.valeurComparaison / input.surface : 0;
    let position = "";
    if (input.prixM2Commune && m2 > 0) {
      position = ` Ce niveau de prix se situe ${positionVsMarche(m2, input.prixM2Commune)}.`;
    }
    sections.push(
      `**Méthode par comparaison** — La valeur ressort à ${formatEUR(input.valeurComparaison)}, soit ${formatEUR(Math.round(m2))}/m².${position}`
    );
  }

  if (input.valeurCapitalisation && input.valeurCapitalisation > 0 && input.noi) {
    valeurs.push(input.valeurCapitalisation);
    let detail = `Le résultat net d'exploitation s'élève à ${formatEUR(input.noi)}, capitalisé au taux de ${input.tauxCap?.toFixed(2)}%.`;
    if (input.rendementReversionnaire !== undefined && input.sousLoue !== undefined) {
      detail += input.sousLoue
        ? ` Le bien est actuellement sous-loué par rapport au marché — un potentiel de réversion existe au renouvellement du bail.`
        : ` Le bien est loué au-dessus du marché — un risque de réversion à la baisse existe à l'échéance du bail.`;
    }
    sections.push(
      `**Méthode par capitalisation** — La valeur ressort à ${formatEUR(input.valeurCapitalisation)}. ${detail}`
    );
  }

  if (input.valeurDCF && input.valeurDCF > 0) {
    valeurs.push(input.valeurDCF);
    const irrText = input.irr ? ` Le taux de rendement interne (TRI) s'établit à ${(input.irr * 100).toFixed(2)}%.` : "";
    sections.push(
      `**Méthode par actualisation des flux futurs (DCF)** — La valeur ressort à ${formatEUR(input.valeurDCF)}, sur la base d'un taux d'actualisation de ${input.tauxActualisation?.toFixed(2)}% et d'un taux de sortie de ${input.tauxCapSortie?.toFixed(2)}%.${irrText}`
    );
  }

  // 4. Cohérence
  if (valeurs.length >= 2) {
    sections.push(coherenceMethodes(valeurs));
  }

  // 5. Réconciliation
  if (input.valeurReconciliee && input.valeurReconciliee > 0) {
    sections.push(
      `**Valeur réconciliée** — Après pondération des méthodes, la valeur de marché est estimée à **${formatEUR(input.valeurReconciliee)}**, soit ${formatEUR(Math.round(input.valeurReconciliee / input.surface))}/m².`
    );
  }

  // 6. MLV
  if (input.mlv && input.mlv > 0 && input.ratioMLV) {
    sections.push(
      `**Valeur hypothécaire (MLV)** — Après application des décotes prudentielles conformément au CRR Art. 229, la valeur hypothécaire s'établit à ${formatEUR(input.mlv)}, soit ${(input.ratioMLV * 100).toFixed(1)}% de la valeur de marché.`
    );
  }

  // 7. ESG
  if (input.esgScore !== undefined) {
    const esgComment = input.esgScore >= 60
      ? `Le profil ESG du bien est favorable (score ${input.esgScore}/100, niveau ${input.esgNiveau}), ce qui constitue un atout dans le contexte réglementaire actuel.`
      : input.esgScore >= 40
      ? `Le profil ESG est moyen (score ${input.esgScore}/100, niveau ${input.esgNiveau}). Des travaux de rénovation énergétique pourraient améliorer la valorisation.`
      : `Le profil ESG est insuffisant (score ${input.esgScore}/100, niveau ${input.esgNiveau}). La décote énergétique estimée est de ${input.esgImpact}%. Une rénovation est recommandée.`;

    if (input.classeEnergie) {
      sections.push(
        `**Facteurs ESG** — Le bien présente une classe énergie ${input.classeEnergie}. ${esgComment}`
      );
    }
  }

  // 8. Réserves
  sections.push(
    `La présente analyse est réalisée à titre indicatif sur la base des données publiques disponibles et des paramètres renseignés par l'utilisateur. Elle ne constitue pas une expertise en évaluation immobilière au sens des EVS 2025 ni de la Charte de l'expertise. Pour une évaluation officielle, il convient de consulter un évaluateur certifié TEGOVA (REV/TRV).`
  );

  return sections.join("\n\n");
}
