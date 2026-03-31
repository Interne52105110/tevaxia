import type { MarketDataCommune } from "@/lib/market-data";

export interface MarketScoreResult {
  score: number; // 0-100
  level: "Tres actif" | "Actif" | "Modere" | "Calme";
  components: { label: string; score: number }[];
}

export function computeMarketScore(commune: MarketDataCommune): MarketScoreResult {
  const components: { label: string; score: number }[] = [];

  // 1. Liquidity (nbTransactions)
  const tx = commune.nbTransactions ?? 0;
  const liquidityScore = tx > 100 ? 25 : tx > 50 ? 20 : tx > 20 ? 15 : 10;
  components.push({ label: "Liquidite", score: liquidityScore });

  // 2. Price trend (compare existant vs annonces)
  let trendScore = 15; // neutral default
  if (commune.prixM2Existant && commune.prixM2Annonces) {
    const ecart = (commune.prixM2Annonces - commune.prixM2Existant) / commune.prixM2Existant;
    if (ecart > 0.02) {
      trendScore = 25; // positive: annonces above transactions = demand
    } else if (ecart < -0.02) {
      trendScore = 10; // negative: annonces below transactions
    }
  }
  components.push({ label: "Tendance prix", score: trendScore });

  // 3. Yield (if loyerM2 and prixM2 exist)
  let yieldScore = 15; // default
  if (commune.loyerM2Annonces && commune.prixM2Existant) {
    const rendement = (commune.loyerM2Annonces * 12) / commune.prixM2Existant * 100;
    if (rendement > 4) {
      yieldScore = 25;
    } else if (rendement > 3) {
      yieldScore = 20;
    } else {
      yieldScore = 15;
    }
  }
  components.push({ label: "Rendement", score: yieldScore });

  // 4. Data density (has quartiers?)
  const densityScore = commune.quartiers && commune.quartiers.length > 0 ? 25 : 15;
  components.push({ label: "Densite donnees", score: densityScore });

  const score = components.reduce((sum, c) => sum + c.score, 0);

  let level: MarketScoreResult["level"];
  if (score >= 80) {
    level = "Tres actif";
  } else if (score >= 65) {
    level = "Actif";
  } else if (score >= 50) {
    level = "Modere";
  } else {
    level = "Calme";
  }

  return { score, level, components };
}

export function getScoreColor(level: MarketScoreResult["level"]): string {
  switch (level) {
    case "Tres actif":
      return "bg-green-100 text-green-800";
    case "Actif":
      return "bg-blue-100 text-blue-800";
    case "Modere":
      return "bg-amber-100 text-amber-800";
    case "Calme":
      return "bg-gray-100 text-gray-600";
  }
}

export function getScoreBarColor(level: MarketScoreResult["level"]): string {
  switch (level) {
    case "Tres actif":
      return "bg-green-500";
    case "Actif":
      return "bg-blue-500";
    case "Modere":
      return "bg-amber-500";
    case "Calme":
      return "bg-gray-400";
  }
}
