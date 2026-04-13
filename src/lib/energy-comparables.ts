// ============================================================
// DONNÉES COMPARABLES ÉNERGIE PAR COMMUNE — Luxembourg
// ============================================================
//
// Ajustements de prix par classe énergétique, granularité communale.
// Sources :
// - Observatoire de l'Habitat 2025 — prix par classe CPE
// - ECB Climate Risk Assessment 2024
// - PriceHubble EU — green premium analytics
// - STATEC — profils démographiques et revenus par commune

export interface EnergyAdjustment {
  pct: number;
  confidence: "high" | "medium" | "low";
}

export interface EnergyComparableData {
  commune: string;
  sampleSize: number;
  adjustments: Record<string, EnergyAdjustment>;
}

// Moyennes nationales (valeurs de référence — fallback)
const NATIONAL_AVERAGES: EnergyComparableData = {
  commune: "__national__",
  sampleSize: 4200,
  adjustments: {
    A: { pct: 8, confidence: "high" },
    B: { pct: 5, confidence: "high" },
    C: { pct: 2, confidence: "high" },
    D: { pct: 0, confidence: "high" },
    E: { pct: -3, confidence: "high" },
    F: { pct: -7, confidence: "high" },
    G: { pct: -12, confidence: "medium" },
    H: { pct: -18, confidence: "low" },
    I: { pct: -25, confidence: "low" },
  },
};

// Données communales — ajustements spécifiques
// Les primes vertes sont plus fortes dans les communes urbaines à revenus élevés
// (acheteurs plus sensibles ESG, parc plus récent, plus de transactions)
// Les décotes brunes sont plus prononcées dans les zones tendues (coûts de rénovation perçus)
const COMMUNE_DATA: EnergyComparableData[] = [
  {
    commune: "Luxembourg",
    sampleSize: 890,
    adjustments: {
      A: { pct: 10, confidence: "high" },
      B: { pct: 6, confidence: "high" },
      C: { pct: 3, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -4, confidence: "high" },
      F: { pct: -8, confidence: "high" },
      G: { pct: -14, confidence: "medium" },
      H: { pct: -20, confidence: "low" },
      I: { pct: -28, confidence: "low" },
    },
  },
  {
    commune: "Esch-sur-Alzette",
    sampleSize: 420,
    adjustments: {
      A: { pct: 7, confidence: "high" },
      B: { pct: 4, confidence: "high" },
      C: { pct: 2, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "high" },
      F: { pct: -7, confidence: "high" },
      G: { pct: -11, confidence: "medium" },
      H: { pct: -17, confidence: "low" },
      I: { pct: -24, confidence: "low" },
    },
  },
  {
    commune: "Differdange",
    sampleSize: 280,
    adjustments: {
      A: { pct: 6, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "high" },
      F: { pct: -6, confidence: "medium" },
      G: { pct: -10, confidence: "medium" },
      H: { pct: -16, confidence: "low" },
      I: { pct: -22, confidence: "low" },
    },
  },
  {
    commune: "Dudelange",
    sampleSize: 240,
    adjustments: {
      A: { pct: 7, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "high" },
      F: { pct: -6, confidence: "medium" },
      G: { pct: -11, confidence: "medium" },
      H: { pct: -17, confidence: "low" },
      I: { pct: -23, confidence: "low" },
    },
  },
  {
    commune: "Pétange",
    sampleSize: 210,
    adjustments: {
      A: { pct: 6, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "high" },
      F: { pct: -6, confidence: "medium" },
      G: { pct: -10, confidence: "medium" },
      H: { pct: -15, confidence: "low" },
      I: { pct: -21, confidence: "low" },
    },
  },
  {
    commune: "Sanem",
    sampleSize: 190,
    adjustments: {
      A: { pct: 7, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "high" },
      F: { pct: -7, confidence: "medium" },
      G: { pct: -11, confidence: "medium" },
      H: { pct: -17, confidence: "low" },
      I: { pct: -23, confidence: "low" },
    },
  },
  {
    commune: "Hesperange",
    sampleSize: 310,
    adjustments: {
      A: { pct: 9, confidence: "high" },
      B: { pct: 6, confidence: "high" },
      C: { pct: 3, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -4, confidence: "high" },
      F: { pct: -8, confidence: "medium" },
      G: { pct: -13, confidence: "medium" },
      H: { pct: -19, confidence: "low" },
      I: { pct: -27, confidence: "low" },
    },
  },
  {
    commune: "Bettembourg",
    sampleSize: 200,
    adjustments: {
      A: { pct: 7, confidence: "medium" },
      B: { pct: 5, confidence: "medium" },
      C: { pct: 2, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "high" },
      F: { pct: -7, confidence: "medium" },
      G: { pct: -11, confidence: "medium" },
      H: { pct: -17, confidence: "low" },
      I: { pct: -24, confidence: "low" },
    },
  },
  {
    commune: "Schifflange",
    sampleSize: 160,
    adjustments: {
      A: { pct: 6, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "medium" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "medium" },
      F: { pct: -6, confidence: "medium" },
      G: { pct: -10, confidence: "low" },
      H: { pct: -16, confidence: "low" },
      I: { pct: -22, confidence: "low" },
    },
  },
  {
    commune: "Mamer",
    sampleSize: 250,
    adjustments: {
      A: { pct: 9, confidence: "high" },
      B: { pct: 6, confidence: "high" },
      C: { pct: 3, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -4, confidence: "high" },
      F: { pct: -8, confidence: "medium" },
      G: { pct: -13, confidence: "medium" },
      H: { pct: -19, confidence: "low" },
      I: { pct: -26, confidence: "low" },
    },
  },
  {
    commune: "Mersch",
    sampleSize: 170,
    adjustments: {
      A: { pct: 7, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "medium" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "medium" },
      F: { pct: -6, confidence: "medium" },
      G: { pct: -10, confidence: "medium" },
      H: { pct: -16, confidence: "low" },
      I: { pct: -22, confidence: "low" },
    },
  },
  {
    commune: "Ettelbruck",
    sampleSize: 150,
    adjustments: {
      A: { pct: 6, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "medium" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "medium" },
      F: { pct: -6, confidence: "medium" },
      G: { pct: -10, confidence: "medium" },
      H: { pct: -15, confidence: "low" },
      I: { pct: -21, confidence: "low" },
    },
  },
  {
    commune: "Diekirch",
    sampleSize: 120,
    adjustments: {
      A: { pct: 6, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "medium" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "medium" },
      F: { pct: -6, confidence: "medium" },
      G: { pct: -10, confidence: "low" },
      H: { pct: -15, confidence: "low" },
      I: { pct: -21, confidence: "low" },
    },
  },
  {
    commune: "Strassen",
    sampleSize: 270,
    adjustments: {
      A: { pct: 10, confidence: "high" },
      B: { pct: 6, confidence: "high" },
      C: { pct: 3, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -4, confidence: "high" },
      F: { pct: -8, confidence: "medium" },
      G: { pct: -14, confidence: "medium" },
      H: { pct: -20, confidence: "low" },
      I: { pct: -27, confidence: "low" },
    },
  },
  {
    commune: "Bertrange",
    sampleSize: 260,
    adjustments: {
      A: { pct: 9, confidence: "high" },
      B: { pct: 6, confidence: "high" },
      C: { pct: 3, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -4, confidence: "high" },
      F: { pct: -8, confidence: "medium" },
      G: { pct: -13, confidence: "medium" },
      H: { pct: -19, confidence: "low" },
      I: { pct: -26, confidence: "low" },
    },
  },
  {
    commune: "Sandweiler",
    sampleSize: 95,
    adjustments: {
      A: { pct: 8, confidence: "medium" },
      B: { pct: 5, confidence: "medium" },
      C: { pct: 2, confidence: "medium" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "medium" },
      F: { pct: -7, confidence: "medium" },
      G: { pct: -12, confidence: "low" },
      H: { pct: -18, confidence: "low" },
      I: { pct: -25, confidence: "low" },
    },
  },
  {
    commune: "Niederanven",
    sampleSize: 180,
    adjustments: {
      A: { pct: 9, confidence: "medium" },
      B: { pct: 5, confidence: "medium" },
      C: { pct: 3, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -4, confidence: "medium" },
      F: { pct: -7, confidence: "medium" },
      G: { pct: -13, confidence: "medium" },
      H: { pct: -19, confidence: "low" },
      I: { pct: -26, confidence: "low" },
    },
  },
  {
    commune: "Walferdange",
    sampleSize: 200,
    adjustments: {
      A: { pct: 8, confidence: "high" },
      B: { pct: 5, confidence: "high" },
      C: { pct: 2, confidence: "high" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "high" },
      F: { pct: -7, confidence: "medium" },
      G: { pct: -12, confidence: "medium" },
      H: { pct: -18, confidence: "low" },
      I: { pct: -25, confidence: "low" },
    },
  },
  {
    commune: "Steinsel",
    sampleSize: 110,
    adjustments: {
      A: { pct: 8, confidence: "medium" },
      B: { pct: 5, confidence: "medium" },
      C: { pct: 2, confidence: "medium" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "medium" },
      F: { pct: -7, confidence: "medium" },
      G: { pct: -12, confidence: "low" },
      H: { pct: -18, confidence: "low" },
      I: { pct: -25, confidence: "low" },
    },
  },
  {
    commune: "Mondercange",
    sampleSize: 145,
    adjustments: {
      A: { pct: 7, confidence: "medium" },
      B: { pct: 4, confidence: "medium" },
      C: { pct: 2, confidence: "medium" },
      D: { pct: 0, confidence: "high" },
      E: { pct: -3, confidence: "medium" },
      F: { pct: -6, confidence: "medium" },
      G: { pct: -10, confidence: "medium" },
      H: { pct: -16, confidence: "low" },
      I: { pct: -22, confidence: "low" },
    },
  },
];

// Index pour recherche rapide (insensible à la casse)
const COMMUNE_INDEX = new Map<string, EnergyComparableData>(
  COMMUNE_DATA.map((d) => [d.commune.toLowerCase(), d])
);

/** Liste des communes disponibles */
export function getAvailableCommunes(): string[] {
  return COMMUNE_DATA.map((d) => d.commune).sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Retourne les données comparables énergie pour une commune donnée.
 * Si la commune n'est pas trouvée, renvoie les moyennes nationales.
 */
export function getEnergyComparables(commune: string | null): {
  data: EnergyComparableData;
  isCommune: boolean;
} {
  if (!commune) {
    return { data: NATIONAL_AVERAGES, isCommune: false };
  }
  const normalized = commune.toLowerCase().trim();
  const found = COMMUNE_INDEX.get(normalized);
  if (found) {
    return { data: found, isCommune: true };
  }
  return { data: NATIONAL_AVERAGES, isCommune: false };
}

/**
 * Construit les ranges (min / central / max) à partir des données communales.
 * Variance estimée: +/- 40% de l'écart absolu par rapport à D (minimum +/-2pp).
 */
export function buildImpactRange(
  data: EnergyComparableData
): Record<string, { min: number; central: number; max: number; source: string; confidence: "high" | "medium" | "low" }> {
  const result: Record<string, { min: number; central: number; max: number; source: string; confidence: "high" | "medium" | "low" }> = {};
  for (const [classe, adj] of Object.entries(data.adjustments)) {
    const central = adj.pct;
    const spread = Math.max(2, Math.round(Math.abs(central) * 0.4));
    const sourceLabel = data.commune === "__national__"
      ? "Moyennes nationales — Observatoire 2025"
      : `${data.commune} — ${data.sampleSize} transactions`;
    result[classe] = {
      min: central - spread,
      central,
      max: central + spread,
      source: sourceLabel,
      confidence: adj.confidence,
    };
  }
  return result;
}
