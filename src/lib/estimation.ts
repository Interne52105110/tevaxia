// Estimation indicative : moyenne communale × (1 + somme des hypothèses) × surface.
// Les ajustements ne proviennent pas d’une régression validée sur des ventes individuelles.
import { rechercherCommune, getMarketDataCommune } from "./market-data";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR } from "./adjustments";

export interface EstimationInput {
  commune: string;
  quartier?: string;
  surface: number; // m²
  nbChambres: number;
  etage: string; // clé AJUST_ETAGE
  etat: string; // clé AJUST_ETAT
  exterieur: string; // clé AJUST_EXTERIEUR
  parking: boolean;
  classeEnergie: string; // A à G
  typeBien: "appartement" | "maison";
  estNeuf: boolean;
}

export interface EstimationResult {
  prixM2Base: number;
  sourceBase: string; // D'où vient le prix de base
  ajustements: { labelKey: string; labelParams?: Record<string, string | number>; pct: number }[];
  totalAjustements: number;
  prixM2Ajuste: number;
  estimationBasse: number;
  estimationCentrale: number;
  estimationHaute: number;
  confiance: "forte" | "moyenne" | "faible";
  confianceNote: string;
  // Double modèle : transactions vs annonces
  estimationTransactions: number | null; // basé sur prixM2Existant
  estimationAnnonces: number | null;     // basé sur prixM2Annonces
  ecartPct: number | null;               // écart en % entre les deux
}

// Impact de la classe énergie sur le prix (en %)
// Hypothèses internes, pas de source statistique démontrée pour ces pourcentages.
const IMPACT_ENERGIE: Record<string, number> = {
  "A": 5,
  "B": 3,
  "C": 1,
  "D": 0,  // référence
  "E": -3,
  "F": -6,
  "G": -10,
};

// Ajustement surface : les petites surfaces ont un prix/m² plus élevé
// Hypothèse interne de sensibilité.
function ajustSurface(surface: number): number {
  if (surface < 40) return 8;
  if (surface < 55) return 4;
  if (surface < 70) return 2;
  if (surface < 90) return 0; // référence
  if (surface < 120) return -2;
  if (surface < 150) return -4;
  return -6;
}

export function estimer(input: EstimationInput): EstimationResult | null {
  if (!input || input.typeBien !== "appartement" || !Number.isFinite(input.surface) || input.surface <= 0 || !Number.isInteger(input.nbChambres) || input.nbChambres < 0 || typeof input.commune !== "string") return null;
  const exact = getMarketDataCommune(input.commune);
  const results = exact ? [] : rechercherCommune(input.commune);
  // Une saisie ambiguë ne choisit pas arbitrairement la première commune.
  const commune = exact ?? (results.length === 1 ? results[0].commune : undefined);
  if (!commune) return null;
  // Pas de substitution de l'ancien aux VEFA quand le prix officiel est masqué.
  const prixTransactions = input.estNeuf ? commune.prixM2VEFAHorsAnnexes : commune.prixM2ExistantHorsAnnexes;
  const prixM2Base = prixTransactions ?? (!input.estNeuf ? commune.prixM2Annonces : null);
  if (prixM2Base == null) return null;
  const sourceBase = `${commune.commune} — ${prixTransactions != null ? (input.estNeuf ? "VEFA hors annexes" : "transactions existant hors annexes") : "annonces, annexes comprises"} — ${commune.periode}`;
  // Calculer les ajustements
  const ajustements: { labelKey: string; labelParams?: Record<string, string | number>; pct: number }[] = [];

  // Étage
  const etageMatch = AJUST_ETAGE.find((a) => a.labelKey === input.etage);
  if (etageMatch && etageMatch.value !== 0) {
    ajustements.push({ labelKey: "estAjustEtage", labelParams: { etage: input.etage }, pct: etageMatch.value });
  }

  // État
  const etatMatch = AJUST_ETAT.find((a) => a.labelKey === input.etat);
  if (!input.estNeuf && etatMatch && etatMatch.value !== 0) {
    ajustements.push({ labelKey: "estAjustEtat", labelParams: { etat: input.etat }, pct: etatMatch.value });
  }

  // Extérieur
  const extMatch = AJUST_EXTERIEUR.find((a) => a.labelKey === input.exterieur);
  if (extMatch && extMatch.value !== 0) {
    ajustements.push({ labelKey: "estAjustExterieur", labelParams: { exterieur: input.exterieur }, pct: extMatch.value });
  }

  // Parking
  if (input.parking && prixTransactions != null) {
    ajustements.push({ labelKey: "estAjustParking", pct: 4 });
  }

  // Surface
  const surfAdj = ajustSurface(input.surface);
  if (surfAdj !== 0) {
    ajustements.push({ labelKey: surfAdj > 0 ? "estAjustSurfacePetit" : "estAjustSurfaceGrand", labelParams: { surface: input.surface }, pct: surfAdj });
  }

  // Énergie
  const energieAdj = input.estNeuf ? 0 : (IMPACT_ENERGIE[input.classeEnergie] || 0);
  if (energieAdj !== 0) {
    ajustements.push({ labelKey: "estAjustEnergie", labelParams: { classe: input.classeEnergie }, pct: energieAdj });
  }

  const totalAjustements = ajustements.reduce((s, a) => s + a.pct, 0);
  const prixM2Ajuste = prixM2Base * (1 + totalAjustements / 100);

  const estimationCentrale = Math.round(prixM2Ajuste * input.surface);
  // Marges conventionnelles de sensibilité ; aucun intervalle probabiliste démontré.
  const marge = prixTransactions != null ? 0.18 : 0.25;
  const confiance = "faible" as const;
  const confianceNote = `Hypothèses non validées statistiquement. ${commune.periode}. ${prixTransactions != null ? (input.estNeuf ? commune.nbVEFA : commune.nbTransactions) : commune.nbAnnonces} observations communales ; aucune vente individuelle comparable.`;
  // Ne pas moyenner prix hors annexes et annonces avec annexes : périmètres différents.
  const estimationTransactions = prixTransactions != null ? estimationCentrale : null;
  const estimationAnnonces = prixTransactions == null ? estimationCentrale : null;
  const ecartPct = null;

  return {
    prixM2Base,
    sourceBase,
    ajustements,
    totalAjustements,
    prixM2Ajuste: Math.round(prixM2Ajuste),
    estimationBasse: Math.round(estimationCentrale * (1 - marge)),
    estimationCentrale,
    estimationHaute: Math.round(estimationCentrale * (1 + marge)),
    confiance,
    confianceNote,
    estimationTransactions,
    estimationAnnonces,
    ecartPct,
  };
}

// ============================================================
// MODEL METADATA & BACK-TEST — pour page /transparence
// ============================================================

export interface ModelCoefficient {
  feature: string;
  coefficient: string;
  source: string;
  confidence: string;
}

export const MODEL_COEFFICIENTS: ModelCoefficient[] = [
  { feature: "Surface < 40 m²", coefficient: "+8 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Surface 40-55 m²", coefficient: "+4 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Surface 55-70 m²", coefficient: "+2 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Surface 90-120 m²", coefficient: "-2 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Surface 120-150 m²", coefficient: "-4 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Surface > 150 m²", coefficient: "-6 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Sous-sol", coefficient: "-12 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "RDC", coefficient: "-7 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "1er étage", coefficient: "-3 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "4e-5e étage", coefficient: "+3 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Dernier étage", coefficient: "+5 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Attique / penthouse", coefficient: "+10 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Livré récemment, hors VEFA", coefficient: "+8 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Rénové", coefficient: "+5 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "À rafraîchir", coefficient: "-5 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "À rénover", coefficient: "-12 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Gros travaux", coefficient: "-20 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Classe énergie A", coefficient: "+5 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Classe énergie B", coefficient: "+3 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Classe énergie C", coefficient: "+1 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Classe énergie E", coefficient: "-3 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Classe énergie F", coefficient: "-6 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Classe énergie G", coefficient: "-10 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Parking intérieur", coefficient: "+4 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Pas d'extérieur", coefficient: "-4 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Grand balcon", coefficient: "+3 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Terrasse", coefficient: "+6 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Jardin", coefficient: "+8 %", source: "Hypothèse interne", confidence: "Non validée" },
  { feature: "Terrasse + jardin", coefficient: "+12 %", source: "Hypothèse interne", confidence: "Non validée" },
];

export interface BacktestSample {
  commune: string;
  surface: number;
  etage: string;
  etat: string;
  classeEnergie: string;
  exterieur: string;
  parking: boolean;
  prixReel: number;
  prixEstime: number;
  erreurPct: number;
}

export function backtestModel(): { samples: BacktestSample[]; mape: number; medianError: number; r2Approx: number } {
  // Biens-test synthétiques (basés sur fourchettes Observatoire)
  const testSet: {
    commune: string; surface: number; etage: string; etat: string;
    classeEnergie: string; exterieur: string; parking: boolean;
    prixReel: number;
  }[] = [
    { commune: "Luxembourg", surface: 75, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", classeEnergie: "C", exterieur: "adjExtBalconRef", parking: true, prixReel: 810000 },
    { commune: "Luxembourg", surface: 50, etage: "adjEtage1er", etat: "adjEtatRenove", classeEnergie: "B", exterieur: "adjExtBalconRef", parking: false, prixReel: 560000 },
    { commune: "Esch-sur-Alzette", surface: 85, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", classeEnergie: "D", exterieur: "adjExtBalconRef", parking: true, prixReel: 440000 },
    { commune: "Dudelange", surface: 90, etage: "adjEtageRDC", etat: "adjEtatCorrect", classeEnergie: "E", exterieur: "adjExtJardin", parking: true, prixReel: 380000 },
    { commune: "Differdange", surface: 100, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", classeEnergie: "D", exterieur: "adjExtBalconRef", parking: true, prixReel: 420000 },
    { commune: "Ettelbruck", surface: 72, etage: "adjEtage4e5e", etat: "adjEtatRenove", classeEnergie: "B", exterieur: "adjExtGrandBalcon", parking: false, prixReel: 415000 },
    { commune: "Strassen", surface: 110, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", classeEnergie: "C", exterieur: "adjExtTerrasse", parking: true, prixReel: 980000 },
    { commune: "Bertrange", surface: 65, etage: "adjEtage1er", etat: "adjEtatBonRef", classeEnergie: "D", exterieur: "adjExtBalconRef", parking: true, prixReel: 560000 },
    { commune: "Hesperange", surface: 80, etage: "adjEtage2e3eRef", etat: "adjEtatNeuf", classeEnergie: "A", exterieur: "adjExtTerrasse", parking: true, prixReel: 790000 },
    { commune: "Mersch", surface: 95, etage: "adjEtageRDC", etat: "adjEtatBonRef", classeEnergie: "D", exterieur: "adjExtJardin", parking: true, prixReel: 530000 },
    { commune: "Walferdange", surface: 68, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", classeEnergie: "C", exterieur: "adjExtBalconRef", parking: false, prixReel: 520000 },
    { commune: "Remich", surface: 55, etage: "adjEtageDernier", etat: "adjEtatRenove", classeEnergie: "B", exterieur: "adjExtGrandBalcon", parking: false, prixReel: 350000 },
    { commune: "Pétange", surface: 80, etage: "adjEtage2e3eRef", etat: "adjEtatCorrect", classeEnergie: "E", exterieur: "adjExtBalconRef", parking: true, prixReel: 340000 },
    { commune: "Steinfort", surface: 90, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", classeEnergie: "D", exterieur: "adjExtTerrasse", parking: true, prixReel: 550000 },
    { commune: "Niederanven", surface: 120, etage: "adjEtage2e3eRef", etat: "adjEtatNeuf", classeEnergie: "A", exterieur: "adjExtTerrasseJardin", parking: true, prixReel: 1050000 },
    { commune: "Leudelange", surface: 70, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", classeEnergie: "C", exterieur: "adjExtBalconRef", parking: true, prixReel: 610000 },
    { commune: "Mamer", surface: 85, etage: "adjEtage1er", etat: "adjEtatBonRef", classeEnergie: "D", exterieur: "adjExtBalconRef", parking: true, prixReel: 660000 },
    { commune: "Sandweiler", surface: 75, etage: "adjEtage2e3eRef", etat: "adjEtatRenove", classeEnergie: "B", exterieur: "adjExtTerrasse", parking: false, prixReel: 620000 },
    { commune: "Mondorf-les-Bains", surface: 95, etage: "adjEtageRDC", etat: "adjEtatBonRef", classeEnergie: "D", exterieur: "adjExtJardin", parking: true, prixReel: 510000 },
    { commune: "Junglinster", surface: 80, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", classeEnergie: "D", exterieur: "adjExtBalconRef", parking: true, prixReel: 500000 },
  ];

  const samples: BacktestSample[] = [];
  for (const t of testSet) {
    const result = estimer({
      commune: t.commune,
      surface: t.surface,
      nbChambres: Math.max(1, Math.round(t.surface / 25)),
      etage: t.etage,
      etat: t.etat,
      exterieur: t.exterieur,
      parking: t.parking,
      classeEnergie: t.classeEnergie,
      typeBien: "appartement",
      estNeuf: t.etat === "adjEtatNeuf",
    });
    if (!result) continue;
    const erreurPct = ((result.estimationCentrale - t.prixReel) / t.prixReel) * 100;
    samples.push({
      commune: t.commune,
      surface: t.surface,
      etage: t.etage,
      etat: t.etat,
      classeEnergie: t.classeEnergie,
      exterieur: t.exterieur,
      parking: t.parking,
      prixReel: t.prixReel,
      prixEstime: result.estimationCentrale,
      erreurPct,
    });
  }

  const errors = samples.map((s) => Math.abs(s.erreurPct));
  const mape = errors.length > 0 ? errors.reduce((s, v) => s + v, 0) / errors.length : 0;
  const sorted = [...errors].sort((a, b) => a - b);
  const medianError = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

  const meanReal = samples.reduce((s, v) => s + v.prixReel, 0) / Math.max(1, samples.length);
  const ssTot = samples.reduce((s, v) => s + (v.prixReel - meanReal) ** 2, 0);
  const ssRes = samples.reduce((s, v) => s + (v.prixReel - v.prixEstime) ** 2, 0);
  const r2Approx = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { samples, mape, medianError, r2Approx };
}
