// ============================================================
// VALORISATION IMMOBILIÈRE — TEGOVA EVS 2025 + CRR
// ============================================================

// ============================================================
// 1. MÉTHODE PAR COMPARAISON (EVS1 — Market Value)
// ============================================================

export interface Comparable {
  id: string;
  adresse: string;
  prixVente: number;
  surface: number; // m²
  source?: string;
  justification?: string;
  dateVente: string; // YYYY-MM
  // Ajustements en % (positif = comparable inférieur → valeur à la hausse)
  ajustLocalisation: number;
  ajustEtat: number;
  ajustEtage: number;
  ajustExterieur: number; // Balcon, terrasse, jardin
  ajustParking: number;
  ajustDate: number; // Indexation temporelle
  ajustAutre: number;
  poids: number; // Pondération dans la moyenne (0-100)
}

export interface ComparaisonResult {
  comparables: {
    id: string;
    adresse: string;
    prixM2Brut: number;
    totalAjustements: number;
    prixM2Ajuste: number;
    poids: number;
  }[];
  prixM2Moyen: number;
  prixM2MoyenPondere: number;
  valeurEstimee: number;
  valeurEstimeePonderee: number;
}

/** Documented sales entry point; numeric comparison remains independently usable. */
export function calculerComparaisonDocumentee(comparables:Comparable[],surfaceBien:number,latestMonth=new Date().toISOString().slice(0,7)):ComparaisonResult {
  if(comparables.some(c=>!c.adresse.trim()||!c.source?.trim()||!c.justification?.trim()||!/^\d{4}-(0[1-9]|1[0-2])$/.test(c.dateVente)||c.dateVente>latestMonth))throw new RangeError('Documented sale references are required');
  return calculerComparaison(comparables,surfaceBien);
}

export function calculerComparaison(
  comparables: Comparable[],
  surfaceBien: number
): ComparaisonResult {
  if (!Number.isFinite(surfaceBien)||surfaceBien<=0||surfaceBien>1e7||!Array.isArray(comparables)||comparables.length===0) throw new RangeError('A positive subject area and comparable evidence are required');
  const results = comparables.map((c) => {
    const adjustments=[c.ajustLocalisation,c.ajustEtat,c.ajustEtage,c.ajustExterieur,c.ajustParking,c.ajustDate,c.ajustAutre];
    if (![c.prixVente,c.surface,c.poids,...adjustments].every(Number.isFinite)||c.prixVente<=0||c.prixVente>1e12||c.surface<=0||c.surface>1e7||c.poids<0||c.poids>100||adjustments.some(v=>v < -100||v>100)) throw new RangeError('Invalid comparable inputs');
    const prixM2Brut = c.prixVente / c.surface;
    const totalAjustements=adjustments.reduce((sum,v)=>sum+v,0);
    if(totalAjustements<=-100) throw new RangeError('Adjustments must retain a positive comparable value');
    const prixM2Ajuste=prixM2Brut*(1+totalAjustements/100);
    if(!Number.isFinite(prixM2Ajuste)) throw new RangeError('Comparable value overflow');
    return {id:c.id,adresse:c.adresse,prixM2Brut,totalAjustements,prixM2Ajuste,poids:c.poids};
  });

  const totalPoids = results.reduce((s, r) => s + r.poids, 0);
  if(totalPoids<=0) throw new RangeError("At least one comparable must have a positive weight");
  const prixM2Moyen =
    results.length > 0
      ? results.reduce((s, r) => s + r.prixM2Ajuste, 0) / results.length
      : 0;
  const prixM2MoyenPondere =
    totalPoids > 0
      ? results.reduce((s, r) => s + r.prixM2Ajuste * r.poids, 0) / totalPoids
      : prixM2Moyen;

  if(!Number.isFinite(prixM2MoyenPondere*surfaceBien)||!Number.isFinite(prixM2Moyen*surfaceBien)) throw new RangeError("Comparison value overflow");
  return {
    comparables: results,
    prixM2Moyen,
    prixM2MoyenPondere,
    valeurEstimee: prixM2Moyen * surfaceBien,
    valeurEstimeePonderee: prixM2MoyenPondere * surfaceBien,
  };
}

// ============================================================
// 2. CAPITALISATION DIRECTE (EVS1 — Income Approach)
// ============================================================

export interface CapitalisationInput {
  loyerBrutAnnuel: number;
  chargesNonRecuperables: number;
  tauxVacance: number;
  provisionGrosEntretien: number;
  assurancePNO: number;
  fraisGestion: number;
  taxeFonciere: number;
  tauxCapitalisation: number;
  ervAnnuel?: number; // Valeur locative de marché (ERV) — pour rendement réversionnaire
}

export interface CapitalisationResult {
  loyerBrutEffectif: number;
  totalCharges: number;
  noi: number;
  tauxCapitalisation: number;
  valeur: number;
  rendementBrut: number;
  rendementNet: number;
  // Rendement réversionnaire (si ERV fourni)
  rendementInitial: number; // Loyer en place / valeur
  rendementReversionnaire?: number; // ERV / valeur
  sousLoue?: boolean; // true si loyer < ERV
  potentielReversion?: number; // Différence ERV - loyer en %
  // Sensibilité
  sensibilite: { tauxCap: number; valeur: number }[];
}

export function calculerCapitalisation(input: CapitalisationInput): CapitalisationResult {
  if (!input || [input.loyerBrutAnnuel,input.chargesNonRecuperables,input.assurancePNO,input.taxeFonciere].some(v=>!Number.isFinite(v)||v<0||v>1e12)
    || [input.tauxVacance,input.provisionGrosEntretien,input.fraisGestion].some(v=>!Number.isFinite(v)||v<0||v>1)
    || !Number.isFinite(input.tauxCapitalisation) || input.tauxCapitalisation<=0 || input.tauxCapitalisation>1
    || (input.ervAnnuel!==undefined&&(!Number.isFinite(input.ervAnnuel)||input.ervAnnuel<0||input.ervAnnuel>1e12))) throw new RangeError('Invalid direct capitalisation inputs');
  const loyerBrutEffectif = input.loyerBrutAnnuel * (1 - input.tauxVacance);
  const fraisGestionMontant = input.loyerBrutAnnuel * input.fraisGestion;
  const provisionMontant = input.loyerBrutAnnuel * input.provisionGrosEntretien;

  const totalCharges =
    input.chargesNonRecuperables +
    fraisGestionMontant +
    provisionMontant +
    input.assurancePNO +
    input.taxeFonciere;

  const noi = loyerBrutEffectif - totalCharges;
  const valeur = noi / input.tauxCapitalisation;
  if (noi <= 0 || !Number.isFinite(valeur)) throw new RangeError('Positive net income is required for direct capitalisation');

  // Rendement réversionnaire
  const rendementInitial = valeur > 0 ? loyerBrutEffectif / valeur : 0;
  let rendementReversionnaire: number | undefined;
  let sousLoue: boolean | undefined;
  let potentielReversion: number | undefined;
  if (input.ervAnnuel !== undefined) {
    const ervEffectif = input.ervAnnuel * (1 - input.tauxVacance);
    rendementReversionnaire = valeur > 0 ? ervEffectif / valeur : 0;
    sousLoue = input.loyerBrutAnnuel < input.ervAnnuel;
    potentielReversion = input.loyerBrutAnnuel > 0
      ? ((input.ervAnnuel - input.loyerBrutAnnuel) / input.loyerBrutAnnuel) * 100
      : 0;
  }

  // Sensibilité cap rate ±25bps, ±50bps, ±100bps
  const sensibilite = [-1.0, -0.5, -0.25, 0, 0.25, 0.5, 1.0].flatMap(delta => {
    const t=input.tauxCapitalisation+delta/100;
    return t>0&&t<=1&&Number.isFinite(noi/t)?[{tauxCap:t*100,valeur:noi/t}]:[];
  });

  return {
    loyerBrutEffectif,
    totalCharges,
    noi,
    tauxCapitalisation: input.tauxCapitalisation,
    valeur,
    rendementBrut: valeur > 0 ? input.loyerBrutAnnuel / valeur : 0,
    rendementNet: valeur > 0 ? noi / valeur : 0,
    rendementInitial,
    rendementReversionnaire,
    sousLoue,
    potentielReversion,
    sensibilite,
  };
}

// ============================================================
// 3. DCF — Discounted Cash Flow (EVS1 — Income Approach)
// ============================================================

export interface DCFInput {
  loyerAnnuelInitial: number;
  tauxIndexation: number; // % annuel d'augmentation du loyer
  tauxVacance: number;
  chargesAnnuelles: number; // Charges propriétaire année 1
  tauxProgressionCharges: number; // % augmentation annuelle des charges
  periodeAnalyse: number; // Nombre d'années (typiquement 10)
  tauxActualisation: number; // Discount rate — SUBJECTIF → configurable
  tauxCapSortie: number; // Exit cap rate pour terminal value — SUBJECTIF → configurable
  fraisCessionPct: number; // Frais de cession à la sortie (%)
}

export interface DCFCashFlow {
  annee: number;
  loyerBrut: number;
  vacance: number;
  loyerNet: number;
  charges: number;
  noi: number;
  facteurActualisation: number;
  noiActualise: number;
}

export interface DCFResult {
  cashFlows: DCFCashFlow[];
  totalNOIActualise: number;
  noiTerminal: number;
  valeurTerminaleBrute: number;
  fraisCession: number;
  valeurTerminaleNette: number;
  valeurTerminaleActualisee: number;
  valeurDCF: number;
  irr: number | null; // Identity at the DCF value for conventional positive flows, not an independent investment return
  sensibilite: { tauxActu: number; tauxCapSortie: number; valeur: number }[];
}

// Calcul du TRI (IRR) par Newton-Raphson
export function calculerIRR(cashFlows: number[], guess: number = 0.08, maxIter: number = 100, tol: number = 1e-7): number {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      dnpv -= t * cashFlows[t] / (factor * (1 + rate));
    }
    if (Math.abs(npv) < tol) return rate;
    if (dnpv === 0) break;
    rate -= npv / dnpv;
  }
  return rate;
}

export function calculerDCF(input: DCFInput): DCFResult {
  const between=(value:number,min:number,max:number)=>Number.isFinite(value)&&value>=min&&value<=max;
  if (!input || !between(input.loyerAnnuelInitial,0,1e12) || !between(input.chargesAnnuelles,0,1e12)
    || !between(input.tauxIndexation,-1,1) || !between(input.tauxProgressionCharges,-1,1)
    || !between(input.tauxVacance,0,1) || !between(input.fraisCessionPct,0,1)
    || !between(input.tauxActualisation,0,1) || !between(input.tauxCapSortie,Number.MIN_VALUE,1)
    || !Number.isInteger(input.periodeAnalyse) || !between(input.periodeAnalyse,1,50)) {
    throw new RangeError('Invalid DCF inputs');
  }
  const cashFlows: DCFCashFlow[] = [];
  let totalNOIActualise = 0;

  for (let i = 1; i <= input.periodeAnalyse; i++) {
    const loyerBrut = input.loyerAnnuelInitial * Math.pow(1 + input.tauxIndexation, i - 1);
    const vacance = loyerBrut * input.tauxVacance;
    const loyerNet = loyerBrut - vacance;
    const charges = input.chargesAnnuelles * Math.pow(1 + input.tauxProgressionCharges, i - 1);
    const noi = loyerNet - charges;
    const facteurActualisation = 1 / Math.pow(1 + input.tauxActualisation, i);
    const noiActualise = noi * facteurActualisation;
    totalNOIActualise += noiActualise;

    cashFlows.push({ annee: i, loyerBrut, vacance, loyerNet, charges, noi, facteurActualisation, noiActualise });
  }

  // Terminal value (année n+1)
  const noiTerminal = input.loyerAnnuelInitial * Math.pow(1 + input.tauxIndexation, input.periodeAnalyse) * (1 - input.tauxVacance)
    - input.chargesAnnuelles * Math.pow(1 + input.tauxProgressionCharges, input.periodeAnalyse);
  if (!Number.isFinite(noiTerminal) || noiTerminal <= 0) throw new RangeError('Capitalised terminal income must be positive');
  const valeurTerminaleBrute = input.tauxCapSortie > 0 ? noiTerminal / input.tauxCapSortie : 0;
  const fraisCession = valeurTerminaleBrute * input.fraisCessionPct;
  const valeurTerminaleNette = valeurTerminaleBrute - fraisCession;
  const facteurTerminal = 1 / Math.pow(1 + input.tauxActualisation, input.periodeAnalyse);
  const valeurTerminaleActualisee = valeurTerminaleNette * facteurTerminal;

  const valeurDCF = totalNOIActualise + valeurTerminaleActualisee;
  if (![totalNOIActualise,valeurTerminaleBrute,valeurTerminaleNette,valeurTerminaleActualisee,valeurDCF].every(Number.isFinite)) throw new RangeError('DCF result exceeds numerical limits');

  // At its own present value, the discount rate is a root by construction.
  // Only report this identity for conventional flows; no Newton fallback or independent yield claim.
  const irr = valeurDCF > 0 && cashFlows.every(cf=>cf.noi>=0) ? input.tauxActualisation : null;

  // Sensibilité : matrice taux actualisation × taux de sortie
  const sensibilite: { tauxActu: number; tauxCapSortie: number; valeur: number }[] = [];
  for (const dActu of [-0.5, 0, 0.5]) {
    for (const dCap of [-0.5, 0, 0.5]) {
      const ta = input.tauxActualisation + dActu / 100;
      const tc = input.tauxCapSortie + dCap / 100;
      if (ta < 0 || tc <= 0) continue;
      let totNOI = 0;
      for (const cf of cashFlows) {
        totNOI += cf.noi / Math.pow(1 + ta, cf.annee);
      }
      const vtBrute = tc > 0 ? noiTerminal / tc : 0;
      const vtNette = vtBrute - vtBrute * input.fraisCessionPct;
      const vtActu = vtNette / Math.pow(1 + ta, input.periodeAnalyse);
      sensibilite.push({
        tauxActu: input.tauxActualisation * 100 + dActu,
        tauxCapSortie: input.tauxCapSortie * 100 + dCap,
        valeur: totNOI + vtActu,
      });
    }
  }

  return {
    cashFlows,
    totalNOIActualise,
    noiTerminal,
    valeurTerminaleBrute,
    fraisCession,
    valeurTerminaleNette,
    valeurTerminaleActualisee,
    valeurDCF,
    irr,
    sensibilite,
  };
}

// ============================================================
// 4. MORTGAGE LENDING VALUE — EVS3 / CRR Art. 229
// ============================================================

export interface MLVInput {
  valeurMarche: number;
  // Sustainability adjustments — CRR requires excluding speculative elements
  decoteConjoncturelle: number; // % — marge prudentielle vs conditions actuelles
  decoteCommercialisation: number; // % — délai/risque de liquidité
  decoteSpecifique: number; // % — risques spécifiques au bien
}

export interface MLVResult {
  valeurMarche: number;
  totalDecotes: number;
  totalDecotesPct: number;
  mlv: number;
  ratioMLVsurMV: number;
  /** Legacy property retained empty: no regulatory risk weights can be inferred from these inputs. */
  ltvBands: never[];
  method: 'documented_haircut_sensitivity';
  regulatoryValue: false;
}

/** Historical function name; arithmetic sensitivity only, not a determination of MLV or CRR property value. */
export function calculerMLV(input: MLVInput): MLVResult {
  if (!input || !Number.isFinite(input.valeurMarche) || input.valeurMarche <= 0 || input.valeurMarche > 1e12
    || [input.decoteConjoncturelle,input.decoteCommercialisation,input.decoteSpecifique].some(v=>!Number.isFinite(v)||v<0||v>100)) throw new RangeError('Invalid valuation sensitivity inputs');
  const totalDecotesPct = input.decoteConjoncturelle + input.decoteCommercialisation + input.decoteSpecifique;
  if (totalDecotesPct > 100) throw new RangeError('Total adjustments exceed 100%');
  const totalDecotes = input.valeurMarche * totalDecotesPct / 100;
  const mlv = input.valeurMarche - totalDecotes;
  return {valeurMarche:input.valeurMarche,totalDecotes,totalDecotesPct,mlv,ratioMLVsurMV:mlv/input.valeurMarche,ltvBands:[],method:'documented_haircut_sensitivity',regulatoryValue:false};
}

// ============================================================
// 5. RÉCONCILIATION DES VALEURS
// ============================================================

export interface ReconciliationInput {
  valeurComparaison?: number;
  poidsComparaison: number; // 0-100
  valeurCapitalisation?: number;
  poidsCapitalisation: number;
  valeurDCF?: number;
  poidsDCF: number;
}

export interface ReconciliationResult {
  valeurReconciliee: number;
  methodes: {
    nom: string;
    valeur: number;
    poids: number;
    contribution: number;
    poidsEffectif: number;
  }[];
  ecartType: number;
  ecartMaxPct: number; // Écart max entre méthodes en %
}

export function reconcilier(input: ReconciliationInput): ReconciliationResult {
  if (!input || [input.poidsComparaison,input.poidsCapitalisation,input.poidsDCF].some(v=>!Number.isFinite(v)||v<0||v>100)
    || [input.valeurComparaison,input.valeurCapitalisation,input.valeurDCF].some(v=>v!==undefined&&(!Number.isFinite(v)||v<0||v>1e15))) throw new RangeError('Invalid reconciliation values or weights');
  const methodes: { nom: string; valeur: number; poids: number }[] = [];

  if (input.valeurComparaison && input.poidsComparaison > 0) {
    methodes.push({ nom: "Comparaison", valeur: input.valeurComparaison, poids: input.poidsComparaison });
  }
  if (input.valeurCapitalisation && input.poidsCapitalisation > 0) {
    methodes.push({ nom: "Capitalisation", valeur: input.valeurCapitalisation, poids: input.poidsCapitalisation });
  }
  if (input.valeurDCF && input.poidsDCF > 0) {
    methodes.push({ nom: "DCF", valeur: input.valeurDCF, poids: input.poidsDCF });
  }

  const totalPoids = methodes.reduce((s, m) => s + m.poids, 0);
  const valeurReconciliee = totalPoids > 0
    ? methodes.reduce((s, m) => s + m.valeur * m.poids, 0) / totalPoids
    : 0;

  const contributions = methodes.map((m) => ({
    ...m,
    contribution: totalPoids > 0 ? (m.valeur * m.poids) / totalPoids : 0,
    poidsEffectif: totalPoids > 0 ? m.poids / totalPoids * 100 : 0,
  }));

  // Écart-type
  const valeurs = methodes.map((m) => m.valeur);
  const moyenne = valeurs.length > 0 ? valeurs.reduce((s, v) => s + v, 0) / valeurs.length : 0;
  const variance = valeurs.length > 1
    ? valeurs.reduce((s, v) => s + Math.pow(v - moyenne, 2), 0) / (valeurs.length - 1)
    : 0;
  const ecartType = Math.sqrt(variance);

  // Écart max entre méthodes
  const ecartMaxPct = valeurs.length >= 2 && moyenne > 0
    ? ((Math.max(...valeurs) - Math.min(...valeurs)) / moyenne) * 100
    : 0;

  return {
    valeurReconciliee,
    methodes: contributions,
    ecartType,
    ecartMaxPct,
  };
}

// ============================================================
// 5b. TERME & RÉVERSION (UK/EMEA Standard)
// ============================================================

export interface TermeReversionInput {
  loyerEnPlace: number; // Loyer actuel annuel
  erv: number; // Estimated Rental Value annuel
  dureeRestanteBail: number; // Années restantes du bail en cours
  tauxTerme: number; // Yield appliqué au loyer en place (plus sûr)
  tauxReversion: number; // Yield appliqué à l'ERV (plus risqué)
}

export interface TermeReversionResult {
  // Terme : loyer en place capitalisé pour la durée restante
  valeurTerme: number;
  facteurTerme: number; // Years' Purchase pour la durée restante
  // Réversion : ERV capitalisé en perpétuité, différé de la durée restante
  valeurReversion: number;
  facteurReversionPerp: number; // YP perpetuity
  facteurDiffere: number; // PV factor
  // Total
  valeur: number;
  rendementEquivalent: number; // Taux commun appliqué au terme et à la réversion
  rendementReversionnaire: number; // ERV / valeur, hors frais
  rendementInitialSimple: number; // Loyer en place / valeur, hors frais
}

export function calculerTermeReversion(input: TermeReversionInput): TermeReversionResult {
  const r1=input.tauxTerme,r2=input.tauxReversion,n=input.dureeRestanteBail;
  if(![input.loyerEnPlace,input.erv,r1,r2,n].every(Number.isFinite)||input.loyerEnPlace<0||input.loyerEnPlace>1e12||input.erv<=0||input.erv>1e12||r1<0||r1>1||r2<=0||r2>1||!Number.isInteger(n)||n<0||n>100)throw new RangeError('Invalid annual term/reversion assumptions');
  // Annual rents in arrears; a zero term rate uses the finite annuity limit n.
  const annuity=(rate:number)=>rate===0?n:-Math.expm1(-n*Math.log1p(rate))/rate;
  const facteurTerme=annuity(r1),valeurTerme=input.loyerEnPlace*facteurTerme;
  const facteurReversionPerp=1/r2,facteurDiffere=Math.exp(-n*Math.log1p(r2));
  const valeurReversion=input.erv*facteurReversionPerp*facteurDiffere,valeur=valeurTerme+valeurReversion;
  if(!Number.isFinite(valeur)||valeur<=0)throw new RangeError('Non-finite capital value');
  const atRate=(rate:number)=>input.loyerEnPlace*annuity(rate)+input.erv/rate*Math.exp(-n*Math.log1p(rate));
  // Both positive cash-flow components decrease with the common rate, so its root
  // is bracketed by the two original rates (the lower bound may be zero).
  let low=Math.min(r1,r2),high=Math.max(r1,r2);
  for(let k=0;k<100&&high>low;k++){
    const mid=(low+high)/2;
    if(atRate(mid)>valeur)low=mid;else high=mid;
  }
  const rendementEquivalent=(low+high)/2;
  return{valeurTerme,facteurTerme,valeurReversion,facteurReversionPerp,facteurDiffere,valeur,rendementEquivalent,rendementReversionnaire:input.erv/valeur,rendementInitialSimple:input.loyerEnPlace/valeur};
}

// ============================================================
// 6. SENSIBILITÉ RÉSIDUELLE À PARTIR DES COÛTS DU DOSSIER
// ============================================================

export interface ResiduelleEnergetiqueInput {
  classeActuelle: string; // A à G
  classeCible: string; // A à C typiquement
  valeurApresRenovation: number; // Valeur estimée une fois à la classe cible
  coutTravauxRenovation: number; // Travaux de mise en conformité
  honorairesEtudes: number; // Audit, maîtrise d'œuvre, bureau d'études
  fraisFinancement: number; // Intérêts intercalaires si financement des travaux
  margePrudentielle: number; // % — aléas chantier, configurable
  aidesPrevues: number; // Klimabonus, Topup, communales, etc.
}

export interface ResiduelleEnergetiqueResult {
  valeurApresRenovation: number;
  coutTotalBrut: number;
  margePrudentielleMontant: number;
  coutTotalAvecMarge: number;
  aidesDeduites: number;
  coutNetApresAides: number;
  valeurResiduelle: number;
  decoteEnergetique: number;
  decoteEnergetiquePct: number;
}

export function calculerResiduelleEnergetique(input: ResiduelleEnergetiqueInput): ResiduelleEnergetiqueResult {
  const values=[input.valeurApresRenovation,input.coutTravauxRenovation,input.honorairesEtudes,input.fraisFinancement,input.margePrudentielle,input.aidesPrevues];
  if(!values.every(v=>Number.isFinite(v)&&v>=0&&v<=1e12)||input.valeurApresRenovation<=0||input.margePrudentielle>100)throw new RangeError('Invalid residual assumptions');
  const coutTotalBrut = input.coutTravauxRenovation + input.honorairesEtudes + input.fraisFinancement;
  const margePrudentielleMontant = coutTotalBrut * (input.margePrudentielle / 100);
  const coutTotalAvecMarge = coutTotalBrut + margePrudentielleMontant;
  if(input.aidesPrevues>coutTotalAvecMarge)throw new RangeError('Confirmed grants exceed budget');
  const aidesDeduites = input.aidesPrevues;
  const coutNetApresAides = coutTotalAvecMarge - aidesDeduites;

  const valeurResiduelle = input.valeurApresRenovation - coutNetApresAides;
  const decoteEnergetique = input.valeurApresRenovation - valeurResiduelle;
  const decoteEnergetiquePct = input.valeurApresRenovation > 0
    ? (decoteEnergetique / input.valeurApresRenovation) * 100
    : 0;

  return {
    valeurApresRenovation: input.valeurApresRenovation,
    coutTotalBrut,
    margePrudentielleMontant,
    coutTotalAvecMarge,
    aidesDeduites,
    coutNetApresAides,
    valeurResiduelle,
    decoteEnergetique,
    decoteEnergetiquePct,
  };
}

// ============================================================
// 7. CRR MONITORING — Suivi de la valeur (EBA GL/2020/06)
// ============================================================

export interface MonitoringInput {
  valeurInitiale: number;
  dateEvaluation: string; // YYYY-MM-DD
  indiceMarche: number; // Variation de l'indice de marché depuis évaluation (%)
  seuilReeval: number; // Seuil de déclenchement réévaluation (%, typiquement -10%)
  montantPret: number;
  typeExposition: "residentiel" | "commercial";
}

export interface MonitoringResult {
  valeurEstimeeActuelle: number;
  variationPct: number;
  reevaluationRequise: boolean;
  raisonReeval: string;
  ltvActuel: number;
  ltvInitial: number;
  alertes: string[];
}

export function evaluerMonitoring(input: MonitoringInput): MonitoringResult {
  const valeurEstimeeActuelle = input.valeurInitiale * (1 + input.indiceMarche / 100);
  const variationPct = input.indiceMarche;
  const ltvInitial = input.valeurInitiale > 0 ? input.montantPret / input.valeurInitiale : 0;
  const ltvActuel = valeurEstimeeActuelle > 0 ? input.montantPret / valeurEstimeeActuelle : 0;

  const alertes: string[] = [];
  let reevaluationRequise = false;
  let raisonReeval = "";

  // Seuil de variation du marché
  if (variationPct <= input.seuilReeval) {
    reevaluationRequise = true;
    raisonReeval = `Baisse de marché de ${Math.abs(variationPct).toFixed(1)}% — dépasse le seuil de ${Math.abs(input.seuilReeval)}%`;
    alertes.push(`Indice de marché en baisse de ${Math.abs(variationPct).toFixed(1)}%`);
  }

  // EBA : réévaluation obligatoire si exposition > 300k€ (commercial) ou à intervalles réguliers
  if (input.typeExposition === "commercial" && input.montantPret > 300_000) {
    alertes.push("Exposition commerciale > 300 000 € — réévaluation annuelle requise (EBA GL/2020/06)");
  }

  // LTV dégradé
  if (ltvActuel > 0.90 && ltvInitial <= 0.90) {
    alertes.push(`LTV passé de ${(ltvInitial * 100).toFixed(1)}% à ${(ltvActuel * 100).toFixed(1)}% — dépassement du seuil 90%`);
    reevaluationRequise = true;
    if (!raisonReeval) raisonReeval = "LTV dégradé au-delà de 90%";
  }

  // Fréquence de réévaluation
  if (input.typeExposition === "residentiel") {
    alertes.push("Résidentiel : monitoring statistique annuel, réévaluation physique tous les 3 ans min. (EBA GL/2020/06)");
  } else {
    alertes.push("Commercial : réévaluation annuelle par évaluateur indépendant si exposition > 300k€ (EBA GL/2020/06)");
  }

  return {
    valeurEstimeeActuelle,
    variationPct,
    reevaluationRequise,
    raisonReeval,
    ltvActuel,
    ltvInitial,
    alertes,
  };
}
