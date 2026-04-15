// ============================================================
// GESTION LOCATIVE LU — lots, baux, règle des 5 %, Klimabonus
// ============================================================
// Spécificités LU qui manquent aux leaders (Rentila, Smovin) :
// - plafond légal de loyer basé sur 5 % du capital investi réévalué
// - impact classe énergétique (Klimabonus en rénovation)
// - aides communales / Habitat Abordable

import { calculerCapitalInvesti } from "./calculations";

const STORAGE_KEY = "tevaxia_rental_properties";

export type EnergyClass = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "NC";

export interface RentalLot {
  id: string;
  name: string;
  address?: string;
  commune?: string;

  // Caractéristiques
  surface: number; // m²
  nbChambres?: number;
  classeEnergie: EnergyClass;
  estMeuble: boolean;

  // Acquisition & travaux (règle 5%)
  prixAcquisition: number;
  anneeAcquisition: number;
  travauxMontant: number;
  travauxAnnee: number;

  // Location actuelle
  loyerMensuelActuel: number; // charges non comprises
  chargesMensuelles: number; // charges locatives mensuelles
  tenantName?: string;
  leaseStartDate?: string; // YYYY-MM
  leaseEndDate?: string; // YYYY-MM
  vacant: boolean;

  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface LotAnalysis {
  lot: RentalLot;
  loyerLegalMensuelMax: number;
  loyerLegalM2Mensuel: number;
  ecartLegalPct: number; // (loyerActuel - max) / max — négatif si sous le plafond
  depasseLegal: boolean;

  rendementBrutPct: number; // loyerAnnuel / prixAcquisition
  rendementNetApproximatif: number; // brut - 1.5% charges

  klimabonusEligible: boolean; // classes E/F/G éligibles à la rénovation
  klimabonusMessage?: string;
}

export interface PortfolioSummary {
  nbLots: number;
  nbVacants: number;
  loyerMensuelTotal: number;
  loyerAnnuelTotal: number;
  surfaceTotale: number;
  capitalTotal: number;
  rendementBrutMoyen: number;
  lotsHorsPlafond: number;
  lotsKlimabonus: number;
}

// ---------- Storage ----------

function load(): RentalLot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RentalLot[]) : [];
  } catch {
    return [];
  }
}

function persist(lots: RentalLot[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lots));
}

export function listLots(): RentalLot[] {
  return load().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export function getLot(id: string): RentalLot | null {
  return load().find((l) => l.id === id) ?? null;
}

export function saveLot(lot: Omit<RentalLot, "id" | "createdAt" | "updatedAt"> & { id?: string }): RentalLot {
  const lots = load();
  const now = new Date().toISOString();
  if (lot.id) {
    const idx = lots.findIndex((l) => l.id === lot.id);
    const existing = idx >= 0 ? lots[idx] : null;
    const updated: RentalLot = {
      ...(existing ?? { createdAt: now }),
      ...lot,
      id: lot.id,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    } as RentalLot;
    if (idx >= 0) lots[idx] = updated;
    else lots.push(updated);
    persist(lots);
    return updated;
  }
  const created: RentalLot = {
    ...lot,
    id: `lot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  lots.push(created);
  persist(lots);
  return created;
}

export function deleteLot(id: string): void {
  persist(load().filter((l) => l.id !== id));
}

// ---------- Calculs ----------

export function analyzeLot(lot: RentalLot): LotAnalysis {
  const currentYear = new Date().getFullYear();
  const capital = calculerCapitalInvesti({
    prixAcquisition: lot.prixAcquisition,
    anneeAcquisition: lot.anneeAcquisition,
    travauxMontant: lot.travauxMontant,
    travauxAnnee: lot.travauxAnnee || lot.anneeAcquisition,
    anneeBail: currentYear,
    surfaceHabitable: lot.surface,
    appliquerVetuste: true,
    tauxVetusteAnnuel: 1,
    estMeuble: lot.estMeuble,
  });

  const loyerAnnuelActuel = lot.loyerMensuelActuel * 12;
  const ecartLegalPct = capital.loyerMensuelMax > 0
    ? (lot.loyerMensuelActuel - capital.loyerMensuelMax) / capital.loyerMensuelMax
    : 0;

  const rendementBrutPct = lot.prixAcquisition > 0
    ? loyerAnnuelActuel / lot.prixAcquisition
    : 0;

  const klimabonusEligible = ["E", "F", "G"].includes(lot.classeEnergie);
  const klimabonusMessage = klimabonusEligible
    ? "Classe énergie E/F/G — rénovation énergétique éligible Klimabonus (jusqu'à 65 % des travaux + prime CO₂)."
    : undefined;

  return {
    lot,
    loyerLegalMensuelMax: capital.loyerMensuelMax,
    loyerLegalM2Mensuel: capital.loyerM2Mensuel,
    ecartLegalPct,
    depasseLegal: lot.loyerMensuelActuel > capital.loyerMensuelMax && capital.loyerMensuelMax > 0,
    rendementBrutPct,
    rendementNetApproximatif: Math.max(0, rendementBrutPct - 0.015),
    klimabonusEligible,
    klimabonusMessage,
  };
}

export function summarize(lots: RentalLot[]): PortfolioSummary {
  const analyses = lots.map(analyzeLot);
  const loyerMensuelTotal = lots.filter((l) => !l.vacant).reduce((s, l) => s + l.loyerMensuelActuel, 0);
  const capitalTotal = lots.reduce((s, l) => s + l.prixAcquisition, 0);
  const loyerAnnuelTotal = loyerMensuelTotal * 12;
  const rendementBrutMoyen = capitalTotal > 0 ? loyerAnnuelTotal / capitalTotal : 0;

  return {
    nbLots: lots.length,
    nbVacants: lots.filter((l) => l.vacant).length,
    loyerMensuelTotal,
    loyerAnnuelTotal,
    surfaceTotale: lots.reduce((s, l) => s + l.surface, 0),
    capitalTotal,
    rendementBrutMoyen,
    lotsHorsPlafond: analyses.filter((a) => a.depasseLegal).length,
    lotsKlimabonus: analyses.filter((a) => a.klimabonusEligible).length,
  };
}
