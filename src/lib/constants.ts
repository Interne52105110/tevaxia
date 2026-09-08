// ============================================================
// CONSTANTES FISCALES & RÉGLEMENTAIRES — LUXEMBOURG
// ============================================================

import { TABLES_REEVALUATION } from './coefficients-reevaluation';
// Table en vigueur en 2026 ; pour un calcul historique, sélectionner le millésime.
export const COEFFICIENTS_REEVALUATION = TABLES_REEVALUATION[2026].values;

// Droits d'enregistrement et transcription
export const TAUX_ENREGISTREMENT = 0.06; // 6%
export const TAUX_TRANSCRIPTION = 0.01; // 1%
export const TAUX_DROITS_TOTAL = 0.07; // 7% total

// Bëllegen Akt — crédit d'impôt sur droits d'enregistrement
export const BELLEGEN_AKT_PAR_PERSONNE = 40_000; // 40 000 € par acquéreur
export const BELLEGEN_AKT_COUPLE = 80_000; // 80 000 € pour un couple

// TVA
export const TVA_TAUX_NORMAL = 0.17; // 17%
export const TVA_TAUX_REDUIT = 0.03; // 3% (résidence principale)
export const TVA_FAVEUR_PLAFOND = 50_000; // Plafond de la faveur fiscale TVA 3%

// Loyer — règle des 5% du capital investi
export const TAUX_PLAFOND_LOYER = 0.05; // 5% annuel
export const TAUX_VETUSTE_ANNUEL = 0.02; // Ancien nom conservé : 2% PAR PÉRIODE DE DEUX ANS, après 15 ans.

// Plus-values
export const SEUIL_SPECULATION_ANNEES = 5; // Régime courant ; dérogations 2025 déterminées par date dans le moteur
export const ABATTEMENT_CESSION = 50_000; // 50 000 € d'abattement décennal
export const ABATTEMENT_CESSION_COUPLE = 100_000; // 100 000 € pour couple
export const DEMI_TAUX_GLOBAL = true; // Gains de cession taxés au demi-taux global

// Garantie de l'État
export const GARANTIE_ETAT_MAX = 303_862; // Montant max 2025
export const GARANTIE_ETAT_SEUIL_LTV = 0.60; // Porte sur la partie > 60%
export const GARANTIE_ETAT_PLAFOND_PCT = 0.40; // Max 40% du projet
export const GARANTIE_EPARGNE_MIN_ANNUELLE = 1_000; // 1 000 €/an pendant 3 ans
export const GARANTIE_REVENU_PLAFOND_SEUL = 101_874; // Revenus max emprunteur seul
export const GARANTIE_REVENU_PLAFOND_MULTI = 141_049; // Revenus max plusieurs emprunteurs

// Aides étatiques à l'acquisition
export const PRIME_ACCESSION_MAX = 10_000; // Max 10 000 €
export const PRIME_ACCESSION_MAJORATION_COPROPRIETE = 0.40; // +40%
export const PRIME_ACCESSION_MAJORATION_JUMELEE = 0.15; // +15%
export const PRIME_EPARGNE_MAX = 5_000; // Max 5 000 € (une seule fois)
export const PRIME_AMELIORATION_PCT = 0.40; // Jusqu'à 40% HTVA
export const PRIMES_CAPITAL_PLAFOND = 35_000; // Plafond cumulé primes en capital

// Subvention d'intérêt
export const SUBVENTION_INTERET_MIN = 0.0025; // 0,25%
export const SUBVENTION_INTERET_MAX = 0.035; // 3,5%
export const SUBVENTION_INTERET_MONTANT_BASE = 200_000; // Base 200 000 €
export const SUBVENTION_INTERET_PAR_ENFANT = 20_000; // +20 000 € par enfant
export const SUBVENTION_INTERET_MONTANT_MAX = 280_000; // Plafond 280 000 €

// Bonification d'intérêt
export const BONIFICATION_PAR_ENFANT = 0.005; // 0,50% par enfant
export const BONIFICATION_PLAFOND = 0.03; // Max 3%

// Rénovation énergie
export const KLIMABONUS_PCT_MAX = 0.75; // Jusqu'à 75% des travaux (avec Topup social 2026)
export const KLIMABONUS_TOPUP_SOCIAL_MULT = 1.5; // 150% du montant de base si revenus ≤ seuil social
export const KLIMABONUS_TOPUP_SOCIAL_SEUIL = 60_000; // Revenu imposable annuel ≤ 60 000 €
export const SUBVENTION_CONSEIL_ENERGIE = 1_500; // 1 500 € pour audit
export const KLIMAPRET_TAUX = 0.015; // 1,5%
export const KLIMAPRET_MAX = 100_000; // Max 100 000 €
export const KLIMAPRET_DUREE_MAX = 15; // 15 ans
export const KLIMAPRET_GARANTIE_MAX = 50_000; // Garantie État max 50 000 €

// Tarif notarial : art. 6 et art. 19 n° 89, barème 7, vente de gré à gré.
// Tranches SUCCESSIVES du tableau, converties en limites cumulées ; euros HT.
// Source : Chambre des notaires, règlement modifié du 24 juillet 1971.
export const BAREME_NOTAIRE = [
  { limite: 3718.40, taux: .04 },
  { limite: 7436.80, taux: .02 },
  { limite: 17352.54, taux: .015 },
  { limite: 24789.35, taux: .008 },
  { limite: 74368.05, taux: .006 },
  { limite: 148736.11, taux: .005 },
  { limite: 247893.52, taux: .003 },
  { limite: 1239467.62, taux: .001 },
  { limite: Infinity, taux: .0005 },
];
// Obligation avec garantie : art. 19 n° 58 et 61, barème 5.
export const BAREME_OBLIGATION = BAREME_NOTAIRE.map((tranche, i) => ({
  limite: tranche.limite,
  taux: [.025, .0175, .01, .005, .0035, .0025, .002, .0005, .0001][i],
}));

// Barème impôt sur le revenu LU 2025–2026 (article 118 — classe 1)
export const BAREME_IR_CLASSE1 = [
  { limite: 13230, taux: 0 },
  { limite: 15435, taux: 0.08 },
  { limite: 17640, taux: 0.09 },
  { limite: 19845, taux: 0.1 },
  { limite: 22050, taux: 0.11 },
  { limite: 24255, taux: 0.12 },
  { limite: 26550, taux: 0.14 },
  { limite: 28845, taux: 0.16 },
  { limite: 31140, taux: 0.18 },
  { limite: 33435, taux: 0.2 },
  { limite: 35730, taux: 0.22 },
  { limite: 38025, taux: 0.24 },
  { limite: 40320, taux: 0.26 },
  { limite: 42615, taux: 0.28 },
  { limite: 44910, taux: 0.3 },
  { limite: 47205, taux: 0.32 },
  { limite: 49500, taux: 0.34 },
  { limite: 51795, taux: 0.36 },
  { limite: 54090, taux: 0.38 },
  { limite: 117450, taux: 0.39 },
  { limite: 176160, taux: 0.4 },
  { limite: 234870, taux: 0.41 },
  { limite: Infinity, taux: 0.42 },
];

// Prix moyens marché LU (Q3 2025, source Observatoire Habitat)
export const PRIX_MOYEN_M2_APPART_EXISTANT = 7_605; // €/m²
export const PRIX_MOYEN_M2_APPART_NEUF = 9_200; // €/m² (estimation)

