/** Declarative preparation questionnaire. No performance score, CPE, cost or grant is inferred. */
export interface Question {
  id: string;
  category: "enveloppe" | "chauffage" | "ventilation" | "eau" | "usage";
  labelKey: string;
  options: { valueKey: string }[];
}

export const AUDIT_QUESTIONS: Question[] = [
  // ── ENVELOPPE (toiture, façade, sol, fenêtres) ──
  { id: "construction_year", category: "enveloppe", labelKey: "q_construction_year", options: [
    { valueKey: "y_pre1960" },
    { valueKey: "y_1960_1980" },
    { valueKey: "y_1980_2000" },
    { valueKey: "y_2000_2015" },
    { valueKey: "y_post2015" },
  ]},
  { id: "toiture_isolation", category: "enveloppe", labelKey: "q_toiture", options: [
    { valueKey: "iso_none" },
    { valueKey: "iso_old" },
    { valueKey: "iso_recent" },
    { valueKey: "iso_premium" },
  ]},
  { id: "facade_isolation", category: "enveloppe", labelKey: "q_facade", options: [
    { valueKey: "iso_none" },
    { valueKey: "iso_old" },
    { valueKey: "iso_recent" },
    { valueKey: "iso_premium" },
  ]},
  { id: "fenetres", category: "enveloppe", labelKey: "q_fenetres", options: [
    { valueKey: "fen_simple" },
    { valueKey: "fen_double_old" },
    { valueKey: "fen_double_recent" },
    { valueKey: "fen_triple" },
  ]},
  { id: "sol_isolation", category: "enveloppe", labelKey: "q_sol", options: [
    { valueKey: "iso_none" },
    { valueKey: "iso_partial" },
    { valueKey: "iso_complete" },
  ]},

  // ── CHAUFFAGE ──
  { id: "chauffage_type", category: "chauffage", labelKey: "q_chauffage_type", options: [
    { valueKey: "ch_fuel" },
    { valueKey: "ch_gaz" },
    { valueKey: "ch_elec" },
    { valueKey: "ch_pellets" },
    { valueKey: "ch_pac_air" },
    { valueKey: "ch_pac_geo" },
    { valueKey: "ch_reseau_bois" },
  ]},
  { id: "chauffage_age", category: "chauffage", labelKey: "q_chauffage_age", options: [
    { valueKey: "age_25p" },
    { valueKey: "age_15_25" },
    { valueKey: "age_5_15" },
    { valueKey: "age_lt5" },
  ]},
  { id: "chauffage_regulation", category: "chauffage", labelKey: "q_chauffage_reg", options: [
    { valueKey: "reg_none" },
    { valueKey: "reg_thermo" },
    { valueKey: "reg_smart" },
  ]},

  // ── VENTILATION ──
  { id: "ventilation", category: "ventilation", labelKey: "q_ventilation", options: [
    { valueKey: "vent_none" },
    { valueKey: "vent_simple" },
    { valueKey: "vent_vmc_double" },
  ]},
  { id: "humidite", category: "ventilation", labelKey: "q_humidite", options: [
    { valueKey: "hum_yes" },
    { valueKey: "hum_no" },
  ]},

  // ── EAU CHAUDE ──
  { id: "ecs_type", category: "eau", labelKey: "q_ecs", options: [
    { valueKey: "ecs_boiler_elec" },
    { valueKey: "ecs_boiler_gaz" },
    { valueKey: "ecs_solaire" },
    { valueKey: "ecs_thermo" },
  ]},
  { id: "ecs_age", category: "eau", labelKey: "q_ecs_age", options: [
    { valueKey: "age_20p" },
    { valueKey: "age_10_20" },
    { valueKey: "age_lt10" },
  ]},

  // ── USAGE ──
  { id: "surface", category: "usage", labelKey: "q_surface", options: [
    { valueKey: "s_lt80" },
    { valueKey: "s_80_120" },
    { valueKey: "s_120_180" },
    { valueKey: "s_180p" },
  ]},
  { id: "occupants", category: "usage", labelKey: "q_occupants", options: [
    { valueKey: "occ_1" },
    { valueKey: "occ_2_3" },
    { valueKey: "occ_4p" },
  ]},
  { id: "presence_jour", category: "usage", labelKey: "q_presence", options: [
    { valueKey: "pres_no" },
    { valueKey: "pres_part" },
    { valueKey: "pres_full" },
  ]},
  { id: "pv_solaire", category: "enveloppe", labelKey: "q_pv", options: [
    { valueKey: "pv_none" },
    { valueKey: "pv_lt6kwp" },
    { valueKey: "pv_gt6kwp" },
  ]},
  { id: "orientation", category: "enveloppe", labelKey: "q_orientation", options: [
    { valueKey: "ori_nord" },
    { valueKey: "ori_est_ouest" },
    { valueKey: "ori_sud" },
  ]},
  { id: "chauffage_bill", category: "chauffage", labelKey: "q_bill", options: [
    { valueKey: "bill_lt1500" },
    { valueKey: "bill_1500_3000" },
    { valueKey: "bill_3000_5000" },
    { valueKey: "bill_gt5000" },
  ]},
  { id: "renov_plan", category: "usage", labelKey: "q_renov_plan", options: [
    { valueKey: "plan_none" },
    { valueKey: "plan_lt2y" },
    { valueKey: "plan_now" },
  ]},
  { id: "budget", category: "usage", labelKey: "q_budget", options: [
    { valueKey: "b_lt20k" },
    { valueKey: "b_20_50k" },
    { valueKey: "b_50_100k" },
    { valueKey: "b_gt100k" },
  ]},
];


export function summarizeAuditAnswers(answers:Record<string,string>){
 for(const [id,value] of Object.entries(answers)){
  const q=AUDIT_QUESTIONS.find(q=>q.id===id);
  if(!q||(value!=='unknown'&&!q.options.some(o=>o.valueKey===value)))throw new RangeError('Invalid questionnaire answer');
 }
 const answered=AUDIT_QUESTIONS.filter(q=>answers[q.id]!==undefined);
 const unknown=answered.filter(q=>answers[q.id]==='unknown');
 return {answered:answered.length,documented:answered.length-unknown.length,unknown:unknown.length,complete:answered.length===AUDIT_QUESTIONS.length,
 rows:AUDIT_QUESTIONS.map(q=>({id:q.id,category:q.category,labelKey:q.labelKey,valueKey:answers[q.id]??'unanswered'}))};
}
