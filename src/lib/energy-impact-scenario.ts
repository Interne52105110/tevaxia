import type { ImpactResponse } from "./energy-api";
export const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
export type EnergyClass = typeof ENERGY_CLASSES[number];
export type EnergyHypotheses = Record<EnergyClass, number>;
// Illustrative sensitivity inputs, not observed prices or official coefficients.
export const EXAMPLE_ENERGY_HYPOTHESES: EnergyHypotheses = { A: 8, B: 5, C: 2, D: 0, E: -3, F: -7, G: -12, H: -18, I: -25 };
export function calculateEnergyImpactScenario(value: number, current: EnergyClass, hypotheses: EnergyHypotheses): ImpactResponse {
  if (!Number.isFinite(value) || value <= 0 || value > 100_000_000 || !ENERGY_CLASSES.includes(current)) throw new Error("Invalid property");
  for (const key of ENERGY_CLASSES) {
    if (!Number.isFinite(hypotheses[key]) || hypotheses[key] < -90 || hypotheses[key] > 100) throw new Error("Invalid hypothesis");
  }
  if (hypotheses.D !== 0) throw new Error("D is the reference");
  const base = value / (1 + hypotheses[current] / 100);
  return { valeurBase: base, classeActuelle: current,
    classes: ENERGY_CLASSES.map(classe => {
      const adjusted = classe === current ? value : base * (1 + hypotheses[classe] / 100);
      return { classe, ajustementPct: hypotheses[classe], valeurAjustee: adjusted, delta: adjusted - value };
    }),
    methodologie: "Scenario de sensibilite : valeur cible = valeur actuelle × (1 + hypothese cible / 100) / (1 + hypothese actuelle / 100). D = reference 0 %. Coefficients saisis ou exemples illustratifs, sans calibration statistique. Ni estimation de marche, ni gain garanti. Travaux, frais et fiscalite exclus. La classe CPE seule ne determine ni consommation reelle ni emissions de CO2.",
    sources: [],
  };
}
