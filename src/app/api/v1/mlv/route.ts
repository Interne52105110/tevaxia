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

/**
 * POST /api/v1/mlv — Mortgage Lending Value dédié
 *
 * Renvoie la MLV (CRR art. 4(1)(74)) à partir de la valeur de marché
 * et des décotes prudentielles. Distinct de /api/v1/estimation qui
 * renvoie la Market Value. Conforme EBA/GL/2020/06 (LOM) + CRR2 art. 125/126.
 *
 * Body JSON :
 *   {
 *     "valeurMarche": 750000,
 *     "decoteConjoncturelle": 5,      // % — marge prudentielle conditions actuelles
 *     "decoteCommercialisation": 3,   // % — délai/risque de liquidité
 *     "decoteSpecifique": 2           // % — risques spécifiques au bien
 *   }
 *
 * Réponse :
 *   {
 *     "success": true,
 *     "data": {
 *       "valeurMarche": 750000,
 *       "totalDecotes": 75000,
 *       "totalDecotesPct": 10,
 *       "mlv": 675000,
 *       "ratioMLVsurMV": 0.90,
 *       "ltvBands": [...]  // Risk weights CRR2 par palier LTV
 *     },
 *     "meta": {
 *       "api_key_name": "...",
 *       "tier": "...",
 *       "method": "crr_art_4_1_74+eba_gl_2020_06"
 *     }
 *   }
 */
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

    const { valeurMarche, decoteConjoncturelle, decoteCommercialisation, decoteSpecifique } = body;

    if (typeof valeurMarche !== "number" || valeurMarche <= 0) {
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
      if (typeof value !== "number" || value < 0 || value > 100) {
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
        method: "crr_art_4_1_74+eba_gl_2020_06",
        bases_legales: [
          "Règlement (UE) 575/2013 art. 4(1)(74) (CRR)",
          "EBA/GL/2020/06 Loan Origination and Monitoring",
          "CSSF Circulaire 20/740",
        ],
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
    // logApiCall is fire-and-forget
    void logApiCall(auth.keyRecord, "/api/v1/mlv", statusCode, latency);
  }
}
