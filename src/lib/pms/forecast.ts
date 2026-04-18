// ============================================================
// PMS — Revenue Forecast (projection OTB + pickup historique)
// ============================================================
//
// Prévision de revenus hôteliers sur horizon glissant, combinant :
//   1. On The Books (OTB) : réservations déjà enregistrées pour la
//      période future (source : pms_reservations).
//   2. Pickup attendu : extrapolation du pickup des N derniers jours
//      appliqué à la même fenêtre dans le futur.
//
// Méthode standard Revenue Management "same time last year" adapté
// sans historique YoY (utilise pickup récent comme proxy).

import { supabase, isSupabaseConfigured } from "../supabase";

export interface ForecastDay {
  date: string;
  otb_rooms: number;        // réservations déjà encaissées
  otb_revenue: number;
  expected_pickup_rooms: number; // pickup attendu entre aujourd'hui et cette date
  expected_pickup_revenue: number;
  forecast_rooms: number;   // OTB + pickup
  forecast_revenue: number;
  capacity: number;         // chambres totales
  forecast_occupancy: number; // %
}

export interface ForecastSummary {
  property_id: string;
  property_name: string;
  horizon_days: number;
  period_start: string;
  period_end: string;
  total_capacity: number;
  total_otb_rooms: number;
  total_otb_revenue: number;
  total_expected_pickup_rooms: number;
  total_expected_pickup_revenue: number;
  total_forecast_rooms: number;
  total_forecast_revenue: number;
  avg_forecast_occupancy: number;
  avg_forecast_adr: number;
  days: ForecastDay[];
  pickup_rate_per_day: number; // chambres picked-up par jour en moyenne
  methodology: string;
}

export async function buildRevenueForecast(
  propertyId: string,
  horizonDays = 30,
): Promise<ForecastSummary | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const today = new Date();
  const endDate = new Date(today.getTime() + horizonDays * 86400000);
  const todayStr = today.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  const { data: propData } = await supabase
    .from("pms_properties")
    .select("id, name")
    .eq("id", propertyId)
    .maybeSingle();
  if (!propData) return null;

  // Capacité : total chambres actives
  const { data: rooms } = await supabase
    .from("pms_rooms")
    .select("id")
    .eq("property_id", propertyId)
    .eq("active", true);
  const total_capacity = rooms?.length ?? 0;

  // OTB : réservations déjà enregistrées pour cet horizon
  const { data: resOTB } = await supabase
    .from("pms_reservations")
    .select("check_in, check_out, total_amount, nb_nights")
    .eq("property_id", propertyId)
    .in("status", ["confirmed", "checked_in"])
    .gte("check_out", todayStr)
    .lte("check_in", endStr);

  type Res = { check_in: string; check_out: string; total_amount: number; nb_nights: number };
  const otbRes = (resOTB ?? []) as Res[];

  // Pickup historique : réservations créées dans les 30 derniers jours
  const lookbackStart = new Date(today.getTime() - 30 * 86400000).toISOString();
  const { data: pickupData } = await supabase
    .from("pms_reservations")
    .select("id, total_amount, nb_nights")
    .eq("property_id", propertyId)
    .in("status", ["confirmed", "checked_in", "checked_out"])
    .gte("created_at", lookbackStart);
  type PickupRes = { id: string; total_amount: number; nb_nights: number };
  const pickupRes = (pickupData ?? []) as PickupRes[];
  const pickup_total_rooms = pickupRes.reduce((s, r) => s + Number(r.nb_nights), 0);
  const pickup_total_revenue = pickupRes.reduce((s, r) => s + Number(r.total_amount), 0);
  const pickup_rate_per_day = pickup_total_rooms / 30;
  const pickup_revenue_per_room = pickup_total_rooms > 0 ? pickup_total_revenue / pickup_total_rooms : 0;

  // Jours de l'horizon
  const days: ForecastDay[] = [];
  let running = new Date(today);
  for (let i = 0; i < horizonDays; i++) {
    const dateStr = running.toISOString().slice(0, 10);
    // OTB pour ce jour : résas dont check_in ≤ date < check_out
    let otb_rooms = 0;
    let otb_revenue = 0;
    for (const r of otbRes) {
      if (dateStr >= r.check_in && dateStr < r.check_out) {
        otb_rooms += 1;
        otb_revenue += Number(r.total_amount) / Math.max(1, Number(r.nb_nights));
      }
    }
    // Pickup attendu jusqu'à cette date : pickup_rate × jours restants avant séjour
    const daysUntilStay = Math.floor((new Date(dateStr).getTime() - today.getTime()) / 86400000);
    // Rough estimate: pickup proportionnel aux jours disponibles, capped at capacity
    const pickup_potential = Math.min(
      pickup_rate_per_day * daysUntilStay,
      Math.max(0, total_capacity - otb_rooms),
    );
    const expected_pickup_rooms = Math.max(0, Math.round(pickup_potential * 0.4)); // conservatif 40%
    const expected_pickup_revenue = expected_pickup_rooms * pickup_revenue_per_room;

    const forecast_rooms = Math.min(total_capacity, otb_rooms + expected_pickup_rooms);
    const forecast_revenue = otb_revenue + expected_pickup_revenue;
    const forecast_occupancy = total_capacity > 0 ? (forecast_rooms / total_capacity) * 100 : 0;

    days.push({
      date: dateStr,
      otb_rooms, otb_revenue: Math.round(otb_revenue * 100) / 100,
      expected_pickup_rooms,
      expected_pickup_revenue: Math.round(expected_pickup_revenue * 100) / 100,
      forecast_rooms,
      forecast_revenue: Math.round(forecast_revenue * 100) / 100,
      capacity: total_capacity,
      forecast_occupancy: Math.round(forecast_occupancy * 100) / 100,
    });

    running = new Date(running.getTime() + 86400000);
  }

  const total_otb_rooms = days.reduce((s, d) => s + d.otb_rooms, 0);
  const total_otb_revenue = days.reduce((s, d) => s + d.otb_revenue, 0);
  const total_expected_pickup_rooms = days.reduce((s, d) => s + d.expected_pickup_rooms, 0);
  const total_expected_pickup_revenue = days.reduce((s, d) => s + d.expected_pickup_revenue, 0);
  const total_forecast_rooms = total_otb_rooms + total_expected_pickup_rooms;
  const total_forecast_revenue = total_otb_revenue + total_expected_pickup_revenue;
  const avg_forecast_occupancy = total_capacity > 0
    ? Math.round((total_forecast_rooms / (total_capacity * horizonDays)) * 10000) / 100
    : 0;
  const avg_forecast_adr = total_forecast_rooms > 0
    ? Math.round((total_forecast_revenue / total_forecast_rooms) * 100) / 100
    : 0;

  return {
    property_id: propertyId,
    property_name: propData.name,
    horizon_days: horizonDays,
    period_start: todayStr,
    period_end: endStr,
    total_capacity,
    total_otb_rooms, total_otb_revenue: Math.round(total_otb_revenue * 100) / 100,
    total_expected_pickup_rooms,
    total_expected_pickup_revenue: Math.round(total_expected_pickup_revenue * 100) / 100,
    total_forecast_rooms,
    total_forecast_revenue: Math.round(total_forecast_revenue * 100) / 100,
    avg_forecast_occupancy, avg_forecast_adr,
    days,
    pickup_rate_per_day: Math.round(pickup_rate_per_day * 100) / 100,
    methodology: "OTB + pickup conservatif 40% × pickup_rate 30 derniers jours",
  };
}

// ============================================================
// Pure helpers
// ============================================================

export function pickupRatePerDay(totalRoomNights: number, windowDays: number): number {
  if (windowDays <= 0) return 0;
  return Math.round((totalRoomNights / windowDays) * 100) / 100;
}

export function projectOccupancy(otbRooms: number, expectedPickup: number, capacity: number): number {
  if (capacity <= 0) return 0;
  const forecast = Math.min(capacity, otbRooms + expectedPickup);
  return Math.round((forecast / capacity) * 10000) / 100;
}

/**
 * Un alerte est déclenchée si occupancy forecast est sous un seuil.
 * Standard : < 50% à J-14, < 65% à J-7, < 80% à J-2.
 */
export function forecastAlert(forecastOccupancy: number, daysUntilStay: number): {
  level: "ok" | "warning" | "critical";
  message: string;
} {
  if (daysUntilStay <= 2 && forecastOccupancy < 80) {
    return { level: "critical", message: "Occupation faible J-2 — baisse de prix ou marketing last-minute recommandé." };
  }
  if (daysUntilStay <= 7 && forecastOccupancy < 65) {
    return { level: "warning", message: "Occupation projetée basse J-7 — réviser tarifs ou ouvrir rate plan discount." };
  }
  if (daysUntilStay <= 14 && forecastOccupancy < 50) {
    return { level: "warning", message: "Occupation < 50% à J-14 — canaux OTA à réactiver." };
  }
  return { level: "ok", message: "Occupation projetée dans la norme." };
}
