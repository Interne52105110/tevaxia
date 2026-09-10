import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiRequestAsync, API_CORS_HEADERS, corsPreflightResponse, logApiCall } from "@/lib/api-auth";
import { parsePmsImport, PMS_SOURCES } from "@/lib/pms/webhook-input";

export const runtime = "nodejs";
const headers = { ...API_CORS_HEADERS, "Cache-Control": "no-store" };
const errorResponse = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
export async function OPTIONS() { return corsPreflightResponse(); }

/** Normalized observations, authenticated through the shared hashed-key lookup. */
export async function POST(request: Request) {
  const started = Date.now();
  const auth = await authenticateApiRequestAsync(request);
  if (!auth.ok) { auth.response.headers.set("Cache-Control", "no-store"); return auth.response; }
  const key = auth.keyRecord;
  if (key.source !== "supabase" || !key.userId || !["pro", "enterprise"].includes(key.tier)) return errorResponse("An organization-bound Pro or Enterprise key is required", 403);
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Invalid JSON body", 400); }
  let input;
  try { input = parsePmsImport(body); } catch (error) { return errorResponse(error instanceof RangeError ? error.message : "Invalid metrics", 422); }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return errorResponse("Metrics service unavailable", 503);
  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: keyRow, error: keyError } = await admin.from("api_keys").select("org_id").eq("id", key.id).eq("user_id", key.userId).eq("active", true).maybeSingle();
    if (keyError) return errorResponse("Metrics authorization unavailable", 503);
    if (!keyRow?.org_id) return errorResponse("Active organization key required", 403);
    const { data: member, error: memberError } = await admin.from("org_members").select("role").eq("org_id", keyRow.org_id).eq("user_id", key.userId).maybeSingle();
    if (memberError) return errorResponse("Metrics authorization unavailable", 503);
    if (!member || !["admin", "member"].includes(member.role)) return errorResponse("Organization write access required", 403);
    const { data: hotel, error: hotelError } = await admin.from("hotels").select("id").eq("id", input.hotelId).eq("org_id", keyRow.org_id).maybeSingle();
    if (hotelError) return errorResponse("Metrics authorization unavailable", 503);
    if (!hotel) return errorResponse("Hotel not found or unauthorized", 404);
    const { data, error } = await admin.from("hotel_daily_metrics").upsert(input.rows, { onConflict: "hotel_id,metric_date" }).select("metric_date");
    if (error || !data || data.length !== input.rows.length || new Set(data.map(row => row.metric_date)).size !== input.rows.length || input.rows.some(row => !data.some(saved => saved.metric_date === row.metric_date))) return errorResponse("Metrics import could not be confirmed", 500);
    // Logging failures must not turn a confirmed import into a reported failure/retry.
    try { await logApiCall(key, "/api/v1/pms/webhook", 200, Date.now() - started); } catch {}
    return NextResponse.json({ success: true, hotel_id: input.hotelId, source: input.source, metrics_received: input.rows.length, metrics_upserted: data.length }, { headers });
  } catch { return errorResponse("Metrics service unavailable", 503); }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/pms/webhook", method: "POST",
    description: "Import normalized daily observations in EUR. Adapt vendor payloads to this format; this is not a native vendor connector.",
    authentication: "Active database Pro/Enterprise API key tied to the hotel organization; its user must currently be an admin or member. X-API-Key or Authorization: Bearer.",
    supported_sources: PMS_SOURCES,
    payload: { hotel_id: "Hotel UUID", source: "Optional source label; default generic", currency: "EUR only; default EUR", occupancy_unit: "ratio (default, 0–1) or percent (0–100), explicitly declared", metrics: [{ date: "Unique real date from 2000-01-01 through today in Luxembourg", occupancy: "Required unless both room counts are supplied", adr: "EUR, required and nonnegative; null allowed only at zero occupancy. At zero occupancy, use zero or null.", revpar: "Optional, must agree with occupancy × ADR within EUR 0.02", rooms_sold: "Optional nonnegative integer, at most rooms_available", rooms_available: "Positive integer when room counts are supplied" }] },
    semantics: "All rows are validated before writing. Each row replaces occupancy, ADR and RevPAR for its date. Partial observations, duplicate dates, unknown units and inconsistent values are rejected. No percentage is guessed.",
    limits: { max_metrics_per_request: 366, rate_limit: "Shared tier limits per server instance: Pro 60/min and 5000/day; Enterprise 600/min and 100000/day" },
  }, { headers });
}
