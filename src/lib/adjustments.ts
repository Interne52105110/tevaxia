// ============================================================
// COEFFICIENTS D'AJUSTEMENT — DONNÉES STATISTIQUES LUXEMBOURG
// ============================================================
// Sources :
// - Observatoire de l'Habitat — modèle hédonique (data.public.lu)
// - STATEC — indices des prix résidentiels
// - Publications Athome/Wort — analyses marché
// - Pratique professionnelle évaluation LU

// Types (déclarés en premier pour être utilisés dans les constantes)
export interface AdjustmentSuggestion {
  label: string;
  value: number;
  range: [number, number];
}

export interface AdjustmentGuide {
  critere: string;
  description: string;
  reference: string;
  source: string;
  suggestions: AdjustmentSuggestion[];
}

// Ajustements étage (résidentiel — appartements)
// Référence : 2ème-3ème étage avec ascenseur = 0%
// Source : modèle hédonique Observatoire de l'Habitat
export const AJUST_ETAGE: AdjustmentSuggestion[] = [
  { label: "Sous-sol / rez-de-jardin", value: -12, range: [-15, -8] },
  { label: "Rez-de-chaussée", value: -7, range: [-10, -5] },
  { label: "1er étage", value: -3, range: [-5, -1] },
  { label: "2ème–3ème étage (réf.)", value: 0, range: [0, 0] },
  { label: "4ème–5ème étage", value: 3, range: [1, 5] },
  { label: "Dernier étage", value: 5, range: [3, 8] },
  { label: "Attique / Penthouse", value: 10, range: [5, 15] },
];

// Ajustements état / condition
// Référence : bon état standard = 0%
export const AJUST_ETAT: AdjustmentSuggestion[] = [
  { label: "Neuf / jamais habité", value: 8, range: [5, 12] },
  { label: "Rénové récemment (< 5 ans)", value: 5, range: [3, 8] },
  { label: "Bon état (réf.)", value: 0, range: [0, 0] },
  { label: "Correct, à rafraîchir", value: -5, range: [-8, -3] },
  { label: "À rénover (travaux moyens)", value: -12, range: [-15, -8] },
  { label: "Gros travaux nécessaires", value: -20, range: [-25, -15] },
];

// Ajustements extérieur
// Référence : balcon standard = 0%
export const AJUST_EXTERIEUR: AdjustmentSuggestion[] = [
  { label: "Pas d'extérieur", value: -4, range: [-6, -2] },
  { label: "Balcon standard (réf.)", value: 0, range: [0, 0] },
  { label: "Grand balcon / loggia", value: 3, range: [2, 5] },
  { label: "Terrasse (> 15m²)", value: 6, range: [4, 10] },
  { label: "Jardin privatif", value: 8, range: [5, 15] },
  { label: "Terrasse + jardin", value: 12, range: [8, 18] },
];

// Ajustements parking
// Valeur absolue d'un emplacement, convertie en % selon le prix du bien
// Source : transactions observées, publications marché LU
export const AJUST_PARKING = {
  interieur: { valeurLuxVille: 45000, valeurAutre: 30000, description: "Emplacement intérieur couvert" },
  exterieur: { valeurLuxVille: 25000, valeurAutre: 18000, description: "Emplacement extérieur" },
  double: { valeurLuxVille: 80000, valeurAutre: 55000, description: "Box double / garage fermé" },
};

export function calculerAjustParking(
  compAParking: boolean,
  bienAParking: boolean,
  prixComparable: number,
  estLuxVille: boolean
): number {
  if (compAParking === bienAParking) return 0;
  const valeur = estLuxVille ? AJUST_PARKING.interieur.valeurLuxVille : AJUST_PARKING.interieur.valeurAutre;
  const pct = prixComparable > 0 ? (valeur / prixComparable) * 100 : 0;
  // Comparable a parking mais pas le bien → comparable supérieur → ajustement négatif
  return compAParking ? -Math.round(pct) : Math.round(pct);
}

// Ajustements localisation intra-commune
// Très variable — fourchettes indicatives
export const AJUST_LOCALISATION: AdjustmentSuggestion[] = [
  { label: "Quartier premium / hypercentre", value: 8, range: [5, 15] },
  { label: "Bon quartier résidentiel", value: 3, range: [1, 5] },
  { label: "Quartier moyen (réf.)", value: 0, range: [0, 0] },
  { label: "Quartier moins prisé", value: -5, range: [-8, -3] },
  { label: "Périphérie / zone bruyante", value: -10, range: [-15, -5] },
];

// Indexation temporelle — variation annuelle des prix au Luxembourg
// Source : STATEC / Observatoire de l'Habitat
export const INDICES_PRIX_ANNUELS: Record<number, number> = {
  2015: 5.2,
  2016: 5.8,
  2017: 4.9,
  2018: 7.1,
  2019: 6.8,
  2020: 8.4,
  2021: 13.9,
  2022: 5.6,
  2023: -7.8,
  2024: -3.2,
  2025: 2.1,
  2026: 2.5, // estimation
};

// Calcul de l'ajustement date : ramener le comparable à la date de valeur
// Si le comparable a été vendu il y a 2 ans et les prix ont monté de 5%, ajust = +5%
export function calculerAjustDate(dateVenteComparable: string, dateValeur: string = "2025-06"): {
  ajustement: number;
  detail: string;
} {
  const [anneeVente, moisVente] = dateVenteComparable.split("-").map(Number);
  const [anneeValeur, moisValeur] = dateValeur.split("-").map(Number);

  if (!anneeVente || !anneeValeur) return { ajustement: 0, detail: "Date non valide" };

  // Calcul simplifié par année
  let totalVariation = 0;
  const details: string[] = [];

  if (anneeVente === anneeValeur) {
    const moisDiff = (moisValeur || 6) - (moisVente || 6);
    const variationAnnuelle = INDICES_PRIX_ANNUELS[anneeVente] || 2;
    const ajust = (variationAnnuelle / 12) * moisDiff;
    totalVariation = Math.round(ajust * 10) / 10;
    details.push(`${anneeVente}: ${variationAnnuelle > 0 ? "+" : ""}${variationAnnuelle}%/an`);
  } else {
    // Prorata première année (mois restants)
    const moisRestants1 = 12 - (moisVente || 6);
    const var1 = INDICES_PRIX_ANNUELS[anneeVente] || 2;
    totalVariation += (var1 / 12) * moisRestants1;
    details.push(`${anneeVente}: ${var1 > 0 ? "+" : ""}${var1}%`);

    // Années pleines
    for (let a = anneeVente + 1; a < anneeValeur; a++) {
      const v = INDICES_PRIX_ANNUELS[a] || 2;
      totalVariation += v;
      details.push(`${a}: ${v > 0 ? "+" : ""}${v}%`);
    }

    // Prorata dernière année
    const moisDernier = moisValeur || 6;
    const varDernier = INDICES_PRIX_ANNUELS[anneeValeur] || 2;
    totalVariation += (varDernier / 12) * moisDernier;
    details.push(`${anneeValeur}: ${varDernier > 0 ? "+" : ""}${varDernier}%`);
  }

  return {
    ajustement: Math.round(totalVariation * 10) / 10,
    detail: details.join(" → "),
  };
}

export const ALL_GUIDES: AdjustmentGuide[] = [
  {
    critere: "localisation",
    description: "Qualité du quartier par rapport au comparable",
    reference: "Quartier moyen = 0%",
    source: "Pratique professionnelle / modèle hédonique Observatoire",
    suggestions: AJUST_LOCALISATION,
  },
  {
    critere: "etat",
    description: "État d'entretien et de rénovation",
    reference: "Bon état standard = 0%",
    source: "Observatoire de l'Habitat — modèle hédonique",
    suggestions: AJUST_ETAT,
  },
  {
    critere: "etage",
    description: "Étage et vue (appartements)",
    reference: "2ème–3ème étage avec ascenseur = 0%",
    source: "Observatoire de l'Habitat — modèle hédonique",
    suggestions: AJUST_ETAGE,
  },
  {
    critere: "exterieur",
    description: "Balcon, terrasse, jardin",
    reference: "Balcon standard = 0%",
    source: "Transactions observées marché LU",
    suggestions: AJUST_EXTERIEUR,
  },
  {
    critere: "parking",
    description: "Stationnement",
    reference: `Intérieur : ~${AJUST_PARKING.interieur.valeurAutre / 1000}k€ (province) / ~${AJUST_PARKING.interieur.valeurLuxVille / 1000}k€ (Lux-Ville)`,
    source: "Transactions observées marché LU",
    suggestions: [
      { label: "Pas de parking (bien en a un)", value: -5, range: [-7, -3] },
      { label: "Même situation (réf.)", value: 0, range: [0, 0] },
      { label: "Pas de parking (bien n'en a pas)", value: 5, range: [3, 7] },
      { label: "Box fermé en plus", value: 7, range: [5, 10] },
    ],
  },
];
