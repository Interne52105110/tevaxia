import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const generate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/facturation/factur-x-pdf", () => ({ generateFacturXPdf: generate }));
import { OPTIONS, POST } from "../route";

const invoice = { profile: "BASIC", document_type: "380", invoice_number: "TEST-1", issue_date: "2026-09-10", currency: "EUR", seller: { name: "Seller", vat_id: "LU12345678", country_code: "LU" }, buyer: { name: "Buyer", country_code: "LU" }, lines: [{ id: "1", name: "Service", quantity: 1, unit_price_net: 100, vat_category: "S", vat_rate_percent: 17 }] };
let key: string;
function request(body: unknown = invoice, format = "pdf", apiKey: string | null = key) {
  return new Request(`http://localhost/api/v1/facturation/generate?format=${format}`, { method: "POST", headers: { "Content-Type": "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) }, body: JSON.stringify(body) });
}
beforeEach(() => {
  key = `isolated-${crypto.randomUUID()}`;
  vi.stubEnv("TEVAXIA_API_KEYS", `test:${key}:pro`);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  generate.mockReset().mockResolvedValue({ pdfBytes: new Uint8Array([1, 2, 3]), xml: "<test/>", pdfFilename: "test.pdf", xmlFilename: "test.xml" });
});
afterEach(() => vi.unstubAllEnvs());
describe("billing API authorization boundary", () => {
  it("returns 422 for missing tax identifiers before invoking the generator", async () => {
    const response = await POST(request({ ...invoice, seller: { ...invoice.seller, vat_id: "" } }));
    expect(response.status).toBe(422); expect(generate).not.toHaveBeenCalled();
  });
  it("rejects absent and arbitrary keys before reading or exporting", async () => {
    for (const value of [null, "arbitrary-invalid-key"]) {
      const req = request(null, "pdf", value), read = vi.spyOn(req, "json");
      const response = await POST(req);
      expect(response.status).toBe(401); expect(read).not.toHaveBeenCalled(); expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
    expect(generate).not.toHaveBeenCalled();
  });
  it("rejects free and public sandbox keys", async () => {
    vi.stubEnv("TEVAXIA_API_KEYS", `test:${key}:free`);
    for (const value of [key, "tvx_sandbox_public_demo_key_read_only"]) expect((await POST(request(invoice, "pdf", value))).status).toBe(403);
    expect(generate).not.toHaveBeenCalled();
  });
  it.each(["pdf", "xml", "json"])("permits a verified Pro key for %s with private responses", async format => {
    const response = await POST(request(invoice, format));
    expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("no-store"); expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(generate).toHaveBeenCalledExactlyOnceWith(invoice);
    if (format === "json") expect((await response.json()).pdf_base64).toBe("AQID");
    else if (format === "xml") expect(await response.text()).toBe("<test/>");
    else expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
  it("accepts an Enterprise Bearer key", async () => {
    vi.stubEnv("TEVAXIA_API_KEYS", `test:${key}:enterprise`);
    const req=request(); req.headers.delete("X-API-Key"); req.headers.set("Authorization", `Bearer ${key}`);
    expect((await POST(req)).status).toBe(200);
  });
  it("returns client errors for malformed bodies and unsupported formats", async () => {
    for (const body of [null, {}, [], { ...invoice, seller: null }]) expect((await POST(request(body))).status).toBe(422);
    expect((await POST(request(invoice, "invalid"))).status).toBe(400);
    const req=request(); vi.spyOn(req,"json").mockRejectedValue(new SyntaxError("bad JSON")); expect((await POST(req)).status).toBe(400);
    expect(generate).not.toHaveBeenCalled();
  });
  it("does not expose internal generation failures", async () => {
    generate.mockRejectedValue(new Error("internal path or database detail"));
    const response = await POST(request()); expect(response.status).toBe(500); expect(await response.text()).not.toContain("internal path");
  });
  it("enforces the shared rate limit before generation", async () => {
    for (let n=0;n<60;n++) expect((await POST(request())).status).toBe(200);
    const response=await POST(request()); expect(response.status).toBe(429); expect(response.headers.get("Retry-After")).toBeTruthy(); expect(generate).toHaveBeenCalledTimes(60);
  });
  it("supports CORS preflight", async () => { expect((await OPTIONS()).status).toBe(204); });
});
