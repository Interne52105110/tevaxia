import { NextResponse } from "next/server";
import { calculerMLV } from "@/lib/valuation";
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

/** Legacy route name: documented haircut sensitivity only, no certified MLV or regulatory risk weights. */
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

    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new RangeError("JSON object required");
    const { valeurMarche, decoteConjoncturelle, decoteCommercialisation, decoteSpecifique } = body;

    if (typeof valeurMarche !== "number" || !Number.isFinite(valeurMarche) || valeurMarche <= 0 || valeurMarche > 1e12) {
      statusCode = 400;
      response = NextResponse.json(
        { success: false, error: "valeurMarche must be a positive number" },
        { status: 400, headers: API_CORS_HEADERS },
      );
      return response;
    }

    for (const [name, value] of [
      ["decoteConjoncturelle", decoteConjoncturelle],
      ["decoteCommercialisation", decoteCommercialisation],
      ["decoteSpecifique", decoteSpecifique],
    ] as const) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
        statusCode = 400;
        response = NextResponse.json(
          { success: false, error: `${name} must be a number between 0 and 100 (percentage)` },
          { status: 400, headers: API_CORS_HEADERS },
        );
        return response;
      }
    }

    const total = decoteConjoncturelle + decoteCommercialisation + decoteSpecifique;
    if (total > 100) {
      statusCode = 400;
      response = NextResponse.json(
        { success: false, error: "Total decotes exceeds 100%" },
        { status: 400, headers: API_CORS_HEADERS },
      );
      return response;
    }

    const result = calculerMLV({
      valeurMarche,
      decoteConjoncturelle,
      decoteCommercialisation,
      decoteSpecifique,
    });

    response = withCors(NextResponse.json({
      success: true,
      data: result,
      meta: {
        api_key_name: auth.keyRecord.name,
        tier: auth.keyRecord.tier,
        method: "documented_haircut_sensitivity",
        regulatory_value: false,
        legacy_fields: "mlv and ratioMLVsurMV describe the arithmetic scenario only; ltvBands is empty",
      },
    }));
    return response;
  } catch (e) {
    statusCode = e instanceof RangeError ? 400 : 500;
    const message = e instanceof Error ? e.message : "Unknown error";
    response = NextResponse.json(
      { success: false, error: `Calculation error: ${message}` },
      { status: statusCode, headers: API_CORS_HEADERS },
    );
    return response;
  } finally {
    const latency = Date.now() - startedAt;
    // logApiCall is fire-and-forget
    void logApiCall(auth.keyRecord, "/api/v1/mlv", statusCode, latency);
  }
}
