import { supabase } from "./supabase";
export const YIELD_TYPES = ["pickup_deviation", "adr_compset_change", "occupancy_drop", "revpar_delta", "gop_margin_below"] as const;
export type YieldType = typeof YIELD_TYPES[number];
export type YieldRule = { id: string; hotel_id: string; user_id: string; alert_type: YieldType; threshold_pct: number; threshold_days: number; is_active: boolean; notify_email: boolean; notify_push: boolean; trigger_count: number; last_triggered_at: string | null };
export type YieldDraft = Pick<YieldRule, "hotel_id" | "alert_type" | "threshold_pct" | "threshold_days" | "is_active"> & { id?: string };
export function validateYieldDraft(d: YieldDraft) {
  if (!d.hotel_id || !YIELD_TYPES.includes(d.alert_type) || typeof d.is_active !== "boolean" || !Number.isInteger(d.threshold_days) || d.threshold_days < 1 || d.threshold_days > 366 || !Number.isFinite(d.threshold_pct) || Math.abs(d.threshold_pct) > 999.99 || Math.abs(d.threshold_pct * 100 - Math.round(d.threshold_pct * 100)) > .00001 || (d.alert_type !== "gop_margin_below" && d.threshold_pct < 0) || (d.alert_type === "occupancy_drop" && d.threshold_pct > 100)) throw new Error("Invalid threshold");
  return d;
}
async function clientFor(userId: string) {
  if (!supabase) throw new Error("Unavailable");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== userId) throw new Error("Authentication changed");
  return supabase;
}
export async function loadYieldRules(userId: string) {
  const client = await clientFor(userId);
  const [hotels, rules] = await Promise.all([
    client.from("hotels").select("id, name").order("name"),
    client.from("hotel_yield_alerts").select("*").eq("user_id", userId).order("created_at"),
  ]);
  if (hotels.error) throw hotels.error;
  if (rules.error) throw rules.error;
  return { hotels: (hotels.data ?? []) as { id: string; name: string }[], rules: (rules.data ?? []) as YieldRule[] };
}
export async function saveYieldRule(userId: string, draft: YieldDraft) {
  validateYieldDraft(draft);
  const client = await clientFor(userId);
  const { data: hotel, error: hotelError } = await client.from("hotels").select("id").eq("id", draft.hotel_id).single();
  if (hotelError || !hotel) throw new Error("Hotel unavailable");
  const { id, ...values } = draft;
  const query = id ? client.from("hotel_yield_alerts").update(values).eq("id", id).eq("user_id", userId).eq("hotel_id", draft.hotel_id)
    : client.from("hotel_yield_alerts").insert({ ...values, user_id: userId, notify_email: false, notify_push: false });
  const { error } = await query.select("id").single();
  if (error) throw error;
}
export async function removeYieldRule(userId: string, id: string, hotelId: string) {
  const client = await clientFor(userId);
  const { error } = await client.from("hotel_yield_alerts").delete().eq("id", id).eq("user_id", userId).eq("hotel_id", hotelId).select("id").single();
  if (error) throw error;
}
