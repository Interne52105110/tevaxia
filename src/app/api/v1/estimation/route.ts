import { NextResponse } from "next/server";
import {parseEstimationApiInput,ESTIMATION_API_METHOD,ESTIMATION_API_LIMITS} from "@/lib/estimation-api";
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

    const result = estimer(parseEstimationApiInput(body));
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
        method: ESTIMATION_API_METHOD,
        limitations: ESTIMATION_API_LIMITS,
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
    logApiCall(auth.keyRecord, "/api/v1/estimation", statusCode, latency).catch(() => {});
  }
}
