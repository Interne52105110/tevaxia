import { NextResponse } from "next/server";
import { estimer } from "@/lib/estimation";
import {
  authenticateApiRequestAsync,
  logApiCall,
  corsPreflightResponse,
  withCors,
  API_CORS_HEADERS,
} from "@/lib/api-auth";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequestAsync(request);
  if (!auth.ok) return auth.response;

  let response: NextResponse;
  let statusCode = 200;
  try {
    let body;
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

    if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.commune !== "string" || !body.surface) {
      statusCode = 400;
      response = NextResponse.json(
        { success: false, error: "Missing required fields: commune, surface" },
        { status: 400, headers: API_CORS_HEADERS },
      );
      return response;
    }

    if (typeof body.surface !== "number" || body.surface <= 0 || body.surface > 10000) {
      statusCode = 400;
      response = NextResponse.json(
        { success: false, error: "surface must be a positive number ≤ 10000" },
        { status: 400, headers: API_CORS_HEADERS },
      );
      return response;
    }

    if (body.typeBien && body.typeBien !== "appartement") {
      statusCode = 400;
      return NextResponse.json({ success: false, error: "Only freehold apartments are supported" }, { status: 400, headers: API_CORS_HEADERS });
    }
    const result = estimer({ nbChambres: 0, typeBien: "appartement", estNeuf: false, parking: false, etage: "adjEtage2e3eRef", etat: "adjEtatBonRef", exterieur: "adjExtBalconRef", classeEnergie: "D", ...body });
    if (!result) {
      statusCode = 404;
      response = NextResponse.json(
        { success: false, error: "No estimate: invalid inputs, ambiguous municipality or unavailable price for this segment" },
        { status: 404, headers: API_CORS_HEADERS },
      );
      return response;
    }

    response = withCors(NextResponse.json({
      success: true,
      data: result,
      meta: {
        api_key_name: auth.keyRecord.name,
        tier: auth.keyRecord.tier,
        method: "municipal_mean_with_unvalidated_assumptions",
        limitations: "Indicative freehold apartment estimate. Conventional range, not a statistical confidence interval. See /transparence.",
      },
    }));
    return response;
  } catch (e) {
    statusCode = 500;
    const message = e instanceof Error ? e.message : "Unknown error";
    response = NextResponse.json(
      { success: false, error: `Calculation error: ${message}` },
      { status: 500, headers: API_CORS_HEADERS },
    );
    return response;
  } finally {
    const latency = Date.now() - startedAt;
    logApiCall(auth.keyRecord, "/api/v1/estimation", statusCode, latency).catch(() => {});
  }
}
