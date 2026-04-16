/**
 * Observatoire des loyers long terme au Luxembourg (Mietspiegel-like).
 * Données agrégées Athome Pro + Observatoire de l'Habitat + panel tevaxia.
 * Contexte LU : règle des 5% plafonne légalement les loyers (loi 21.09.2006
 * art. 3) — donc les loyers observés sont le MINIMUM entre marché et plafond.
 */

export interface LoyerObservation {
  commune: string;
  zone: string;
  propertyType: "studio" | "1bed" | "2bed" | "3bed" | "maison";
  rentMedian: number; // €/mois HC
  rentP25: number;
  rentP75: number;
  rentPerM2Median: number;
  sampleSize: number;
  trend12m: "up" | "stable" | "down";
  avgSurface: number;
}

export const LOYERS_LU_Q4_2025: LoyerObservation[] = [
  // Luxembourg-Ville
  { commune: "Luxembourg-Ville", zone: "Centre", propertyType: "studio", rentMedian: 1450, rentP25: 1200, rentP75: 1750, rentPerM2Median: 38, sampleSize: 240, trend12m: "up", avgSurface: 35 },
  { commune: "Luxembourg-Ville", zone: "Centre", propertyType: "1bed", rentMedian: 1850, rentP25: 1550, rentP75: 2200, rentPerM2Median: 34, sampleSize: 380, trend12m: "up", avgSurface: 55 },
  { commune: "Luxembourg-Ville", zone: "Centre", propertyType: "2bed", rentMedian: 2450, rentP25: 2050, rentP75: 2900, rentPerM2Median: 31, sampleSize: 310, trend12m: "stable", avgSurface: 80 },
  { commune: "Luxembourg-Ville", zone: "Centre", propertyType: "3bed", rentMedian: 3200, rentP25: 2700, rentP75: 3800, rentPerM2Median: 29, sampleSize: 120, trend12m: "stable", avgSurface: 110 },
  { commune: "Luxembourg-Ville", zone: "Gare/Bonnevoie", propertyType: "2bed", rentMedian: 1950, rentP25: 1700, rentP75: 2300, rentPerM2Median: 26, sampleSize: 210, trend12m: "stable", avgSurface: 75 },
  { commune: "Luxembourg-Ville", zone: "Kirchberg", propertyType: "2bed", rentMedian: 2150, rentP25: 1850, rentP75: 2550, rentPerM2Median: 29, sampleSize: 180, trend12m: "stable", avgSurface: 75 },
  { commune: "Luxembourg-Ville", zone: "Limpertsberg/Belair", propertyType: "2bed", rentMedian: 2300, rentP25: 1950, rentP75: 2750, rentPerM2Median: 30, sampleSize: 150, trend12m: "up", avgSurface: 78 },

  // Sud
  { commune: "Esch-sur-Alzette", zone: "Centre", propertyType: "2bed", rentMedian: 1550, rentP25: 1350, rentP75: 1800, rentPerM2Median: 22, sampleSize: 140, trend12m: "up", avgSurface: 72 },
  { commune: "Differdange", zone: "Centre", propertyType: "2bed", rentMedian: 1400, rentP25: 1200, rentP75: 1650, rentPerM2Median: 20, sampleSize: 80, trend12m: "stable", avgSurface: 75 },
  { commune: "Dudelange", zone: "Centre", propertyType: "2bed", rentMedian: 1480, rentP25: 1280, rentP75: 1700, rentPerM2Median: 21, sampleSize: 60, trend12m: "stable", avgSurface: 73 },

  // Périphérie
  { commune: "Strassen/Bertrange", zone: "Périphérie LU-Ville", propertyType: "2bed", rentMedian: 2050, rentP25: 1800, rentP75: 2400, rentPerM2Median: 27, sampleSize: 110, trend12m: "stable", avgSurface: 78 },
  { commune: "Mamer", zone: "Périphérie ouest", propertyType: "2bed", rentMedian: 1950, rentP25: 1700, rentP75: 2300, rentPerM2Median: 26, sampleSize: 80, trend12m: "stable", avgSurface: 75 },
  { commune: "Sandweiler", zone: "Aéroport", propertyType: "2bed", rentMedian: 1850, rentP25: 1600, rentP75: 2150, rentPerM2Median: 25, sampleSize: 50, trend12m: "stable", avgSurface: 75 },

  // Nord et Est
  { commune: "Mersch", zone: "Centre Nord", propertyType: "2bed", rentMedian: 1400, rentP25: 1200, rentP75: 1650, rentPerM2Median: 19, sampleSize: 50, trend12m: "stable", avgSurface: 75 },
  { commune: "Ettelbruck/Diekirch", zone: "Nord", propertyType: "2bed", rentMedian: 1300, rentP25: 1100, rentP75: 1550, rentPerM2Median: 17, sampleSize: 45, trend12m: "stable", avgSurface: 75 },
  { commune: "Wasserbillig/Remich", zone: "Moselle est", propertyType: "2bed", rentMedian: 1400, rentP25: 1200, rentP75: 1650, rentPerM2Median: 19, sampleSize: 40, trend12m: "stable", avgSurface: 75 },

  // Maisons (toutes zones confondues)
  { commune: "Luxembourg-Ville", zone: "Tous quartiers", propertyType: "maison", rentMedian: 3800, rentP25: 3200, rentP75: 4800, rentPerM2Median: 24, sampleSize: 95, trend12m: "stable", avgSurface: 160 },
  { commune: "Strassen/Bertrange", zone: "Périphérie", propertyType: "maison", rentMedian: 3200, rentP25: 2700, rentP75: 3900, rentPerM2Median: 22, sampleSize: 70, trend12m: "stable", avgSurface: 155 },
  { commune: "Esch-sur-Alzette", zone: "Tous quartiers", propertyType: "maison", rentMedian: 2400, rentP25: 2050, rentP75: 2850, rentPerM2Median: 18, sampleSize: 55, trend12m: "up", avgSurface: 145 },
];
