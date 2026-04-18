// ============================================================
// Hôtellerie — Workflow pré-acquisition unifié
// ============================================================
//
// Module de synthèse pour une acquisition hôtelière : triangulation de
// valorisation (3 méthodes), structure de financement avec DSCR, business
// plan 5 ans, exit à 5/7/10 ans, IRR equity, score go/no-go global.
//
// Méthodes :
// 1. Multiple EBITDA (8-14x selon cat.)
// 2. Prix/clé (comparable transactions LU/BE/FR)
// 3. DCF simplifié 5 ans + terminal
// ============================================================

import type { HotelCategory } from "./types";

export interface PreAcqDeal {
  // Target
  name: string;
  commune: string;
  category: HotelCategory;
  nb_rooms: number;
  asking_price: number; // EUR

  // Exploitation actuelle
  adr: number;
  occupancy: number; // 0-1
  fb_revenue: number; // EUR/an
  other_revenue: number;
  staff_cost: number;
  energy_cost: number;
  other_opex: number;
  taxe_fonciere: number;

  // Hypothèses croissance
  adr_growth_pct: number; // ex: 0.02
  occupancy_growth_pct: number;
  opex_inflation_pct: number;

  // Financement
  equity: number;
  debt: number;
  debt_rate_pct: number;
  debt_term_years: number;

  // CAPEX
  capex_entry: number; // immédiat (rénovation, FF&E)
  capex_reserve_pct: number; // % CA annuel FF&E réserve

  // Sortie
  exit_year: 5 | 7 | 10;
  exit_cap_rate: number;
}

export interface PreAcqProjectionYear {
  year: number;
  rooms_revenue: number;
  fb_revenue: number;
  other_revenue: number;
  total_revenue: number;
  gop: number; // gross operating profit (avant TF + ffe)
  gop_margin: number;
  ebitda: number;
  ebitda_margin: number;
  debt_service: number;
  dscr: number;
  cash_flow_to_equity: number;
}

export interface PreAcqResult {
  // Snapshot actuel
  current_revpar: number;
  current_total_revenue: number;
  current_gop: number;
  current_gop_margin: number;
  current_ebitda: number;
  current_ebitda_margin: number;

  // Valorisation triangulation
  val_ebitda_multiple: number;
  val_price_per_key: number;
  val_dcf: number;
  fair_value: number; // moyenne pondérée
  ask_vs_fair_pct: number; // >0 = surpayé

  // Financement
  loan_payment_annual: number;
  dscr_year1: number;
  ltv: number;

  // Business plan 5 ans
  projection: PreAcqProjectionYear[];

  // Exit
  exit_ebitda: number;
  exit_value: number;
  debt_balance_at_exit: number;
  equity_return: number;
  equity_multiple: number;
  irr_equity: number;

  // Go/no-go
  score: number; // 0-100
  signals: { label: string; status: "ok" | "warn" | "bad"; detail: string }[];
}

// ============================================================
// Multiples & caps par catégorie (marché LU 2026)
// ============================================================

const EBITDA_MULTIPLE: Record<HotelCategory, number> = {
  budget: 8,
  midscale: 10,
  upscale: 12,
  luxury: 14,
};

const PRICE_PER_KEY_LU: Record<HotelCategory, number> = {
  budget: 110_000,
  midscale: 180_000,
  upscale: 320_000,
  luxury: 550_000,
};

const DEFAULT_DISCOUNT_RATE = 0.09;

// ============================================================
// Amortissement annuité constante
// ============================================================

function annualLoanPayment(principal: number, ratePct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = ratePct;
  if (r === 0) return principal / years;
  return (principal * r) / (1 - Math.pow(1 + r, -years));
}

function remainingDebt(principal: number, ratePct: number, years: number, yearsElapsed: number): number {
  if (yearsElapsed >= years) return 0;
  const pmt = annualLoanPayment(principal, ratePct, years);
  const r = ratePct;
  if (r === 0) return principal - pmt * yearsElapsed;
  return principal * Math.pow(1 + r, yearsElapsed) - pmt * ((Math.pow(1 + r, yearsElapsed) - 1) / r);
}

// ============================================================
// IRR par dichotomie (Newton-Raphson trop instable sur CF courts)
// ============================================================

function irr(cashflows: number[]): number {
  const npv = (rate: number) =>
    cashflows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i), 0);
  let low = -0.99;
  let high = 5;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const v = npv(mid);
    if (Math.abs(v) < 0.5) return mid;
    if (v > 0) low = mid; else high = mid;
  }
  return (low + high) / 2;
}

// ============================================================
// Calcul principal
// ============================================================

export function computePreAcquisition(d: PreAcqDeal): PreAcqResult {
  // ---- Snapshot actuel
  const current_revpar = d.adr * d.occupancy;
  const rooms_rev = current_revpar * d.nb_rooms * 365;
  const current_total_revenue = rooms_rev + d.fb_revenue + d.other_revenue;
  const total_opex = d.staff_cost + d.energy_cost + d.other_opex;
  const current_gop = current_total_revenue - total_opex;
  const current_gop_margin = current_total_revenue > 0 ? current_gop / current_total_revenue : 0;
  const ffe_reserve = current_total_revenue * d.capex_reserve_pct;
  const current_ebitda = current_gop - d.taxe_fonciere - ffe_reserve;
  const current_ebitda_margin = current_total_revenue > 0 ? current_ebitda / current_total_revenue : 0;

  // ---- Valorisation triangulation
  const val_ebitda_multiple = current_ebitda * EBITDA_MULTIPLE[d.category];
  const val_price_per_key = d.nb_rooms * PRICE_PER_KEY_LU[d.category];

  // DCF simplifié : projection 5 ans puis Gordon
  let dcfSum = 0;
  for (let y = 1; y <= 5; y++) {
    const ebitdaY = current_ebitda * Math.pow(1 + (d.adr_growth_pct + d.occupancy_growth_pct) / 2, y);
    dcfSum += ebitdaY / Math.pow(1 + DEFAULT_DISCOUNT_RATE, y);
  }
  const terminal = (current_ebitda * Math.pow(1 + d.adr_growth_pct, 5)) / (DEFAULT_DISCOUNT_RATE - 0.02);
  const val_dcf = dcfSum + terminal / Math.pow(1 + DEFAULT_DISCOUNT_RATE, 5);

  const fair_value = (val_ebitda_multiple * 0.4) + (val_price_per_key * 0.3) + (val_dcf * 0.3);
  const ask_vs_fair_pct = fair_value > 0 ? (d.asking_price - fair_value) / fair_value : 0;

  // ---- Financement
  const loan_payment_annual = annualLoanPayment(d.debt, d.debt_rate_pct, d.debt_term_years);
  const dscr_year1 = loan_payment_annual > 0 ? current_ebitda / loan_payment_annual : Infinity;
  const ltv = d.asking_price > 0 ? d.debt / d.asking_price : 0;

  // ---- Business plan 5 ans
  const projection: PreAcqProjectionYear[] = [];
  let adr = d.adr;
  let occ = d.occupancy;
  let fb = d.fb_revenue;
  let other = d.other_revenue;
  let staff = d.staff_cost;
  let energy = d.energy_cost;
  let otherOpex = d.other_opex;
  for (let y = 1; y <= 10; y++) {
    adr = adr * (1 + d.adr_growth_pct);
    occ = Math.min(0.95, occ * (1 + d.occupancy_growth_pct));
    fb = fb * (1 + d.adr_growth_pct);
    other = other * (1 + d.adr_growth_pct);
    staff = staff * (1 + d.opex_inflation_pct);
    energy = energy * (1 + d.opex_inflation_pct);
    otherOpex = otherOpex * (1 + d.opex_inflation_pct);

    const yr_rooms = adr * occ * d.nb_rooms * 365;
    const yr_total = yr_rooms + fb + other;
    const yr_opex = staff + energy + otherOpex;
    const yr_gop = yr_total - yr_opex;
    const yr_ffe = yr_total * d.capex_reserve_pct;
    const yr_ebitda = yr_gop - d.taxe_fonciere - yr_ffe;
    const yr_dscr = loan_payment_annual > 0 ? yr_ebitda / loan_payment_annual : Infinity;
    const yr_cf = yr_ebitda - loan_payment_annual;

    projection.push({
      year: y,
      rooms_revenue: yr_rooms,
      fb_revenue: fb,
      other_revenue: other,
      total_revenue: yr_total,
      gop: yr_gop,
      gop_margin: yr_total > 0 ? yr_gop / yr_total : 0,
      ebitda: yr_ebitda,
      ebitda_margin: yr_total > 0 ? yr_ebitda / yr_total : 0,
      debt_service: loan_payment_annual,
      dscr: yr_dscr,
      cash_flow_to_equity: yr_cf,
    });
  }

  // ---- Exit
  const exitYear = d.exit_year;
  const exit_ebitda = projection[exitYear - 1].ebitda;
  const exit_value = d.exit_cap_rate > 0 ? exit_ebitda / d.exit_cap_rate : 0;
  const debt_balance_at_exit = remainingDebt(d.debt, d.debt_rate_pct, d.debt_term_years, exitYear);
  const equity_return = exit_value - debt_balance_at_exit;

  // Cashflows equity pour IRR : -equity + CFs annuels + equity_return en dernière année
  const cashflows: number[] = [-(d.equity + d.capex_entry)];
  for (let y = 1; y <= exitYear; y++) {
    let cf = projection[y - 1].cash_flow_to_equity;
    if (y === exitYear) cf += equity_return;
    cashflows.push(cf);
  }
  const irr_equity = irr(cashflows);
  const equity_multiple = d.equity > 0
    ? (cashflows.slice(1).reduce((s, c) => s + c, 0) + d.equity) / d.equity
    : 0;

  // ---- Score go/no-go
  const signals: PreAcqResult["signals"] = [];
  let score = 50;

  // 1. Prix vs fair value
  if (ask_vs_fair_pct <= -0.05) {
    score += 15; signals.push({ label: "Prix demandé", status: "ok", detail: `${(ask_vs_fair_pct * 100).toFixed(1)}% sous fair value` });
  } else if (ask_vs_fair_pct <= 0.10) {
    score += 5; signals.push({ label: "Prix demandé", status: "warn", detail: `${(ask_vs_fair_pct * 100).toFixed(1)}% vs fair value` });
  } else {
    score -= 15; signals.push({ label: "Prix demandé", status: "bad", detail: `${(ask_vs_fair_pct * 100).toFixed(1)}% au-dessus — surpayé` });
  }

  // 2. DSCR
  if (dscr_year1 >= 1.35) {
    score += 15; signals.push({ label: "DSCR année 1", status: "ok", detail: `${dscr_year1.toFixed(2)}x` });
  } else if (dscr_year1 >= 1.15) {
    score += 5; signals.push({ label: "DSCR année 1", status: "warn", detail: `${dscr_year1.toFixed(2)}x — covenant limite` });
  } else {
    score -= 20; signals.push({ label: "DSCR année 1", status: "bad", detail: `${dscr_year1.toFixed(2)}x — banque refuse` });
  }

  // 3. LTV
  if (ltv <= 0.60) {
    score += 5; signals.push({ label: "LTV", status: "ok", detail: `${(ltv * 100).toFixed(0)}%` });
  } else if (ltv <= 0.75) {
    signals.push({ label: "LTV", status: "warn", detail: `${(ltv * 100).toFixed(0)}% — classique` });
  } else {
    score -= 10; signals.push({ label: "LTV", status: "bad", detail: `${(ltv * 100).toFixed(0)}% — endettement élevé` });
  }

  // 4. EBITDA margin
  if (current_ebitda_margin >= 0.25) {
    score += 10; signals.push({ label: "Marge EBITDA", status: "ok", detail: `${(current_ebitda_margin * 100).toFixed(1)}%` });
  } else if (current_ebitda_margin >= 0.15) {
    signals.push({ label: "Marge EBITDA", status: "warn", detail: `${(current_ebitda_margin * 100).toFixed(1)}% — upside possible` });
  } else {
    score -= 10; signals.push({ label: "Marge EBITDA", status: "bad", detail: `${(current_ebitda_margin * 100).toFixed(1)}% — exploitation dégradée` });
  }

  // 5. IRR equity
  if (irr_equity >= 0.15) {
    score += 15; signals.push({ label: "TRI equity", status: "ok", detail: `${(irr_equity * 100).toFixed(1)}%` });
  } else if (irr_equity >= 0.08) {
    signals.push({ label: "TRI equity", status: "warn", detail: `${(irr_equity * 100).toFixed(1)}% — rendement moyen` });
  } else {
    score -= 15; signals.push({ label: "TRI equity", status: "bad", detail: `${(irr_equity * 100).toFixed(1)}% — insuffisant` });
  }

  score = Math.max(0, Math.min(100, score));

  return {
    current_revpar,
    current_total_revenue,
    current_gop,
    current_gop_margin,
    current_ebitda,
    current_ebitda_margin,
    val_ebitda_multiple,
    val_price_per_key,
    val_dcf,
    fair_value,
    ask_vs_fair_pct,
    loan_payment_annual,
    dscr_year1,
    ltv,
    projection,
    exit_ebitda,
    exit_value,
    debt_balance_at_exit,
    equity_return,
    equity_multiple,
    irr_equity,
    score,
    signals,
  };
}

export function defaultDeal(): PreAcqDeal {
  return {
    name: "Hôtel exemple",
    commune: "Luxembourg",
    category: "midscale",
    nb_rooms: 60,
    asking_price: 12_000_000,
    adr: 135,
    occupancy: 0.68,
    fb_revenue: 800_000,
    other_revenue: 100_000,
    staff_cost: 1_100_000,
    energy_cost: 220_000,
    other_opex: 720_000,
    taxe_fonciere: 35_000,
    adr_growth_pct: 0.025,
    occupancy_growth_pct: 0.005,
    opex_inflation_pct: 0.03,
    equity: 4_000_000,
    debt: 8_000_000,
    debt_rate_pct: 0.045,
    debt_term_years: 20,
    capex_entry: 500_000,
    capex_reserve_pct: 0.04,
    exit_year: 7,
    exit_cap_rate: 0.075,
  };
}
