import { supabase, isSupabaseConfigured } from "./supabase";
import { missingApiKeyColumn } from "./api-key-schema";

export type ApiTier = "free" | "pro" | "enterprise";

export interface ApiKey {
  id: string;
  user_id: string;
  org_id: string | null;
  name: string;
  key_prefix: string;
  tier: ApiTier;
  active: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface ApiUsageDay {
  day: string;
  total: number;
  errors: number;
  avg_latency_ms: number;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function hashKey(plainKey: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle !== "object") {
    throw new Error("WebCrypto non disponible — environnement non supporté");
  }
  const bytes = new TextEncoder().encode(plainKey);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomBytesHex(n: number): string {
  const arr = new Uint8Array(n);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function assertKeyOwner(expectedUserId: string) {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (!expectedUserId || error || data.user?.id !== expectedUserId) throw new Error("API key account changed or unavailable");
  return client;
}
const baseColumns = "id, user_id, name, key_prefix, tier, created_at, last_used_at, revoked_at";
const columns = baseColumns + ", org_id, active";
function normalizeKey(row: Record<string, unknown>): ApiKey {
  return { ...row, org_id: typeof row.org_id === "string" ? row.org_id : null, active: row.revoked_at === null && row.active !== false } as unknown as ApiKey;
}

/** User-created keys start Free; higher tiers require separately authorized provisioning. */
export async function createApiKey(input: { name: string }, expectedUserId: string): Promise<{ apiKey: ApiKey; plainKey: string }> {
  if (typeof input?.name !== "string" || !input.name.trim() || input.name.trim().length > 100) throw new Error("Invalid API key name");
  const client = await assertKeyOwner(expectedUserId);
  const plainKey = `tvx_${randomBytesHex(24)}`;
  const key_prefix = plainKey.slice(0, 11);
  const key_hash = await hashKey(plainKey);
  await assertKeyOwner(expectedUserId);
  const { data, error } = await client.from("api_keys").insert({ user_id: expectedUserId, name: input.name.trim(), key_prefix, key_hash, tier: "free" }).select(baseColumns).single();
  if (error || !data?.id || data.user_id !== expectedUserId) throw new Error("API key creation could not be confirmed");
  await assertKeyOwner(expectedUserId);
  return { apiKey: normalizeKey(data), plainKey };
}

export async function listMyApiKeys(expectedUserId: string): Promise<ApiKey[]> {
  const client = await assertKeyOwner(expectedUserId);
  const rows: ApiKey[] = []; let cursor = "", selected = columns;
  for (;;) {
    await assertKeyOwner(expectedUserId);
    let query = client.from("api_keys").select(selected).eq("user_id", expectedUserId).order("id", { ascending: true }).limit(200);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    const absent = ["active", "org_id"].find(column => selected.split(", ").includes(column) && missingApiKeyColumn(error, [column]));
    if (absent) { selected = selected.split(", ").filter(column => column !== absent).join(", "); continue; }
    if (error || !data) throw new Error("API keys read failed");
    await assertKeyOwner(expectedUserId);
    if (!data.length) return rows.sort((a,b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
    for (const raw of data as unknown[]) {
      if (!raw || typeof raw !== "object") throw new Error("Invalid API key page");
      const row = raw as Record<string, unknown>;
      if (row.user_id !== expectedUserId || typeof row.id !== "string" || row.id <= cursor || (typeof row.tier !== "string" || !["free", "pro", "enterprise"].includes(row.tier))) throw new Error("Invalid API key page");
      cursor = row.id; rows.push(normalizeKey(row));
    }
    if (rows.length > 10000) throw new Error("Too many API keys to display");
  }
}

export async function revokeApiKey(id: string, expectedUserId: string): Promise<void> {
  const client = await assertKeyOwner(expectedUserId);
  const revokedAt = new Date().toISOString();
  let { data, error } = await client.from("api_keys").update({ active: false, revoked_at: revokedAt }).eq("id", id).eq("user_id", expectedUserId).select("id, revoked_at");
  if (missingApiKeyColumn(error, ["active"])) {
    ({ data, error } = await client.from("api_keys").update({ revoked_at: revokedAt }).eq("id", id).eq("user_id", expectedUserId).select("id, revoked_at"));
  }
  if (error || !data || data.length !== 1 || data[0].id !== id || typeof data[0].revoked_at !== "string" || !Number.isFinite(Date.parse(data[0].revoked_at))) throw new Error("API key revocation could not be confirmed");
  await assertKeyOwner(expectedUserId);
}

export async function deleteApiKey(id: string, expectedUserId: string): Promise<void> {
  const client = await assertKeyOwner(expectedUserId);
  const { data, error } = await client.from("api_keys").delete().eq("id", id).eq("user_id", expectedUserId).select("id");
  if (error || !data || data.length !== 1 || data[0].id !== id) throw new Error("API key deletion could not be confirmed");
  await assertKeyOwner(expectedUserId);
}

export async function getUsageDaily(keyId: string, days: number, expectedUserId: string): Promise<ApiUsageDay[]> {
  if (!keyId || !Number.isInteger(days) || days < 1 || days > 366) throw new Error("Invalid API usage period");
  const client = await assertKeyOwner(expectedUserId);
  const { data: key, error: keyError } = await client.from("api_keys").select("id").eq("id", keyId).eq("user_id", expectedUserId).maybeSingle();
  if (keyError || !key) throw new Error("API key unavailable");
  await assertKeyOwner(expectedUserId);
  const { data, error } = await client.rpc("api_usage_daily", { p_key_id: keyId, p_days: days });
  if (error || !Array.isArray(data)) throw new Error("API usage read failed");
  await assertKeyOwner(expectedUserId);
  return data.map((row): ApiUsageDay => {
    if ([row.total, row.errors, row.avg_latency_ms].some(value => typeof value !== "number" && (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)))) throw new Error("Invalid API usage data");
    const total = Number(row.total), errors = Number(row.errors), latency = Number(row.avg_latency_ms);
    if (typeof row.day !== "string" || !Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(errors) || errors < 0 || errors > total || !Number.isFinite(latency) || latency < 0) throw new Error("Invalid API usage data");
    return { day: row.day, total, errors, avg_latency_ms: latency };
  }).sort((a,b) => a.day.localeCompare(b.day));
}
