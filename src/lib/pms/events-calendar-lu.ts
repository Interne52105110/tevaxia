// ============================================================
// PMS — Calendrier événements LU majeurs (impact pickup hôtel)
// ============================================================
//
// Liste des événements récurrents au Luxembourg qui impactent la
// demande hôtelière (pickup + prix). Utilisé par le forecast pour
// annoter le graphique et alerter sur périodes high-demand.
//
// Sources :
//   - Calendrier officiel LCTO (Luxembourg City Tourist Office)
//   - Luxexpo The Box (Foire de Luxembourg, Bouneweger Mess, LuxAuto)
//   - ICC Congrès, ECCL European Conference Centre
//   - Kirchberg centre-congrès
//
// Pour chaque événement : dates (ou pattern récurrent) + impact attendu
// (low / medium / high / extreme) + zones LU concernées.

export type EventImpact = "low" | "medium" | "high" | "extreme";

export interface LuEvent {
  id: string;
  name: string;
  description: string;
  category: "foire" | "conference" | "culture" | "sport" | "saison" | "bank_holiday";
  start_month: number; // 1-12
  start_day: number;   // ~day, approx pour événements à date variable
  duration_days: number;
  impact: EventImpact;
  affected_communes: string[]; // liste ISO commune LU
  notes?: string;
}

/**
 * Calendrier des événements LU majeurs 2026 (base récurrente).
 * Pour une année donnée, on reprojette les dates sur cette année.
 */
export const LU_EVENTS: LuEvent[] = [
  {
    id: "foire_printemps",
    name: "Foire de Printemps",
    description: "Salon grand public Luxexpo — déco, jardinage, maison.",
    category: "foire",
    start_month: 5, start_day: 5, duration_days: 9,
    impact: "high",
    affected_communes: ["Luxembourg", "Kirchberg"],
  },
  {
    id: "foire_automne",
    name: "Foire d'Automne",
    description: "Grande foire commerciale annuelle 1 semaine — pickup fort.",
    category: "foire",
    start_month: 10, start_day: 15, duration_days: 10,
    impact: "extreme",
    affected_communes: ["Luxembourg", "Kirchberg"],
    notes: "Événement majeur : taux d'occupation Luxembourg-Ville > 95% la semaine entière.",
  },
  {
    id: "bouneweger_mess",
    name: "Bouneweger Mess",
    description: "Fête foraine traditionnelle quartier Bonnevoie.",
    category: "foire",
    start_month: 9, start_day: 1, duration_days: 10,
    impact: "medium",
    affected_communes: ["Luxembourg"],
  },
  {
    id: "schueberfouer",
    name: "Schueberfouer",
    description: "Plus grande fête foraine LU — 3 semaines Champ du Glacis.",
    category: "culture",
    start_month: 8, start_day: 24, duration_days: 21,
    impact: "extreme",
    affected_communes: ["Luxembourg"],
    notes: "Fréquentation annuelle > 2 millions visiteurs. Hôtels pleins week-ends.",
  },
  {
    id: "festival_migration",
    name: "Festival des Migrations",
    description: "Festival culture et diversité Luxexpo.",
    category: "culture",
    start_month: 2, start_day: 28, duration_days: 3,
    impact: "medium",
    affected_communes: ["Luxembourg"],
  },
  {
    id: "luxautofestival",
    name: "LuxAuto Festival",
    description: "Salon auto annuel Luxexpo — pickup business + loisirs.",
    category: "foire",
    start_month: 1, start_day: 27, duration_days: 10,
    impact: "high",
    affected_communes: ["Luxembourg", "Kirchberg"],
  },
  {
    id: "conference_blockchain",
    name: "Luxembourg Blockchain Week",
    description: "Série conférences fintech/blockchain (ICC + Kirchberg).",
    category: "conference",
    start_month: 3, start_day: 15, duration_days: 5,
    impact: "high",
    affected_communes: ["Luxembourg", "Kirchberg"],
    notes: "Public corporate international — pricing +30% conseillé.",
  },
  {
    id: "conference_fonds",
    name: "Alfi European Asset Management Conference",
    description: "Sommet européen gestion de fonds (Luxembourg capital mondiale des fonds).",
    category: "conference",
    start_month: 3, start_day: 18, duration_days: 3,
    impact: "extreme",
    affected_communes: ["Luxembourg", "Kirchberg"],
    notes: "Event corporate majeur : hôtels 4-5* complets 2 mois avant.",
  },
  {
    id: "fete_nationale",
    name: "Fête Nationale",
    description: "Fête du Grand-Duc, cortège, feux d'artifice.",
    category: "bank_holiday",
    start_month: 6, start_day: 23, duration_days: 1,
    impact: "medium",
    affected_communes: ["Luxembourg", "Kirchberg", "Esch-sur-Alzette"],
    notes: "Vigile 22/6 soir : tourisme domestique + frontalier BE/FR/DE.",
  },
  {
    id: "marche_noel",
    name: "Winterlights / Marchés de Noël",
    description: "6 marchés de Noël Luxembourg-Ville + patinoire + animations.",
    category: "saison",
    start_month: 11, start_day: 20, duration_days: 40,
    impact: "high",
    affected_communes: ["Luxembourg", "Kirchberg"],
    notes: "Week-ends de décembre saturés. Nouvel An : minimum séjour 2 nuits recommandé.",
  },
  {
    id: "riesling_open",
    name: "Riesling Open Moselle",
    description: "Festival vin Moselle luxembourgeoise.",
    category: "culture",
    start_month: 9, start_day: 12, duration_days: 3,
    impact: "medium",
    affected_communes: ["Remich", "Wormeldange", "Grevenmacher", "Schengen"],
  },
  {
    id: "salon_immobilier",
    name: "Salon de l'Immobilier (Home Expo)",
    description: "Plus grand salon immo LU Luxexpo — 3 jours.",
    category: "foire",
    start_month: 10, start_day: 8, duration_days: 3,
    impact: "medium",
    affected_communes: ["Luxembourg", "Kirchberg"],
  },
  {
    id: "formula_one_belgium",
    name: "Formula 1 Spa-Francorchamps",
    description: "Grand Prix de Belgique (proche LU, hôtels frontaliers pleins).",
    category: "sport",
    start_month: 8, start_day: 28, duration_days: 3,
    impact: "high",
    affected_communes: ["Luxembourg", "Clervaux", "Wiltz", "Vianden"],
    notes: "Public venant de loin, séjour Luxembourg si Spa est complet.",
  },
  {
    id: "eu_summit",
    name: "Conseil européen (LU présidence)",
    description: "Sommets UE ponctuels Kirchberg — VIP + corporate + presse.",
    category: "conference",
    start_month: 6, start_day: 10, duration_days: 2,
    impact: "extreme",
    affected_communes: ["Luxembourg", "Kirchberg"],
    notes: "Dates variables selon calendrier UE — vérifier consilium.europa.eu.",
  },
  {
    id: "pentecote",
    name: "Pentecôte + Octave",
    description: "Pèlerinage Notre-Dame LU — 15 jours Octave.",
    category: "saison",
    start_month: 4, start_day: 20, duration_days: 14,
    impact: "medium",
    affected_communes: ["Luxembourg"],
  },
];

// ============================================================
// Helpers
// ============================================================

/**
 * Pour un intervalle de dates donné, retourne les événements LU qui
 * s'intersectent + boost multiplicateur conseillé pour le pickup.
 */
export function getEventsInRange(fromDate: string, toDate: string, year?: number): Array<LuEvent & {
  start_date: string; end_date: string; days_into_range: number;
}> {
  const y = year ?? new Date(fromDate).getFullYear();
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const results: Array<LuEvent & { start_date: string; end_date: string; days_into_range: number }> = [];

  for (const ev of LU_EVENTS) {
    const start = new Date(y, ev.start_month - 1, ev.start_day);
    const end = new Date(start.getTime() + ev.duration_days * 86400000);
    // intersect ?
    if (end < from || start > to) continue;
    const overlapStart = start > from ? start : from;
    const overlapEnd = end < to ? end : to;
    const days_into_range = Math.max(0, Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 86400000));
    results.push({
      ...ev,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      days_into_range,
    });
  }
  return results.sort((a, b) => a.start_date.localeCompare(b.start_date));
}

/**
 * Multiplicateur de pickup attendu selon l'impact de l'événement.
 * À appliquer sur le pickup_rate_per_day base.
 */
export function impactMultiplier(impact: EventImpact): number {
  switch (impact) {
    case "extreme": return 3.0;
    case "high": return 2.0;
    case "medium": return 1.4;
    case "low": return 1.1;
  }
}

export const IMPACT_LABELS: Record<EventImpact, string> = {
  low: "Impact faible",
  medium: "Impact moyen",
  high: "Impact fort",
  extreme: "Impact extrême",
};

export const IMPACT_COLORS: Record<EventImpact, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-900",
  high: "bg-amber-100 text-amber-900",
  extreme: "bg-rose-100 text-rose-900",
};
