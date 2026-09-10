import { supabase } from "./supabase";
export const notificationKeys = ["notify_market_alerts", "notify_monthly_digest", "notify_security", "notify_product_news"] as const;
export const legacyConsentKeys = ["consent_analytics", "consent_marketing", "consent_third_party"] as const;
const keys = [...notificationKeys, ...legacyConsentKeys] as const;
export type NotificationChoices = Record<(typeof notificationKeys)[number], boolean>;
export type NotificationPreferences = NotificationChoices & Record<(typeof legacyConsentKeys)[number], boolean>;
export interface PreferencesSnapshot { preferences: NotificationPreferences; updatedAt: string | null }
export function defaultNotificationPreferences(): NotificationPreferences {
  return { notify_market_alerts: false, notify_monthly_digest: false, notify_security: true, notify_product_news: false, consent_analytics: false, consent_marketing: false, consent_third_party: false };
}
const columns = ["user_id", ...keys, "updated_at"].join(",");
function parseRow(row: unknown, owner: string): PreferencesSnapshot {
  if (!row || typeof row !== "object") throw new Error("Invalid preferences response");
  const data = row as Record<string, unknown>;
  if (data.user_id !== owner || keys.some(key => typeof data[key] !== "boolean") || typeof data.updated_at !== "string" || !Number.isFinite(Date.parse(data.updated_at))) throw new Error("Invalid preferences response");
  return { preferences: Object.fromEntries(keys.map(key => [key, data[key]])) as NotificationPreferences, updatedAt: data.updated_at };
}
async function currentOwner(owner: string): Promise<string> {
  if (!supabase || !owner) throw new Error("Preferences unavailable");
  const result = await supabase.auth.getSession();
  if (result.error || result.data.session?.user.id !== owner || !result.data.session.access_token) throw new Error("Preferences account changed");
  return result.data.session.access_token;
}
async function verifiedToken(owner: string): Promise<string> {
  const token = await currentOwner(owner);
  const result = await supabase!.auth.getUser(token);
  if (result.error || result.data.user?.id !== owner) throw new Error("Preferences account changed");
  return token;
}
function endpoint(owner: string): URL {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("Preferences unavailable");
  const url = new URL(base + "/rest/v1/user_preferences");
  url.searchParams.set("select", columns); url.searchParams.set("user_id", "eq." + owner);
  return url;
}
function headers(token: string): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Preferences unavailable");
  return { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation" };
}
export async function loadNotificationPreferences(owner: string): Promise<PreferencesSnapshot> {
  const token = await verifiedToken(owner), url = endpoint(owner); url.searchParams.set("limit", "2");
  const response = await fetch(url.toString(), { headers: headers(token), cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("Preferences read failed");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length > 1) throw new Error("Invalid preferences response");
  const result = rows.length ? parseRow(rows[0], owner) : { preferences: defaultNotificationPreferences(), updatedAt: null };
  await currentOwner(owner);
  return result;
}
export async function saveNotificationPreferences(owner: string, baseline: PreferencesSnapshot, choices: NotificationChoices, withdrawLegacy: boolean, stillCurrent: () => boolean): Promise<PreferencesSnapshot> {
  if (notificationKeys.some(key => typeof choices[key] !== "boolean") || typeof withdrawLegacy !== "boolean") throw new Error("Invalid notification choices");
  const token = await verifiedToken(owner), url = endpoint(owner);
  const payload: Record<string, unknown> = Object.fromEntries(notificationKeys.map(key => [key, choices[key]]));
  if (withdrawLegacy) for (const key of legacyConsentKeys) payload[key] = false;
  if (baseline.updatedAt) {
    url.searchParams.set("updated_at", "eq." + baseline.updatedAt);
    // Field predicates also protect against lost writes if a timestamp trigger
    // is absent. Only the fields this form owns are written.
    for (const key of keys) url.searchParams.set(key, "eq." + baseline.preferences[key]);
  } else payload.user_id = owner;
  await currentOwner(owner);
  if (!stillCurrent()) throw new Error("Preferences account changed");
  const response = await fetch(url.toString(), { method: baseline.updatedAt ? "PATCH" : "POST", headers: headers(token), body: JSON.stringify(payload), cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("Preferences save not confirmed");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error("Preferences save not confirmed");
  const result = parseRow(rows[0], owner);
  if (notificationKeys.some(key => result.preferences[key] !== choices[key]) || legacyConsentKeys.some(key => result.preferences[key] !== (withdrawLegacy || !baseline.updatedAt ? false : baseline.preferences[key]))) throw new Error("Preferences save not confirmed");
  await currentOwner(owner);
  return result;
}
