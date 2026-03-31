// ============================================================
// BAIL EMPHYTÉOTIQUE — Décote de valeur
// ============================================================
// Au Luxembourg, certains biens sont vendus en bail emphytéotique
// (typiquement 99 ans). L'acquéreur paie un canon annuel et ne
// possède pas le terrain (il revient au bailleur à l'échéance).
//
// La décote théorique dépend de :
// - La durée restante du bail
// - Le taux d'actualisation (coût d'opportunité du foncier)
// - Le canon annuel payé
//
// En pratique au Luxembourg, la décote est souvent compensée par
// la hausse des prix, mais elle existe et doit être mentionnée.

export interface EmphyteoseInput {
  valeurPleinePropriete: number; // Valeur si pleine propriété
  dureeRestante: number; // Années restantes
  canonAnnuel: number; // Redevance annuelle au bailleur
  tauxActualisation: number; // % — coût d'opportunité
}

export interface EmphyteoseResult {
  valeurEmphyteose: number;
  decote: number;
  decotePct: number;
  valeurCanonsActualises: number;
  explication: string;
}

export function calculerDecoteEmphyteose(input: EmphyteoseInput): EmphyteoseResult {
  const { valeurPleinePropriete, dureeRestante, canonAnnuel, tauxActualisation } = input;

  // Valeur du droit de jouissance = valeur PP - valeur résiduelle du terrain actualisée
  // + déduction des canons futurs actualisés
  const r = tauxActualisation / 100;

  // Valeur résiduelle du terrain (revient au bailleur à l'échéance)
  // Part terrain estimée à ~30-40% de la valeur pour le résidentiel LU
  const partTerrain = 0.35;
  const valeurTerrain = valeurPleinePropriete * partTerrain;
  const valeurTerrainActualisee = r > 0 ? valeurTerrain / Math.pow(1 + r, dureeRestante) : valeurTerrain;

  // Canons futurs actualisés
  const valeurCanonsActualises = r > 0
    ? canonAnnuel * (1 - Math.pow(1 + r, -dureeRestante)) / r
    : canonAnnuel * dureeRestante;

  // Décote = perte du terrain à terme + canons à payer
  const decote = valeurTerrainActualisee + valeurCanonsActualises;
  const valeurEmphyteose = Math.max(0, valeurPleinePropriete - decote);
  const decotePct = valeurPleinePropriete > 0 ? (decote / valeurPleinePropriete) * 100 : 0;

  let explication: string;
  if (dureeRestante > 80) {
    explication = `Avec ${dureeRestante} ans restants, la décote emphytéotique est faible (${decotePct.toFixed(1)}%). La valeur actualisée du terrain perdu à terme est très réduite. Le canon annuel de ${canonAnnuel} € représente le coût principal.`;
  } else if (dureeRestante > 50) {
    explication = `Avec ${dureeRestante} ans restants, la décote est modérée (${decotePct.toFixed(1)}%). La perte du terrain à terme commence à peser, surtout dans les zones à forte valeur foncière.`;
  } else {
    explication = `Avec seulement ${dureeRestante} ans restants, la décote est significative (${decotePct.toFixed(1)}%). La perte du terrain à terme et les canons réduisent sensiblement la valeur. Financement bancaire potentiellement difficile.`;
  }

  return { valeurEmphyteose, decote, decotePct, valeurCanonsActualises, explication };
}
