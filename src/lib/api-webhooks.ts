import { supabase, isSupabaseConfigured } from "./supabase";

export type ApiWebhookEvent = "estimation.price_change" | "estimation.new" | "health.check";

export interface ApiWebhook {
  id: string;
  user_id: string;
  event_type: ApiWebhookEvent;
  url: string;
  secret?: string;
  active: boolean;
  threshold_pct: number | null;
  created_at: string;
  last_triggered_at: string | null;
}

export interface ApiWebhookDelivery {
  id: number;
  webhook_id: string;
  event_type: ApiWebhookEvent;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  delivered_at: string;
  duration_ms: number | null;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export function validateWebhookUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) throw new Error("Public HTTPS URL on port 443 required");
  return url.href;
}

async function webhookOwner(expectedUserId: string) {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (!expectedUserId || error || data.user?.id !== expectedUserId) throw new Error("Webhook account changed or unavailable");
  return client;
}
const webhookColumns = "id, user_id, event_type, url, active, threshold_pct, created_at, last_triggered_at";
export async function createWebhook(input: { event_type: ApiWebhookEvent; url: string; threshold_pct?: number }, expectedUserId: string): Promise<ApiWebhook> {
  const url = validateWebhookUrl(input.url);
  if (input.event_type !== "health.check") throw new Error("Only manual health.check configurations are supported");
  const client = await webhookOwner(expectedUserId);
  const { data, error } = await client.from("api_webhooks").insert({ user_id: expectedUserId, event_type: "health.check", url, threshold_pct: null }).select(webhookColumns).single();
  if (error || !data?.id || data.user_id !== expectedUserId) throw new Error("Webhook creation could not be confirmed");
  await webhookOwner(expectedUserId);
  return data as ApiWebhook;
}
export async function listMyWebhooks(expectedUserId: string): Promise<ApiWebhook[]> {
  const client = await webhookOwner(expectedUserId);
  const rows: ApiWebhook[] = []; let cursor = "";
  for (;;) {
    await webhookOwner(expectedUserId);
    let q = client.from("api_webhooks").select(webhookColumns).eq("user_id", expectedUserId).order("id", { ascending: true }).limit(200);
    if (cursor) q = q.gt("id", cursor);
    const { data, error } = await q;
    if (error || !data) throw new Error("Webhooks read failed");
    await webhookOwner(expectedUserId);
    if (!data.length) return rows.sort((a,b) => b.created_at.localeCompare(a.created_at));
    for (const row of data) {
      if (row.user_id !== expectedUserId || typeof row.id !== "string" || row.id <= cursor) throw new Error("Invalid webhook page");
      cursor = row.id; rows.push(row as ApiWebhook);
    }
    if (rows.length > 10000) throw new Error("Too many webhooks to display");
  }
}
export async function deleteWebhook(id: string, expectedUserId: string): Promise<void> {
  const client = await webhookOwner(expectedUserId);
  const { data, error } = await client.from("api_webhooks").delete().eq("id", id).eq("user_id", expectedUserId).select("id");
  if (error || !data || data.length !== 1 || data[0].id !== id) throw new Error("Webhook deletion could not be confirmed");
  await webhookOwner(expectedUserId);
}
export async function toggleWebhookActive(id: string, active: boolean, expectedUserId: string): Promise<void> {
  const client = await webhookOwner(expectedUserId);
  if (typeof active !== "boolean") throw new Error("Invalid webhook state");
  const { data, error } = await client.from("api_webhooks").update({ active }).eq("id", id).eq("user_id", expectedUserId).select("id, active");
  if (error || !data || data.length !== 1 || data[0].id !== id || data[0].active !== active) throw new Error("Webhook state change could not be confirmed");
  await webhookOwner(expectedUserId);
}
export async function listRecentDeliveries(webhookId: string, expectedUserId: string): Promise<ApiWebhookDelivery[]> {
  const client = await webhookOwner(expectedUserId);
  const { data: webhook, error: accessError } = await client.from("api_webhooks").select("id").eq("id", webhookId).eq("user_id", expectedUserId).maybeSingle();
  if (accessError || !webhook) throw new Error("Webhook unavailable");
  const { data, error } = await client.from("api_webhook_deliveries").select("*").eq("webhook_id", webhookId).order("delivered_at", { ascending: false }).limit(10);
  if (error || !data) throw new Error("Webhook deliveries read failed");
  await webhookOwner(expectedUserId);
  return data as ApiWebhookDelivery[];
}

/**
 * Déclenche un test de webhook via /api/v1/webhooks/test.
 * Renvoie le status_code et le temps de livraison.
 */
export async function triggerTestWebhook(webhookId: string, expectedUserId: string): Promise<{ ok: boolean; status?: number; durationMs?: number; error?: string }> {
  const client = ensureClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (!expectedUserId || userError || userData.user?.id !== expectedUserId) throw new Error("Webhook account changed or unavailable");
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || session?.user.id !== expectedUserId || !session.access_token) throw new Error("Webhook account changed or unavailable");
  const res = await fetch("/api/v1/webhooks/test", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ webhook_id: webhookId }),
  });
  const body: unknown = await res.json().catch(() => null);
  const { data: current, error: currentError } = await client.auth.getUser();
  if (currentError || current.user?.id !== expectedUserId) throw new Error("Webhook account changed or unavailable");
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Invalid delivery response" };
  const result = body as Record<string, unknown>;
  const status = typeof result.status === "number" && Number.isInteger(result.status) && result.status >= 100 && result.status <= 599 ? result.status : undefined;
  const durationMs = typeof result.durationMs === "number" && Number.isFinite(result.durationMs) && result.durationMs >= 0 ? result.durationMs : undefined;
  const ok = res.ok && result.ok === true && status !== undefined && status >= 200 && status < 300;
  return { ok, status, durationMs, ...(!ok ? { error: typeof result.error === "string" && result.error ? result.error : `Delivery failed (HTTP ${status ?? res.status})` } : {}) };
}
