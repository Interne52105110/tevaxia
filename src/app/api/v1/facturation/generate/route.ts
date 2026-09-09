import { NextResponse } from "next/server";
import { validateInvoice, type FacturXInvoice } from "@/lib/facturation/factur-x";
import { generateFacturXPdf } from "@/lib/facturation/factur-x-pdf";
import { authenticateApiRequestAsync, corsPreflightResponse, API_CORS_HEADERS } from "@/lib/api-auth";

export const runtime = "nodejs";
const responseHeaders = { ...API_CORS_HEADERS, "Cache-Control": "no-store" };

export async function OPTIONS() { return corsPreflightResponse(); }

/**
 * POST /api/v1/facturation/generate
 *
 * Generates the current billing export from FacturXInvoice input.
 * Export-format compliance is reviewed separately. Requires a valid Pro/Enterprise key.
 *
 * Body: FacturXInvoice JSON
 * Réponse défaut: application/pdf (binaire).
 * Param ?format=xml : renvoie uniquement le XML CII.
 * Param ?format=json : renvoie { xml, pdf_base64, filename }.
 */
export async function POST(req: Request) {
  const auth = await authenticateApiRequestAsync(req);
  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", "no-store");
    return auth.response;
  }
  if (auth.keyRecord.tier !== "pro" && auth.keyRecord.tier !== "enterprise") {
    return NextResponse.json({ error: "Pro or Enterprise API key required" }, { status: 403, headers: responseHeaders });
  }

  const format = new URL(req.url).searchParams.get("format") ?? "pdf";
  if (!["pdf", "xml", "json"].includes(format)) return NextResponse.json({ error: "Unsupported format" }, { status: 400, headers: responseHeaders });

  let body: FacturXInvoice;
  try {
    body = await req.json() as FacturXInvoice;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: responseHeaders });
  }

  let errors;
  try { errors = validateInvoice(body); }
  catch { return NextResponse.json({ error: "Invalid invoice structure" }, { status: 422, headers: responseHeaders }); }
  if (errors.length) {
    return NextResponse.json({ error: "Validation failed", validation: errors }, { status: 422, headers: responseHeaders });
  }

  try {
    const artifacts = await generateFacturXPdf(body);

    if (format === "xml") {
      return new Response(artifacts.xml, {
        status: 200,
        headers: {
          ...responseHeaders,
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
      }, { headers: responseHeaders });
    }

    // default: pdf
    return new Response(new Uint8Array(artifacts.pdfBytes), {
      status: 200,
      headers: {
        ...responseHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${artifacts.pdfFilename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate billing export" }, { status: 500, headers: responseHeaders });
  }
}
