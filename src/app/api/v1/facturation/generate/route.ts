import { NextResponse } from "next/server";
import { validateInvoice, type FacturXInvoice } from "@/lib/facturation/factur-x";
import { generateFacturXPdf } from "@/lib/facturation/factur-x-pdf";

export const runtime = "nodejs";

/**
 * POST /api/v1/facturation/generate
 *
 * Génère une Factur-X (PDF/A-3 + XML CII embarqué) à partir d'un body JSON
 * conforme au type FacturXInvoice. Protégé par clé API tevaxia (plan Pro).
 *
 * Body: FacturXInvoice JSON
 * Réponse défaut: application/pdf (binaire).
 * Param ?format=xml : renvoie uniquement le XML CII.
 * Param ?format=json : renvoie { xml, pdf_base64, filename }.
 */
export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!apiKey) {
    return NextResponse.json({ error: "API key required (X-API-Key or Authorization: Bearer)" }, { status: 401 });
  }

  let body: FacturXInvoice;
  try {
    body = await req.json() as FacturXInvoice;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const errors = validateInvoice(body);
  if (errors.length) {
    return NextResponse.json({ error: "Validation failed", validation: errors }, { status: 422 });
  }

  const format = new URL(req.url).searchParams.get("format") ?? "pdf";

  try {
    const artifacts = await generateFacturXPdf(body);

    if (format === "xml") {
      return new Response(artifacts.xml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${artifacts.xmlFilename}"`,
        },
      });
    }

    if (format === "json") {
      return NextResponse.json({
        xml: artifacts.xml,
        pdf_base64: Buffer.from(artifacts.pdfBytes).toString("base64"),
        filename_pdf: artifacts.pdfFilename,
        filename_xml: artifacts.xmlFilename,
      });
    }

    // default: pdf
    return new Response(new Uint8Array(artifacts.pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${artifacts.pdfFilename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
