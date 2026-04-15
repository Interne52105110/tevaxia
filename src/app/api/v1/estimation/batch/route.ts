import { NextResponse } from "next/server";
import { estimer, type EstimationInput } from "@/lib/estimation";
import {
  authenticateApiRequestAsync,
  logApiCall,
  corsPreflightResponse,
  withCors,
  API_CORS_HEADERS,
} from "@/lib/api-auth";

const MAX_BATCH = 1000;

export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * POST /api/v1/estimation/batch
 *
 * Body: { items: EstimationInput[] }
 * Returns: { success, count, results: { success, data|error, index }[] }
 *
 * Chaque item est traité indépendamment ; la réponse globale reste
 * 200 même si certains items échouent (erreurs individuelles dans
 * results[i].error). Limite MAX_BATCH par requête.
 */
export async function POST(request: Request) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequestAsync(request);
  if (!auth.ok) return auth.response;

  let response: NextResponse;
  let statusCode = 200;

  try {
    let body: { items?: unknown };
    try {
      body = await request.json();
    } catch {
      statusCode = 400;
      response = NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400, headers: API_CORS_HEADERS },
      );
      return response;
    }

    if (!Array.isArray(body.items)) {
      statusCode = 400;
      response = NextResponse.json(
        { success: false, error: "Missing 'items' array in body" },
        { status: 400, headers: API_CORS_HEADERS },
      );
      return response;
    }

    if (body.items.length === 0) {
      statusCode = 400;
      response = NextResponse.json(
        { success: false, error: "Empty 'items' array" },
        { status: 400, headers: API_CORS_HEADERS },
      );
      return response;
    }

    if (body.items.length > MAX_BATCH) {
      statusCode = 413;
      response = NextResponse.json(
        { success: false, error: `Batch too large, max ${MAX_BATCH} items` },
        { status: 413, headers: API_CORS_HEADERS },
      );
      return response;
    }

    const results = body.items.map((raw, index) => {
      try {
        const input = raw as EstimationInput;
        if (!input.commune || !input.surface) {
          return { index, success: false, error: "Missing required fields: commune, surface" };
        }
        if (typeof input.surface !== "number" || input.surface <= 0 || input.surface > 10000) {
          return { index, success: false, error: "surface must be a positive number ≤ 10000" };
        }
        const result = estimer(input);
        if (!result) return { index, success: false, error: "Municipality not found" };
        return { index, success: true, data: result };
      } catch (e) {
        return { index, success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
    });

    const okCount = results.filter((r) => r.success).length;

    response = withCors(NextResponse.json({
      success: true,
      count: results.length,
      succeeded: okCount,
      failed: results.length - okCount,
      results,
      meta: {
        api_key_name: auth.keyRecord.name,
        tier: auth.keyRecord.tier,
        method: "tegova_evs_2025+hedonic",
        batch_max: MAX_BATCH,
      },
    }));
    return response;
  } catch (e) {
    statusCode = 500;
    const message = e instanceof Error ? e.message : "Unknown error";
    response = NextResponse.json(
      { success: false, error: `Batch error: ${message}` },
      { status: 500, headers: API_CORS_HEADERS },
    );
    return response;
  } finally {
    const latency = Date.now() - startedAt;
    logApiCall(auth.keyRecord, "/api/v1/estimation/batch", statusCode, latency).catch(() => {});
  }
}
