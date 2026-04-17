import { NextResponse } from "next/server";
import { isConfigured, buildJwt } from "@/lib/enable-banking";

export const runtime = "nodejs";

/**
 * GET /api/psd2/debug
 * Diagnostic endpoint: retourne le JWT généré (décodable sur jwt.io)
 * + métadonnées sur la config. Ne retourne JAMAIS la private key.
 */
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({
      configured: false,
      appIdSet: Boolean(process.env.ENABLE_BANKING_APP_ID),
      privateKeySet: Boolean(process.env.ENABLE_BANKING_PRIVATE_KEY),
    });
  }
  const appId = process.env.ENABLE_BANKING_APP_ID!;
  const pk = process.env.ENABLE_BANKING_PRIVATE_KEY!.replace(/\\n/g, "\n");
  let jwt: string | null = null;
  let jwtError: string | null = null;
  try {
    jwt = buildJwt();
  } catch (e) {
    jwtError = e instanceof Error ? e.message : String(e);
  }

  // Décodage header/payload (sans la signature) pour vérification rapide
  let header: unknown = null;
  let payload: unknown = null;
  if (jwt) {
    const [h, p] = jwt.split(".");
    try {
      header = JSON.parse(Buffer.from(h.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
      payload = JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    } catch { /* noop */ }
  }

  return NextResponse.json({
    configured: true,
    appId: appId.length > 10 ? `${appId.slice(0, 8)}…${appId.slice(-4)}` : appId,
    appIdLength: appId.length,
    appIdHasWhitespace: /\s/.test(appId),
    privateKeyStartsWith: pk.slice(0, 40),
    privateKeyEndsWith: pk.slice(-40),
    privateKeyLineCount: pk.split("\n").length,
    privateKeyType: pk.includes("BEGIN RSA PRIVATE KEY") ? "PKCS1" : pk.includes("BEGIN PRIVATE KEY") ? "PKCS8" : "unknown",
    jwt,
    jwtError,
    decodedHeader: header,
    decodedPayload: payload,
  });
}
