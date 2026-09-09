import { describe, expect, it } from "vitest";
import { buildFacturXCiiXml, validateInvoice, type FacturXInvoice } from "../facturation/factur-x";
function invoice() { return { profile: "BASIC", document_type: "380", invoice_number: "F-1", issue_date: "2026-09-10", currency: "EUR", seller: { name: "Seller", country_code: "LU" }, buyer: { name: "Buyer", country_code: "LU" }, lines: [{ id: "1", name: "Service", quantity: 1, unit_price_net: 100, vat_category: "S", vat_rate_percent: 17 }] }; }
describe("billing input integrity without unsafe coercion", () => {
  it("returns errors for unknown root and nested structures without throwing", () => {
    for (const data of [null, 42, "invoice", [], {}, { ...invoice(), seller: null }, { ...invoice(), buyer: [] }, { ...invoice(), lines: [null] }, { ...invoice(), lines: {} }]) expect(validateInvoice(data).length).toBeGreaterThan(0);
  });
  it("accepts the existing basic shape", () => expect(validateInvoice(invoice())).toEqual([]));
  it("blocks malformed data at the shared XML/export boundary", () => {
    expect(()=>buildFacturXCiiXml({...invoice(),lines:[{...invoice().lines[0],unit_price_net:undefined}]} as unknown as FacturXInvoice)).toThrow(RangeError);
    expect(()=>buildFacturXCiiXml(null as unknown as FacturXInvoice)).toThrow(RangeError);
  });
  it("rejects numeric strings, missing amounts and non-finite numbers", () => {
    for (const field of ["quantity", "unit_price_net", "vat_rate_percent"]) for (const value of [undefined, null, "17", NaN, Infinity, -Infinity]) {
      const data=invoice(); Object.assign(data.lines[0],{[field]:value}); expect(validateInvoice(data).some(e=>e.field.endsWith(field))).toBe(true);
    }
  });
  it("checks real calendar dates and optional due dates", () => {
    for (const value of ["2026-02-29", "2026-04-31", "2026-13-01", null, 20260910]) {
      expect(validateInvoice({...invoice(),issue_date:value}).some(e=>e.field==="issue_date")).toBe(true);
      expect(validateInvoice({...invoice(),due_date:value}).some(e=>e.field==="due_date")).toBe(true);
    }
    expect(validateInvoice({...invoice(),issue_date:"2028-02-29"})).toEqual([]);
  });
  it("rejects unknown profiles, types and categories", () => {
    for(const value of ["unknown",["BASIC"],null]) expect(validateInvoice({...invoice(),profile:value}).some(e=>e.field==="profile")).toBe(true);
    for(const value of [380,"999",null]) expect(validateInvoice({...invoice(),document_type:value}).some(e=>e.field==="document_type")).toBe(true);
    const data=invoice(); data.lines[0].vat_category="unknown"; expect(validateInvoice(data).some(e=>e.field.endsWith("vat_category"))).toBe(true);
  });
  it("requires a positive standard rate and zero for non-standard categories", () => {
    for(const category of ["E","Z","AE","K","G","O"]) { const data=invoice(); data.lines[0].vat_category=category; expect(validateInvoice(data).length).toBeGreaterThan(0); data.lines[0].vat_rate_percent=0; expect(validateInvoice(data)).toEqual([]); }
    const data=invoice(); data.lines[0].vat_rate_percent=0; expect(validateInvoice(data).length).toBeGreaterThan(0);
  });
  it("rejects discounts outside bounds and accepts a full discount", () => {
    for(const discount_percent of [-1,101,"10",NaN]) expect(validateInvoice({...invoice(),lines:[{...invoice().lines[0],discount_percent}]}).length).toBeGreaterThan(0);
    expect(validateInvoice({...invoice(),lines:[{...invoice().lines[0],discount_percent:100}]})).toEqual([]);
  });
  it("validates every text used in XML and rejects XML control characters", () => {
    for(const data of [{...invoice(),invoice_number:42},{...invoice(),notes:"note"},{...invoice(),notes:[null]},{...invoice(),payment_iban:42},{...invoice(),seller:{...invoice().seller,name:"bad\u0000name"}},{...invoice(),lines:[{...invoice().lines[0],description:{}}]}]) expect(validateInvoice(data).length).toBeGreaterThan(0);
    expect(validateInvoice({...invoice(),notes:["Line one\nLine two & <text>"]})).toEqual([]);
  });
});
