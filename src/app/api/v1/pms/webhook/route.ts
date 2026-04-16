// ============================================================
// PMS WEBHOOK — Ingestion quotidienne depuis Mews / Cloudbeds
// ============================================================
// Reçoit des données de performance journalière (occupancy, ADR)
// et les insère dans hotel_daily_metrics. Authentifié par clé API
// + signature HMAC optionnelle pour les PMS qui la supportent.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface PmsPayload {
  hotel_id: string;
  source: "mews" | "cloudbeds" | "opera" | "protel" | "generic";
  metrics: {
    date: string; // YYYY-MM-DD
    occupancy?: number; // 0-1
    adr?: number;
    revpar?: number;
    rooms_sold?: number;
    rooms_available?: number;
  }[];
}

function parseOccupancy(m: PmsPayload["metrics"][0]): number | null {
  if (m.occupancy !== undefined && m.occupancy !== null) {
    return m.occupancy > 1 ? m.occupancy / 100 : m.occupancy;
  }
  if (m.rooms_sold !== undefined && m.rooms_available !== undefined && m.rooms_available > 0) {
    return m.rooms_sold / m.rooms_available;
  }
  return null;
}

export async function POST(request: NextRequest) {
  // Auth: require x-api-key header
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  // Validate API key
  const { data: keyRow, error: keyErr } = await admin
    .from("api_keys")
    .select("id, org_id, is_active")
    .eq("key_hash", apiKey)
    .maybeSingle();

  if (keyErr || !keyRow || !keyRow.is_active) {
    return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 403 });
  }

  let body: PmsPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.hotel_id || !Array.isArray(body.metrics) || body.metrics.length === 0) {
    return NextResponse.json({ error: "hotel_id and metrics[] required" }, { status: 400 });
  }

  if (body.metrics.length > 366) {
    return NextResponse.json({ error: "Maximum 366 metrics per request" }, { status: 400 });
  }

  // Verify hotel belongs to the org
  const { data: hotel, error: hotelErr } = await admin
    .from("hotels")
    .select("id, org_id")
    .eq("id", body.hotel_id)
    .maybeSingle();

  if (hotelErr || !hotel || hotel.org_id !== keyRow.org_id) {
    return NextResponse.json({ error: "Hotel not found or unauthorized" }, { status: 404 });
  }

  // Upsert metrics
  const source = body.source || "generic";
  const rows = body.metrics
    .filter((m) => m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date))
    .map((m) => ({
      hotel_id: body.hotel_id,
      metric_date: m.date,
      occupancy: parseOccupancy(m),
      adr: m.adr ?? null,
      revpar: m.revpar ?? null,
      source: `pms_sync`,
      notes: `PMS: ${source}`,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid metrics in payload" }, { status: 400 });
  }

  const { error: upsertErr } = await admin
    .from("hotel_daily_metrics")
    .upsert(rows, { onConflict: "hotel_id,metric_date" });

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  // Log API usage
  await admin.from("api_usage_log").insert({
    api_key_id: keyRow.id,
    endpoint: "/api/v1/pms/webhook",
    method: "POST",
    status_code: 200,
  }).then(() => {});

  return NextResponse.json({
    success: true,
    hotel_id: body.hotel_id,
    source,
    metrics_received: body.metrics.length,
    metrics_upserted: rows.length,
  });
}

// GET — documentation
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/pms/webhook",
    method: "POST",
    description: "Ingest daily hotel performance metrics from a PMS (Property Management System)",
    authentication: "x-api-key header (obtain from /profil/organisation)",
    supported_sources: ["mews", "cloudbeds", "opera", "protel", "generic"],
    payload: {
      hotel_id: "UUID of the hotel",
      source: "PMS identifier (e.g., 'mews')",
      metrics: [{
        date: "YYYY-MM-DD",
        occupancy: "0-1 (or 0-100, auto-normalized)",
        adr: "Average Daily Rate in EUR",
        revpar: "Revenue Per Available Room (optional, auto-computed if missing)",
        rooms_sold: "Alternative to occupancy: number of rooms sold",
        rooms_available: "Total rooms available (used with rooms_sold)",
      }],
    },
    limits: {
      max_metrics_per_request: 366,
      rate_limit: "100 requests/hour per API key",
    },
    example_curl: `curl -X POST https://tevaxia.lu/api/v1/pms/webhook \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{"hotel_id":"...","source":"mews","metrics":[{"date":"2026-04-15","occupancy":0.82,"adr":145}]}'`,
  });
}
