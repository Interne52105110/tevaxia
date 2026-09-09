import { TABLES_REEVALUATION } from './coefficients-reevaluation';
import {
  TAUX_PLAFOND_LOYER,
  TAUX_DROITS_TOTAL,
  BELLEGEN_AKT_PAR_PERSONNE,
  TVA_TAUX_NORMAL,
  TVA_TAUX_REDUIT,
  TVA_FAVEUR_PLAFOND,
  BAREME_NOTAIRE,
  BAREME_OBLIGATION,
  BAREME_IR_CLASSE1,
} from "./constants";

// ============================================================
// UTILS
// ============================================================

export function getCoefficient(annee: number, anneeReference = 2026): number {
  const table=TABLES_REEVALUATION[anneeReference];
  if(!table || !Number.isInteger(annee))throw new RangeError('Millésime de réévaluation non disponible (2015–2026).');
  // Le tableau vise 1918 et les années antérieures ; les années récentes valent 1.
  return table.values[Math.max(1918,Math.min(annee,anneeReference))];
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEUR2(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPct(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)} %`;
}

// ============================================================
// MODULE 1 — CAPITAL INVESTI / PLAFOND LOYER
// ============================================================

export interface TrancheTravauxInput {
  montant: number;
  annee: number;
}

export interface CapitalInvestiInput {
  prixAcquisition: number;
  anneeAcquisition: number;
  travauxMontant: number; // Tranche principale (rétrocompatibilité)
  travauxAnnee: number;
  tranchesSupplementaires?: TrancheTravauxInput[]; // Tranches additionnelles
  anneeBail: number;
  surfaceHabitable: number;
  nbColocataires?: number;
  appliquerVetuste: boolean;
  tauxVetusteAnnuel: number;
  estMeuble?: boolean;
  anneeConstruction?: number;
  fraisAcquisition?: number; // Frais admissibles de l'acte, non déjà compris dans le prix.
  terrainMontant?: number; // Part terrain, frais afférents compris ; à défaut forfait 20%.
  entretienReevalue?: number; // Frais d'entretien/réparation justifiés, réévalués, encore imputables.
  mobilierEligible?: number; // Factures de moins de dix ans au jour du bail/adaptation.

}

export interface CapitalInvestiResult {
  prixReevalue: number;
  coeffAcquisition: number;
  travauxReevalues: number;
  coeffTravaux: number;
  anneesVetuste: number;
  decoteVetuste: number;
  decoteVetustePct: number;
  capitalInvesti: number;
  loyerAnnuelMax: number;
  loyerMensuelMax: number;
  loyerM2Mensuel: number;
  loyerParColocataire?: number;
  supplementMobilierMensuel: number;
  terrainReevalue: number;
  entretienImpute: number;
  reportEntretien: number;
  periodesVetuste: number;
  donneesCompletes: boolean;
  erreurSaisie?: string;
}

export function calculerCapitalInvesti(input: CapitalInvestiInput): CapitalInvestiResult {
  const vide: CapitalInvestiResult = {prixReevalue:0,coeffAcquisition:1,travauxReevalues:0,coeffTravaux:1,anneesVetuste:0,decoteVetuste:0,decoteVetustePct:0,capitalInvesti:0,loyerAnnuelMax:0,loyerMensuelMax:0,loyerM2Mensuel:0,supplementMobilierMensuel:0,terrainReevalue:0,entretienImpute:0,reportEntretien:0,periodesVetuste:0,donneesCompletes:false};
  const construction=input.anneeConstruction??input.anneeAcquisition;
  const montants=[input.prixAcquisition,input.travauxMontant??0,input.fraisAcquisition??0,input.terrainMontant??0,input.entretienReevalue??0,input.mobilierEligible??0];
  if(!Number.isInteger(input.anneeBail)||!Number.isFinite(input.surfaceHabitable)||input.surfaceHabitable<0||(input.nbColocataires!==undefined&&(!Number.isInteger(input.nbColocataires)||input.nbColocataires<1))||montants.some(n=>!Number.isFinite(n)||n<0)||!Number.isInteger(input.anneeAcquisition)||!Number.isInteger(construction)||construction>input.anneeAcquisition||input.anneeAcquisition>input.anneeBail||input.anneeAcquisition<1918||construction<1800||!TABLES_REEVALUATION[input.anneeBail])return {...vide,erreurSaisie:'Vérifiez les montants et les années : construction ≤ acquisition ≤ bail, millésime du bail de 2015 à 2026.'};
  if(input.estMeuble&&input.anneeBail<2025)return {...vide,erreurSaisie:'Le supplément mobilier est proposé pour les millésimes 2025–2026 ; les baux antérieurs nécessitent une analyse datée.'};
  const baseInitiale=input.prixAcquisition+(input.fraisAcquisition??0);
  const terrain=input.terrainMontant??baseInitiale*.20;
  if(terrain>baseInitiale)return {...vide,erreurSaisie:'La part du terrain ne peut pas dépasser le capital initial.'};
  const coeffAcquisition=getCoefficient(input.anneeAcquisition,input.anneeBail);
  const prixReevalue=baseInitiale*coeffAcquisition;
  const terrainReevalue=terrain*coeffAcquisition;
  const tranches=[{montant:input.travauxMontant??0,annee:input.travauxAnnee},...(input.tranchesSupplementaires??[])];
  if(tranches.some(t=>!Number.isFinite(t.montant)||t.montant<0||(t.montant>0&&(!Number.isInteger(t.annee)||t.annee<input.anneeAcquisition))))return {...vide,erreurSaisie:'Vérifiez les travaux et leurs années de réalisation.'};
  const travauxReevalues=tranches.filter(t=>t.montant>0&&t.annee<=input.anneeBail).reduce((n,t)=>n+t.montant*getCoefficient(t.annee,input.anneeBail),0);
  const coeffTravaux=(input.travauxMontant??0)>0&&input.travauxAnnee<=input.anneeBail?getCoefficient(input.travauxAnnee,input.anneeBail):1;
  const valeurBrute=prixReevalue+travauxReevalues;
  // Art. 3(3)-(4) : terrain exclu, achat présumé déjà décoté au jour de l'acte.
  // Les travaux d'amélioration ne redémarrent pas le compteur de l'immeuble.
  const anneesVetuste=Math.max(0,input.anneeBail-Math.max(input.anneeAcquisition,construction+15));
  const periodesVetuste=Math.floor(anneesVetuste/2);
  const decoteVetustePct=input.appliquerVetuste!==false?Math.min(1,periodesVetuste*.02):0;
  const decoteBrute=Math.max(0,valeurBrute-terrainReevalue)*decoteVetustePct;
  const entretienImpute=Math.min(decoteBrute,input.entretienReevalue??0);
  const reportEntretien=Math.max(0,(input.entretienReevalue??0)-entretienImpute);
  const decoteVetuste=decoteBrute-entretienImpute;
  const capitalInvesti=valeurBrute-decoteVetuste;
  const supplementMobilierMensuel=input.estMeuble?(input.mobilierEligible??0)*.015:0;
  const loyerMensuelMax=capitalInvesti*TAUX_PLAFOND_LOYER/12+supplementMobilierMensuel;
  return {prixReevalue,coeffAcquisition,travauxReevalues,coeffTravaux,anneesVetuste,decoteVetuste,decoteVetustePct,capitalInvesti,loyerAnnuelMax:loyerMensuelMax*12,loyerMensuelMax,loyerM2Mensuel:input.surfaceHabitable>0?loyerMensuelMax/input.surfaceHabitable:0,loyerParColocataire:input.nbColocataires&&input.nbColocataires>1?loyerMensuelMax/input.nbColocataires:undefined,supplementMobilierMensuel,terrainReevalue,entretienImpute,reportEntretien,periodesVetuste,donneesCompletes:input.anneeConstruction!==undefined&&input.appliquerVetuste!==false&&(!input.estMeuble||input.mobilierEligible!==undefined)};
}

// ============================================================
// MODULE 2 — FRAIS D'ACQUISITION
// ============================================================

export interface FraisAcquisitionInput {
  prixBien: number;
  estNeuf: boolean;
  partTerrain?: number;
  partConstruction?: number;
  residencePrincipale: boolean;
  nbAcquereurs: 1 | 2;
  montantHypotheque?: number;
  dateActe?: string; // YYYY-MM — pour taux temporaire réduit
  baseInscriptionHypotheque?: number; // Principal garanti + accessoires stipulés dans l'acte.
  achatSociete?: boolean;
  reductionBaseConfirmee?: boolean; // Conditions de la réduction temporaire validées dans l'acte.
  compromisEnregistreAvantJuillet2025?: boolean;
  quotePartPremier?: number; // Fraction de propriété du premier acquéreur, entre 0 et 1.
  creditsRestants?: number[]; // Solde personnel confirmé par l'AED, dans l'ordre des acquéreurs.
}

export interface FraisAcquisitionResult {
  // Droits d'enregistrement
  baseDroits: number;
  droitsEnregistrement: number;
  droitsTranscription: number;
  droitsTotal: number;
  // Bëllegen Akt
  creditBellegenAkt: number;
  droitsApresCredit: number;
  // TVA
  tvaApplicable: number;
  tauxTva: number;
  montantTva: number;
  faveurFiscaleTva: number;
  // Notaire
  emolumentsNotaire: number; // TTC pour compatibilité avec les totaux et les exports.
  emolumentsNotaireHT: number;
  tvaEmolumentsNotaire: number;
  droitsObligation: number;
  emolumentsHypothequeHT: number;
  tvaEmolumentsHypotheque: number;
  // Hypothèque
  fraisHypotheque: number;
  droitsHypotheque: number;
  // Totaux
  totalFrais: number;
  totalPourcentage: number;
  coutTotalAcquisition: number;
  hypotheses: string[];
}

const centimes = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function emolumentTarife(montant: number, bareme: typeof BAREME_NOTAIRE, minimum: number): number {
  if (!Number.isFinite(montant) || montant < 0) throw new RangeError('Montant notarial invalide.');
  if (montant === 0) return 0; // Absence d'acte, pas un acte de valeur nulle.
  let total = 0;
  let precedent = 0;
  const base = Math.ceil(montant); // Art. 4 : de euro en euro, sans fraction.
  for (const tranche of bareme) {
    total += Math.max(0, Math.min(base, tranche.limite) - precedent) * tranche.taux;
    if (base <= tranche.limite) break;
    precedent = tranche.limite;
  }
  return centimes(Math.max(minimum, total));
}

/** Émolument HT d'une vente de gré à gré, hors copies, débours et diligences exceptionnelles. */
export function calculerEmolumentsNotaire(montant: number): number {
  return emolumentTarife(montant, BAREME_NOTAIRE, 99.16);
}

/** Prêt hypothécaire ordinaire non exonéré ; principal et assiette d'inscription distincts. */
export function calculerFraisHypotheque(principal: number, baseInscription = principal) {
  if (!Number.isFinite(baseInscription) || baseInscription < principal) throw new RangeError('La garantie doit couvrir au moins le principal.');
  const emolumentsHT = emolumentTarife(principal, BAREME_OBLIGATION, 61.97);
  const tvaEmoluments = centimes(emolumentsHT * TVA_TAUX_NORMAL);
  const droitsObligation = centimes(principal * .0024);
  const droitsInscription = centimes(baseInscription * .0005);
  return { emolumentsHT, tvaEmoluments, droitsObligation, droitsInscription,
    total: centimes(emolumentsHT + tvaEmoluments + droitsObligation + droitsInscription) };
}

export function calculerFraisAcquisition(input: FraisAcquisitionInput): FraisAcquisitionResult {
  const montants = [input.prixBien, input.partTerrain ?? 0, input.partConstruction ?? 0, input.montantHypotheque ?? 0];
  if (montants.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0)
    || typeof input.estNeuf !== 'boolean' || typeof input.residencePrincipale !== 'boolean'
    || ![1, 2].includes(input.nbAcquereurs)
    || ['achatSociete', 'reductionBaseConfirmee', 'compromisEnregistreAvantJuillet2025'].some(k => {
      const v = input[k as keyof FraisAcquisitionInput]; return v !== undefined && typeof v !== 'boolean';
    })) throw new RangeError('Données d’acquisition invalides.');
  if (input.estNeuf && (input.partTerrain === undefined || input.partTerrain > input.prixBien
    || (input.partConstruction !== undefined && Math.abs(input.partTerrain + input.partConstruction - input.prixBien) > .01))) {
    throw new RangeError('VEFA : renseignez un prix hors TVA et des parts terrain/construction cohérentes.');
  }
  // La seule date ne prouve pas l'éligibilité à une mesure temporaire.
  let tauxDroitsEffectif = TAUX_DROITS_TOTAL;
  if (input.dateActe && !/^202[456]-(0[1-9]|1[0-2])$/.test(input.dateActe)) throw new RangeError('Millésime pris en charge : 2024–2026.');
  if (input.reductionBaseConfirmee) {
    const date = input.dateActe ?? '';
    const periode = date >= '2024-10' && date <= '2025-06';
    const prolongation = date >= '2025-07' && date <= '2025-09' && input.compromisEnregistreAvantJuillet2025 === true;
    if (!periode && !prolongation) throw new RangeError('Date ou enregistrement du compromis incompatible avec la réduction temporaire.');
    tauxDroitsEffectif = .035;
  }

  // Base des droits d'enregistrement
  let baseDroits: number;
  if (input.estNeuf && input.partTerrain !== undefined) {
    baseDroits = input.partTerrain;
  } else {
    baseDroits = input.prixBien;
  }

  const ratioEnreg = tauxDroitsEffectif * (6/7); // Proportion enregistrement
  const ratioTransc = tauxDroitsEffectif * (1/7); // Proportion transcription
  const droitsEnregistrement = centimes(baseDroits * ratioEnreg);
  const droitsTranscription = centimes(baseDroits * ratioTransc);
  const droitsTotal = centimes(droitsEnregistrement + droitsTranscription);

  // Bëllegen Akt
  let creditBellegenAkt = 0;
  if (input.residencePrincipale && !input.achatSociete) {
    const quote = input.nbAcquereurs === 1 ? 1 : (input.quotePartPremier ?? .5);
    const soldes = input.creditsRestants ?? Array(input.nbAcquereurs).fill(BELLEGEN_AKT_PAR_PERSONNE);
    if (!Number.isFinite(quote) || quote <= 0 || quote > 1 || (input.nbAcquereurs === 2 && quote === 1)
      || soldes.length !== input.nbAcquereurs || soldes.some(n => !Number.isFinite(n) || n < 0 || n > BELLEGEN_AKT_PAR_PERSONNE)) {
      throw new RangeError('Vérifiez les quotes-parts et les soldes personnels du Bëllegen Akt.');
    }
    const parts = input.nbAcquereurs === 1 ? [1] : [quote, 1 - quote];
    // Un solde inutilisé ne peut pas acquitter les droits d'un autre acquéreur.
    const imputable = parts.reduce((sum, part, i) => sum + Math.min(soldes[i], droitsTotal * part), 0);
    creditBellegenAkt = centimes(Math.min(imputable, Math.max(0, droitsTotal - 100)));
  }
  const droitsApresCredit = centimes(Math.max(input.prixBien > 0 ? 100 : 0, droitsTotal - creditBellegenAkt));

  // TVA
  let tauxTva = 0;
  let montantTva = 0;
  let faveurFiscaleTva = 0;
  let tvaApplicable = 0;

  if (input.estNeuf) {
    const baseConstruction = input.partConstruction ?? (input.prixBien - (input.partTerrain ?? 0));
    if (input.residencePrincipale && !input.achatSociete) {
      tauxTva = TVA_TAUX_REDUIT;
      const tvaNormale = baseConstruction * TVA_TAUX_NORMAL;
      const tvaReduite = baseConstruction * TVA_TAUX_REDUIT;
      faveurFiscaleTva = Math.min(TVA_FAVEUR_PLAFOND, tvaNormale - tvaReduite);
      montantTva = tvaNormale - faveurFiscaleTva;
      tvaApplicable = baseConstruction;
    } else {
      tauxTva = TVA_TAUX_NORMAL;
      montantTva = baseConstruction * TVA_TAUX_NORMAL;
      tvaApplicable = baseConstruction;
    }
  }

  montantTva = centimes(montantTva);
  faveurFiscaleTva = centimes(faveurFiscaleTva);
  tauxTva = tvaApplicable > 0 ? montantTva / tvaApplicable : 0;

  // Vente : émoluments tarifés HT + TVA. Copies et débours non compris.
  const emolumentsNotaireHT = calculerEmolumentsNotaire(input.prixBien);
  const tvaEmolumentsNotaire = centimes(emolumentsNotaireHT * TVA_TAUX_NORMAL);
  const emolumentsNotaire = centimes(emolumentsNotaireHT + tvaEmolumentsNotaire);
  const hypotheque = calculerFraisHypotheque(input.montantHypotheque ?? 0, input.baseInscriptionHypotheque);
  const droitsHypotheque = hypotheque.droitsInscription;
  const fraisHypotheque = hypotheque.total;

  // Totaux
  const totalFrais = centimes(droitsApresCredit + montantTva + emolumentsNotaire + fraisHypotheque);
  const coutTotalAcquisition = centimes(input.prixBien + totalFrais);
  const totalPourcentage = input.prixBien > 0 ? totalFrais / input.prixBien : 0;

  return {
    baseDroits,
    droitsEnregistrement,
    droitsTranscription,
    droitsTotal,
    creditBellegenAkt,
    droitsApresCredit,
    tvaApplicable,
    tauxTva,
    montantTva,
    faveurFiscaleTva,
    emolumentsNotaire,
    emolumentsNotaireHT,
    tvaEmolumentsNotaire,
    droitsObligation: hypotheque.droitsObligation,
    emolumentsHypothequeHT: hypotheque.emolumentsHT,
    tvaEmolumentsHypotheque: hypotheque.tvaEmoluments,
    fraisHypotheque,
    droitsHypotheque,
    totalFrais,
    totalPourcentage,
    coutTotalAcquisition,
    hypotheses: [
      'Vente de gré à gré d’un logement ; hors copies, débours et diligences exceptionnelles. Émoluments notaire TTC, détail HT et TVA séparé.',
      'Prêt ordinaire non exonéré ; garantie égale au principal sauf assiette d’inscription explicitement renseignée.',
      ...(input.residencePrincipale && !input.achatSociete ? ['Occupation personnelle et conditions du crédit à confirmer. Plafond documenté 40 000 euros ; solde intégral et parts égales par défaut. Hors EEE : droits à avancer avant éventuel remboursement.'] : []),
      ...(input.estNeuf ? ['Prix hors TVA, aucune construction déjà réalisée à l’acte. Toute la construction supposée éligible et faveur TVA de 50 000 euros intégralement disponible si habitation personnelle.'] : []),
    ],
  };
}

// ============================================================
// CALCUL IMPÔT PROGRESSIF (BARÈME IR LU — CLASSE 1)
// ============================================================

/** Calcule l'impôt dû sur un revenu imposable selon le barème progressif classe 1 */
export function calculerImpotBareme(revenuImposable: number): number {
  let impot = 0;
  let seuil = 0;
  for (const tranche of BAREME_IR_CLASSE1) {
    const largeur = tranche.limite - seuil;
    const montantDansTranche = Math.min(Math.max(revenuImposable - seuil, 0), largeur);
    impot += montantDansTranche * tranche.taux;
    seuil = tranche.limite;
    if (revenuImposable <= seuil) break;
  }
  return impot;
}

/** Taux moyen d'imposition pour un revenu donné */
export function tauxMoyenIR(revenuImposable: number): number {
  if (revenuImposable <= 0) return 0;
  return calculerImpotBareme(revenuImposable) / revenuImposable;
}

// PRIVATE PROPERTY CAPITAL GAINS — 2025–2026, resident classes 1 and 2.
export interface PlusValueInput {
  prixAcquisition: number;
  anneeAcquisition: number;
  prixCession: number;
  anneeCession: number;
  dateAcquisition?: string;
  dateCession?: string;
  fraisAcquisition?: number;
  travauxDeductibles?: number;
  travauxAnnee?: number;
  tranchesTravaux?: TrancheTravauxInput[];
  fraisCession?: number;
  estResidencePrincipale: boolean; // Confirmation des conditions art. 102bis, pas simple intention.
  estCouple: boolean; // Imposition collective, pas simple concubinage.
  revenuImposable?: number; // Revenu ordinaire ajusté, hors gain et hors autres revenus extraordinaires.
  modeAcquisition?: "achat" | "succession" | "donation";
  abattementsAnterieurs?: number;
  abattementSuccessionDisponible?: number;
  compromisEnregistreAvantJuillet2025?: boolean;
  soumisDependance?: boolean;
  autresBasesDependance?: number;
}
export interface PlusValueResult {
  typeGain: "speculation" | "cession" | "exonere";
  dureeDetention: number;
  prixAcquisitionRevalorise: number;
  coefficient: number;
  fraisForfaitaires: number;
  gainBrut: number;
  abattement: number;
  abattementSuccession: number;
  gainImposable: number;
  estimationImpot: number; // IR additionnel seul, contribution emploi séparée.
  tauxEffectif: number;
  netApresImpot: number; // Gain économique après IR, coût fiscal complet dans fourchette séparée.
  produitNetMin: number;
  produitNetMax: number;
  emploiMin: number;
  emploiMax: number;
  dependance: number;
  impotTotalMin: number;
  impotTotalMax: number;
  fractionTaux: number;
  seuilSpeculation: number;
  explication: string;
  erreurSaisie?: string;
}

function dateValide(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value ? d : null;
}
function impotResident(revenu: number, couple: boolean): number {
  const r = Math.floor(Math.max(0, revenu) / 50) * 50;
  return Math.floor(calculerImpotBareme(r / (couple ? 2 : 1)) * (couple ? 2 : 1) + 1e-8);
}
// Formules ACD 2025, feuilles Classe 1 et Classe 2, cellule B34 (revenu ordinaire).
function impotOrdinaireMajore(revenu: number, couple: boolean): number {
  const i = impotResident(revenu, couple);
  return Math.floor(i * (revenu > (couple ? 300000 : 150000) ? 1.09 : 1.07)
    - (revenu > (couple ? 300000 : 150000) ? (couple ? 1863.6 : 931.8) : 0) + 1e-8);
}
export function calculerPlusValue(input: PlusValueInput): PlusValueResult {
  const vide: PlusValueResult = {typeGain:'cession',dureeDetention:0,prixAcquisitionRevalorise:0,coefficient:1,fraisForfaitaires:0,gainBrut:0,abattement:0,abattementSuccession:0,gainImposable:0,estimationImpot:0,tauxEffectif:0,netApresImpot:0,produitNetMin:0,produitNetMax:0,emploiMin:0,emploiMax:0,dependance:0,impotTotalMin:0,impotTotalMax:0,fractionTaux:.5,seuilSpeculation:5,explication:''};
  const invalid = (message: string) => ({...vide,erreurSaisie:message});
  const acq = dateValide(input.dateAcquisition), vente = dateValide(input.dateCession);
  if (!acq || !vente || acq > vente || vente.getUTCFullYear()<2025 || vente.getUTCFullYear()>2026 || acq.getUTCFullYear()<1941) return invalid('Dates exactes requises : acquisition depuis 1941, cession en 2025 ou 2026, acquisition antérieure à la cession.');
  const montants=[input.prixAcquisition,input.prixCession,input.fraisAcquisition??0,input.travauxDeductibles??0,input.fraisCession??0,input.abattementsAnterieurs??0,input.abattementSuccessionDisponible??0,input.autresBasesDependance??0];
  if(montants.some(v=>!Number.isFinite(v)||v<0)||!Number.isFinite(input.revenuImposable)||(input.revenuImposable ?? -1) < 0) return invalid('Renseignez des montants positifs ou nuls et le revenu ordinaire imposable ajusté.');
  if(acq.getUTCFullYear()!==input.anneeAcquisition||vente.getUTCFullYear()!==input.anneeCession) return invalid('Les dates et millésimes doivent correspondre.');
  const mode=input.modeAcquisition??'achat';
  if(!['achat','succession','donation'].includes(mode))return invalid('Mode d’acquisition non reconnu.');
  if((input.abattementSuccessionDisponible??0)>(input.estCouple?150000:75000)||(mode!=='succession'&&(input.abattementSuccessionDisponible??0)>0))return invalid('Vérifiez l’abattement successoral personnel encore disponible.');
  const date=input.dateCession!;
  const transitoire=date<='2025-06-30'||(date<='2025-09-30'&&input.compromisEnregistreAvantJuillet2025===true);
  const seuilSpeculation=transitoire?2:5;
  const anniversaire=new Date(acq);anniversaire.setUTCFullYear(acq.getUTCFullYear()+seuilSpeculation);
  // Le 29 février : échéance au dernier jour du mois si l’année cible n’est pas bissextile.
  if(anniversaire.getUTCMonth()!==acq.getUTCMonth())anniversaire.setUTCDate(0);
  const speculation=vente<=anniversaire;
  let dureeDetention=vente.getUTCFullYear()-acq.getUTCFullYear();
  if(vente.toISOString().slice(5,10)<acq.toISOString().slice(5,10))dureeDetention--;
  const tranches=[{montant:input.travauxDeductibles??0,annee:input.travauxAnnee??input.anneeAcquisition},...(input.tranchesTravaux??[])];
  if(tranches.some(t=>!Number.isFinite(t.montant)||t.montant<0||(t.montant>0&&(!Number.isInteger(t.annee)||t.annee<input.anneeAcquisition||t.annee>input.anneeCession))))return invalid('Travaux : montants justifiés et année comprise entre acquisition et cession.');
  const coefficient=speculation?1:getCoefficient(input.anneeAcquisition,input.anneeCession);
  const prixAcquisitionRevalorise=input.prixAcquisition*coefficient;
  const travaux=tranches.reduce((n,t)=>n+t.montant*(speculation?1:getCoefficient(t.annee,input.anneeCession)),0);
  const fraisForfaitaires=(input.fraisAcquisition??0)*coefficient+travaux+(input.fraisCession??0);
  const gainBrut=input.prixCession-prixAcquisitionRevalorise-fraisForfaitaires;
  const coutHistorique=input.prixAcquisition+(input.fraisAcquisition??0)+tranches.reduce((n,t)=>n+t.montant,0);
  const produitAvantImpot=input.prixCession-(input.fraisCession??0);
  if(input.estResidencePrincipale)return {...vide,typeGain:'exonere',dureeDetention,prixAcquisitionRevalorise,coefficient,fraisForfaitaires,gainBrut,netApresImpot:produitAvantImpot-coutHistorique,produitNetMin:produitAvantImpot,produitNetMax:produitAvantImpot,seuilSpeculation,explication:'Exonération selon la confirmation des conditions de l’article 102bis LIR. La cession reste à déclarer.'};
  const abattementSuccession=speculation?0:Math.min(Math.max(0,gainBrut),input.abattementSuccessionDisponible??0);
  const abattement=speculation?0:Math.min(Math.max(0,gainBrut-abattementSuccession),Math.max(0,(input.estCouple?100000:50000)-(input.abattementsAnterieurs??0)));
  const gainImposable=speculation && gainBrut<500 ? 0 : Math.max(0,gainBrut-abattementSuccession-abattement);
  const ord=input.revenuImposable!;
  const total=ord+gainImposable;
  const irSans=impotResident(ord,input.estCouple);
  const irNormal=impotResident(total,input.estCouple);
  const fractionTaux=speculation?1:transitoire?.25:.5;
  const revenuArrondi=Math.floor(total/50)*50;
  // Taux spécial tronqué au centième de pourcentage ; règle du calcul le plus favorable, art. 131.
  const tauxSpecial=revenuArrondi>0?Math.floor((irNormal/revenuArrondi)*fractionTaux*10000+1e-8)/10000:0;
  const estimationImpot=speculation||gainImposable<=250?Math.max(0,irNormal-irSans):Math.max(0,Math.min(irNormal-irSans,Math.floor(gainImposable*tauxSpecial+1e-8)));
  let emploiMin:number,emploiMax:number;
  if(speculation||gainImposable<=250){
    emploiMin=Math.max(0,impotOrdinaireMajore(total,input.estCouple)-impotOrdinaireMajore(ord,input.estCouple)-estimationImpot);emploiMax=emploiMin;
  } else {
    // Provision distincte : la ventilation du fonds sur les revenus extraordinaires au-delà du seuil doit être liquidée avec le dossier annuel.
    emploiMin=estimationImpot*.07;emploiMax=total>(input.estCouple?300000:150000)?estimationImpot*.09:emploiMin;
  }
  const baseAutres=input.autresBasesDependance??0;
  const dep=(base:number)=>base*.014<=24.79?0:base*.014;
  const dependance=input.soumisDependance?Math.max(0,dep(baseAutres+gainImposable)-dep(baseAutres)):0;
  const impotTotalMin=estimationImpot+emploiMin+dependance,impotTotalMax=estimationImpot+emploiMax+dependance;
  return {typeGain:speculation?'speculation':'cession',dureeDetention,prixAcquisitionRevalorise,coefficient,fraisForfaitaires,gainBrut,abattement,abattementSuccession,gainImposable,estimationImpot,tauxEffectif:gainImposable>0?estimationImpot/gainImposable:0,netApresImpot:produitAvantImpot-coutHistorique-estimationImpot,produitNetMin:produitAvantImpot-impotTotalMax,produitNetMax:produitAvantImpot-impotTotalMin,emploiMin,emploiMax,dependance,impotTotalMin,impotTotalMax,fractionTaux,seuilSpeculation,explication:`Articles 99bis, 99ter, 102, 130 et 131 LIR. Date et prix du dernier achat à titre onéreux, y compris en succession/donation. Calcul résident classe ${input.estCouple?'2':'1'}, sans autres revenus extraordinaires ni revenus étrangers exonérés avec progressivité. Contribution emploi provisionnée séparément ; liquidation annuelle à vérifier.`};
}

// ============================================================

// ============================================================
// MODULE 4 — SIMULATEUR D'AIDES
// ============================================================

export { simulerAides, calculerPrimeAccession2026, calculerTauxSubvention2026 } from "./aides-logement";
export type { AidesInput, AideDetail, AidesResult } from "./aides-logement";

// ============================================================
// MODULE 5 — OUTILS BANCAIRES
// ============================================================

export interface LTVInput {
  valeurBien: number;
  montantPret: number;
}

export interface AmortissementLigne {
  mois: number;
  mensualite: number;
  capital: number;
  interets: number;
  capitalRestant: number;
}

export interface DSCRInput {
  revenuLocatifAnnuel: number;
  chargesAnnuelles: number; // Charges exploitation
  serviceDetteAnnuel: number; // Capital + intérêts annuels
}

export function calculerLTV(input: LTVInput): number {
  return input.valeurBien > 0 ? input.montantPret / input.valeurBien : 0;
}

export function calculerMensualite(capital: number, tauxAnnuel: number, dureeAnnees: number): number {
  const tauxMensuel = tauxAnnuel / 12;
  const nbMois = dureeAnnees * 12;
  if (tauxMensuel === 0) return capital / nbMois;
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1);
}

export function genererTableauAmortissement(
  capital: number,
  tauxAnnuel: number,
  dureeAnnees: number
): AmortissementLigne[] {
  const mensualite = calculerMensualite(capital, tauxAnnuel, dureeAnnees);
  const tauxMensuel = tauxAnnuel / 12;
  const nbMois = dureeAnnees * 12;
  const tableau: AmortissementLigne[] = [];
  let capitalRestant = capital;

  for (let mois = 1; mois <= nbMois; mois++) {
    const interets = capitalRestant * tauxMensuel;
    const capitalRembourse = mensualite - interets;
    capitalRestant = Math.max(0, capitalRestant - capitalRembourse);

    tableau.push({
      mois,
      mensualite,
      capital: capitalRembourse,
      interets,
      capitalRestant,
    });
  }

  return tableau;
}

export function calculerDSCR(input: DSCRInput): number {
  const noi = input.revenuLocatifAnnuel - input.chargesAnnuelles;
  return input.serviceDetteAnnuel > 0 ? noi / input.serviceDetteAnnuel : 0;
}
