/**
 * Audit énergétique guidé Luxembourg — questionnaire 20 questions.
 *
 * Ne remplace pas un audit myenergy CPE officiel mais permet à un
 * propriétaire de :
 * - Diagnostiquer rapidement l'état énergétique de son bien
 * - Identifier les postes prioritaires (coût/bénéfice)
 * - Estimer un ordre de grandeur Klimabonus (règlement grand-ducal
 *   07/07/2022 modifié 01/01/2025 — subventions jusqu'à 75 %)
 */

export interface Question {
  id: string;
  category: "enveloppe" | "chauffage" | "ventilation" | "eau" | "usage";
  labelKey: string;
  options: { valueKey: string; score: number }[];
}

export const AUDIT_QUESTIONS: Question[] = [
  // ── ENVELOPPE (toiture, façade, sol, fenêtres) ──
  { id: "construction_year", category: "enveloppe", labelKey: "q_construction_year", options: [
    { valueKey: "y_pre1960", score: 0 },
    { valueKey: "y_1960_1980", score: 2 },
    { valueKey: "y_1980_2000", score: 5 },
    { valueKey: "y_2000_2015", score: 8 },
    { valueKey: "y_post2015", score: 10 },
  ]},
  { id: "toiture_isolation", category: "enveloppe", labelKey: "q_toiture", options: [
    { valueKey: "iso_none", score: 0 },
    { valueKey: "iso_old", score: 3 },
    { valueKey: "iso_recent", score: 8 },
    { valueKey: "iso_premium", score: 10 },
  ]},
  { id: "facade_isolation", category: "enveloppe", labelKey: "q_facade", options: [
    { valueKey: "iso_none", score: 0 },
    { valueKey: "iso_old", score: 3 },
    { valueKey: "iso_recent", score: 8 },
    { valueKey: "iso_premium", score: 10 },
  ]},
  { id: "fenetres", category: "enveloppe", labelKey: "q_fenetres", options: [
    { valueKey: "fen_simple", score: 0 },
    { valueKey: "fen_double_old", score: 3 },
    { valueKey: "fen_double_recent", score: 7 },
    { valueKey: "fen_triple", score: 10 },
  ]},
  { id: "sol_isolation", category: "enveloppe", labelKey: "q_sol", options: [
    { valueKey: "iso_none", score: 0 },
    { valueKey: "iso_partial", score: 5 },
    { valueKey: "iso_complete", score: 10 },
  ]},

  // ── CHAUFFAGE ──
  { id: "chauffage_type", category: "chauffage", labelKey: "q_chauffage_type", options: [
    { valueKey: "ch_fuel", score: 0 },
    { valueKey: "ch_gaz", score: 3 },
    { valueKey: "ch_elec", score: 2 },
    { valueKey: "ch_pellets", score: 8 },
    { valueKey: "ch_pac_air", score: 8 },
    { valueKey: "ch_pac_geo", score: 10 },
    { valueKey: "ch_reseau_bois", score: 9 },
  ]},
  { id: "chauffage_age", category: "chauffage", labelKey: "q_chauffage_age", options: [
    { valueKey: "age_25p", score: 0 },
    { valueKey: "age_15_25", score: 3 },
    { valueKey: "age_5_15", score: 7 },
    { valueKey: "age_lt5", score: 10 },
  ]},
  { id: "chauffage_regulation", category: "chauffage", labelKey: "q_chauffage_reg", options: [
    { valueKey: "reg_none", score: 0 },
    { valueKey: "reg_thermo", score: 5 },
    { valueKey: "reg_smart", score: 10 },
  ]},

  // ── VENTILATION ──
  { id: "ventilation", category: "ventilation", labelKey: "q_ventilation", options: [
    { valueKey: "vent_none", score: 2 },
    { valueKey: "vent_simple", score: 5 },
    { valueKey: "vent_vmc_double", score: 10 },
  ]},
  { id: "humidite", category: "ventilation", labelKey: "q_humidite", options: [
    { valueKey: "hum_yes", score: 0 },
    { valueKey: "hum_no", score: 10 },
  ]},

  // ── EAU CHAUDE ──
  { id: "ecs_type", category: "eau", labelKey: "q_ecs", options: [
    { valueKey: "ecs_boiler_elec", score: 2 },
    { valueKey: "ecs_boiler_gaz", score: 4 },
    { valueKey: "ecs_solaire", score: 9 },
    { valueKey: "ecs_thermo", score: 10 },
  ]},
  { id: "ecs_age", category: "eau", labelKey: "q_ecs_age", options: [
    { valueKey: "age_20p", score: 0 },
    { valueKey: "age_10_20", score: 5 },
    { valueKey: "age_lt10", score: 10 },
  ]},

  // ── USAGE ──
  { id: "surface", category: "usage", labelKey: "q_surface", options: [
    { valueKey: "s_lt80", score: 10 },
    { valueKey: "s_80_120", score: 8 },
    { valueKey: "s_120_180", score: 5 },
    { valueKey: "s_180p", score: 3 },
  ]},
  { id: "occupants", category: "usage", labelKey: "q_occupants", options: [
    { valueKey: "occ_1", score: 5 },
    { valueKey: "occ_2_3", score: 8 },
    { valueKey: "occ_4p", score: 10 },
  ]},
  { id: "presence_jour", category: "usage", labelKey: "q_presence", options: [
    { valueKey: "pres_no", score: 3 },
    { valueKey: "pres_part", score: 6 },
    { valueKey: "pres_full", score: 10 },
  ]},
  { id: "pv_solaire", category: "enveloppe", labelKey: "q_pv", options: [
    { valueKey: "pv_none", score: 0 },
    { valueKey: "pv_lt6kwp", score: 5 },
    { valueKey: "pv_gt6kwp", score: 10 },
  ]},
  { id: "orientation", category: "enveloppe", labelKey: "q_orientation", options: [
    { valueKey: "ori_nord", score: 3 },
    { valueKey: "ori_est_ouest", score: 6 },
    { valueKey: "ori_sud", score: 10 },
  ]},
  { id: "chauffage_bill", category: "chauffage", labelKey: "q_bill", options: [
    { valueKey: "bill_lt1500", score: 10 },
    { valueKey: "bill_1500_3000", score: 7 },
    { valueKey: "bill_3000_5000", score: 4 },
    { valueKey: "bill_gt5000", score: 0 },
  ]},
  { id: "renov_plan", category: "usage", labelKey: "q_renov_plan", options: [
    { valueKey: "plan_none", score: 5 },
    { valueKey: "plan_lt2y", score: 9 },
    { valueKey: "plan_now", score: 10 },
  ]},
  { id: "budget", category: "usage", labelKey: "q_budget", options: [
    { valueKey: "b_lt20k", score: 3 },
    { valueKey: "b_20_50k", score: 6 },
    { valueKey: "b_50_100k", score: 9 },
    { valueKey: "b_gt100k", score: 10 },
  ]},
];

export interface AuditRecommendation {
  priority: 1 | 2 | 3;
  category: Question["category"];
  titleKey: string;
  descKey: string;
  coutMin: number;
  coutMax: number;
  klimabonusPct: number;
  gainEnergetiquePct: number; // Gain conso énergétique estimé
}

export interface AuditResult {
  scoreGlobal: number; // 0-100
  scoreCategory: Record<Question["category"], number>;
  classeEstimee: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  recommendations: AuditRecommendation[];
  coutTotal: { min: number; max: number };
  klimabonusTotal: { min: number; max: number };
  gainEnergetiqueTotal: number;
}

export function calculerAudit(answers: Record<string, string>): AuditResult {
  const byCategory: Record<Question["category"], { sum: number; count: number }> = {
    enveloppe: { sum: 0, count: 0 },
    chauffage: { sum: 0, count: 0 },
    ventilation: { sum: 0, count: 0 },
    eau: { sum: 0, count: 0 },
    usage: { sum: 0, count: 0 },
  };

  let totalSum = 0;
  let totalCount = 0;

  for (const q of AUDIT_QUESTIONS) {
    const answered = answers[q.id];
    if (!answered) continue;
    const opt = q.options.find((o) => o.valueKey === answered);
    if (!opt) continue;
    byCategory[q.category].sum += opt.score;
    byCategory[q.category].count += 1;
    totalSum += opt.score;
    totalCount += 1;
  }

  const scoreCategory = Object.fromEntries(
    Object.entries(byCategory).map(([k, v]) => [k, v.count > 0 ? (v.sum / (v.count * 10)) * 100 : 0]),
  ) as Record<Question["category"], number>;

  const scoreGlobal = totalCount > 0 ? (totalSum / (totalCount * 10)) * 100 : 0;

  // Classe énergie estimée (proxy du score)
  const classeEstimee: AuditResult["classeEstimee"] =
    scoreGlobal >= 85 ? "A" :
    scoreGlobal >= 70 ? "B" :
    scoreGlobal >= 55 ? "C" :
    scoreGlobal >= 40 ? "D" :
    scoreGlobal >= 25 ? "E" :
    scoreGlobal >= 15 ? "F" : "G";

  // Reco priorisées selon scores catégoriels (plus bas = priorité 1)
  const recs: AuditRecommendation[] = [];

  // Enveloppe (toiture, façade, fenêtres, sol)
  if (answers.toiture_isolation === "iso_none" || answers.toiture_isolation === "iso_old") {
    recs.push({
      priority: answers.toiture_isolation === "iso_none" ? 1 : 2,
      category: "enveloppe",
      titleKey: "recToiture",
      descKey: "recToitureDesc",
      coutMin: 12_000, coutMax: 28_000,
      klimabonusPct: 60,
      gainEnergetiquePct: 25,
    });
  }
  if (answers.facade_isolation === "iso_none" || answers.facade_isolation === "iso_old") {
    recs.push({
      priority: 1,
      category: "enveloppe",
      titleKey: "recFacade",
      descKey: "recFacadeDesc",
      coutMin: 25_000, coutMax: 60_000,
      klimabonusPct: 60,
      gainEnergetiquePct: 30,
    });
  }
  if (answers.fenetres === "fen_simple" || answers.fenetres === "fen_double_old") {
    recs.push({
      priority: answers.fenetres === "fen_simple" ? 1 : 2,
      category: "enveloppe",
      titleKey: "recFenetres",
      descKey: "recFenetresDesc",
      coutMin: 8_000, coutMax: 20_000,
      klimabonusPct: 50,
      gainEnergetiquePct: 15,
    });
  }
  if (answers.sol_isolation === "iso_none") {
    recs.push({
      priority: 3,
      category: "enveloppe",
      titleKey: "recSol",
      descKey: "recSolDesc",
      coutMin: 4_000, coutMax: 10_000,
      klimabonusPct: 50,
      gainEnergetiquePct: 8,
    });
  }

  // Chauffage
  if (answers.chauffage_type === "ch_fuel" || answers.chauffage_age === "age_25p" || answers.chauffage_age === "age_15_25") {
    recs.push({
      priority: 1,
      category: "chauffage",
      titleKey: "recChauffage",
      descKey: "recChauffageDesc",
      coutMin: 18_000, coutMax: 40_000,
      klimabonusPct: 70,
      gainEnergetiquePct: 35,
    });
  }

  // Ventilation
  if (answers.ventilation === "vent_none" || answers.ventilation === "vent_simple") {
    recs.push({
      priority: answers.humidite === "hum_yes" ? 1 : 3,
      category: "ventilation",
      titleKey: "recVMC",
      descKey: "recVMCDesc",
      coutMin: 6_000, coutMax: 14_000,
      klimabonusPct: 50,
      gainEnergetiquePct: 10,
    });
  }

  // ECS
  if (answers.ecs_type === "ecs_boiler_elec" || answers.ecs_age === "age_20p") {
    recs.push({
      priority: 2,
      category: "eau",
      titleKey: "recECS",
      descKey: "recECSDesc",
      coutMin: 4_000, coutMax: 9_000,
      klimabonusPct: 50,
      gainEnergetiquePct: 10,
    });
  }

  // PV — opportunité si orientation OK + pas de PV
  if (answers.pv_solaire === "pv_none" && (answers.orientation === "ori_sud" || answers.orientation === "ori_est_ouest")) {
    recs.push({
      priority: 2,
      category: "enveloppe",
      titleKey: "recPV",
      descKey: "recPVDesc",
      coutMin: 8_000, coutMax: 18_000,
      klimabonusPct: 20,
      gainEnergetiquePct: 40, // autoproduction
    });
  }

  // Tri par priorité puis gain énergétique
  recs.sort((a, b) => a.priority - b.priority || b.gainEnergetiquePct - a.gainEnergetiquePct);

  const coutMin = recs.reduce((s, r) => s + r.coutMin, 0);
  const coutMax = recs.reduce((s, r) => s + r.coutMax, 0);
  const kbMin = recs.reduce((s, r) => s + r.coutMin * (r.klimabonusPct / 100), 0);
  const kbMax = recs.reduce((s, r) => s + r.coutMax * (r.klimabonusPct / 100), 0);
  const gainTotal = Math.min(85, recs.reduce((s, r) => s + r.gainEnergetiquePct, 0)); // cap 85 %

  return {
    scoreGlobal,
    scoreCategory,
    classeEstimee,
    recommendations: recs,
    coutTotal: { min: coutMin, max: coutMax },
    klimabonusTotal: { min: Math.round(kbMin), max: Math.round(kbMax) },
    gainEnergetiqueTotal: gainTotal,
  };
}
