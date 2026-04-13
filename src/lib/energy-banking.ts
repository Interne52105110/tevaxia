// ============================================================
// IMPACT CPE SUR LE FINANCEMENT BANCAIRE — Luxembourg
// ============================================================
//
// Modèle d'ajustement LTV et taux d'intérêt en fonction de la
// classe de performance énergétique (CPE) du bien immobilier.
//
// Sources :
// - ECB/SSM — Climate-related and environmental risks (2024)
// - EBA — Guidelines on loan origination and monitoring (EBA/GL/2020/06)
// - EBA — Report on ESG risks management & supervision (2024)
// - CSSF Circular 22/811 — Recommandations LTV Luxembourg
// - Pratiques observées auprès des banques luxembourgeoises (Spuerkeess, BIL, BGL BNP Paribas)
//
// Logique :
// - Les biens performants (A-B) bénéficient d'un LTV max plus élevé et d'un taux préférentiel
//   (green mortgage / prêt vert), car le risque de dépréciation liée à l'énergie est faible.
// - Les biens énergivores (F-I) voient leur LTV max diminué et leur taux majoré,
//   car la banque anticipe un risque de stranding (EPBD) et des coûts de mise aux normes.

export interface EnergyLTVAdjustment {
  classe: string;
  ltvAdjustmentBps: number;   // ajustement LTV max en points de base (+200 = +2pp de LTV)
  rateAdjustmentBps: number;  // ajustement taux d'intérêt en points de base (-15 = -0,15pp)
  rationale: string;
}

const ENERGY_LTV_MAP: Record<string, EnergyLTVAdjustment> = {
  A: {
    classe: "A",
    ltvAdjustmentBps: 200,
    rateAdjustmentBps: -15,
    rationale: "Green mortgage — bien très performant, risque de stranding nul, éligible au green bond framework.",
  },
  B: {
    classe: "B",
    ltvAdjustmentBps: 200,
    rateAdjustmentBps: -15,
    rationale: "Green mortgage — bien performant, conforme aux objectifs EPBD 2033, faible risque climatique.",
  },
  C: {
    classe: "C",
    ltvAdjustmentBps: 100,
    rateAdjustmentBps: -5,
    rationale: "Bien au-dessus de la médiane, faible risque de rénovation obligatoire avant 2040.",
  },
  D: {
    classe: "D",
    ltvAdjustmentBps: 0,
    rateAdjustmentBps: 0,
    rationale: "Classe de référence — conditions standard du marché luxembourgeois.",
  },
  E: {
    classe: "E",
    ltvAdjustmentBps: -100,
    rateAdjustmentBps: 10,
    rationale: "Risque modéré — rénovation probable avant 2040, surcoût anticipé par la banque.",
  },
  F: {
    classe: "F",
    ltvAdjustmentBps: -200,
    rateAdjustmentBps: 25,
    rationale: "Risque élevé — passoire thermique, rénovation requise avant 2033 (EPBD), décote valeur prudente.",
  },
  G: {
    classe: "G",
    ltvAdjustmentBps: -200,
    rateAdjustmentBps: 25,
    rationale: "Risque élevé — passoire thermique, rénovation requise avant 2033 (EPBD), décote valeur prudente.",
  },
  H: {
    classe: "H",
    ltvAdjustmentBps: -300,
    rateAdjustmentBps: 50,
    rationale: "Risque très élevé — bien quasi non-finançable sans plan de rénovation, forte décote MLV.",
  },
  I: {
    classe: "I",
    ltvAdjustmentBps: -300,
    rateAdjustmentBps: 50,
    rationale: "Risque très élevé — bien quasi non-finançable sans plan de rénovation, forte décote MLV.",
  },
};

/**
 * Retourne l'ajustement LTV/taux pour une classe énergétique donnée.
 */
export function getEnergyLTVAdjustment(classe: string): EnergyLTVAdjustment {
  const upper = classe.toUpperCase().trim();
  return ENERGY_LTV_MAP[upper] || ENERGY_LTV_MAP["D"];
}

/**
 * Retourne toutes les classes avec leurs ajustements (pour affichage tableau).
 */
export function getAllEnergyLTVAdjustments(): EnergyLTVAdjustment[] {
  return ["A", "B", "C", "D", "E", "F", "G", "H", "I"].map(
    (c) => ENERGY_LTV_MAP[c]
  );
}

export interface MortgageEnergyParams {
  valeurBien: number;
  classeEnergie: string;
  tauxBaseAnnuel: number;       // taux de base en % (ex: 3.5)
  ltvMaxBase: number;           // LTV max de base en % (ex: 80)
  dureeAnnees: number;
}

export interface MortgageEnergyResult {
  // Paramètres ajustés
  tauxAjuste: number;           // en %
  ltvMaxAjuste: number;         // en %
  // Capacité d'emprunt
  montantMaxBase: number;       // emprunt max avec LTV base
  montantMaxAjuste: number;     // emprunt max avec LTV ajusté
  differenceCapacite: number;   // différence en €
  // Mensualités comparées
  mensualiteBase: number;
  mensualiteAjustee: number;
  differenceMensuelle: number;
  // Coût total du crédit
  coutTotalBase: number;
  coutTotalAjuste: number;
  differenceCoutTotal: number;
  // Métadonnées
  adjustment: EnergyLTVAdjustment;
}

/**
 * Calcule la mensualité d'un prêt à taux fixe.
 */
function mensualite(capital: number, tauxAnnuel: number, dureeAnnees: number): number {
  const tauxMensuel = tauxAnnuel / 100 / 12;
  const nbMois = dureeAnnees * 12;
  if (tauxMensuel === 0) return capital / nbMois;
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1);
}

/**
 * Simule l'impact de la classe énergie sur un crédit hypothécaire.
 */
export function simulateMortgageWithEnergy(params: MortgageEnergyParams): MortgageEnergyResult {
  const adj = getEnergyLTVAdjustment(params.classeEnergie);

  // Ajustements
  const tauxAjuste = Math.max(0, params.tauxBaseAnnuel + adj.rateAdjustmentBps / 100);
  const ltvMaxAjuste = Math.min(100, Math.max(0, params.ltvMaxBase + adj.ltvAdjustmentBps / 100));

  // Montants empruntables
  const montantMaxBase = params.valeurBien * (params.ltvMaxBase / 100);
  const montantMaxAjuste = params.valeurBien * (ltvMaxAjuste / 100);

  // Mensualités (sur le montant max)
  const mensBase = mensualite(montantMaxBase, params.tauxBaseAnnuel, params.dureeAnnees);
  const mensAjustee = mensualite(montantMaxAjuste, tauxAjuste, params.dureeAnnees);

  // Coût total du crédit
  const nbMois = params.dureeAnnees * 12;
  const coutTotalBase = mensBase * nbMois;
  const coutTotalAjuste = mensAjustee * nbMois;

  return {
    tauxAjuste,
    ltvMaxAjuste,
    montantMaxBase,
    montantMaxAjuste,
    differenceCapacite: montantMaxAjuste - montantMaxBase,
    mensualiteBase: mensBase,
    mensualiteAjustee: mensAjustee,
    differenceMensuelle: mensAjustee - mensBase,
    coutTotalBase,
    coutTotalAjuste,
    differenceCoutTotal: coutTotalAjuste - coutTotalBase,
    adjustment: adj,
  };
}
