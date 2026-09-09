import { expect, it } from "vitest";
import { addInvoiceDays, invoiceDate, applyInvoiceTemplate, blankInvoiceLine, type TemplateId } from "../facturation/templates";
import type { FacturXInvoice } from "../facturation/factur-x";
const invoice = { profile:"BASIC",document_type:"380",invoice_number:"KEEP-1",issue_date:"2026-09-10",due_date:"2026-10-01",currency:"EUR",seller:{name:"Seller",country_code:"DE"},buyer:{name:"Buyer",country_code:"LU"},lines:[],notes:["Old template note"] } as FacturXInvoice;
it("uses the Luxembourg civil day across UTC midnight and DST", () => {
  expect(invoiceDate(new Date("2026-09-09T22:30:00Z"))).toBe("2026-09-10");
  expect(invoiceDate(new Date("2026-01-09T23:30:00Z"))).toBe("2026-01-10");
  expect(addInvoiceDays("2026-03-28",2)).toBe("2026-03-30");
  expect(addInvoiceDays("2028-02-28",1)).toBe("2028-02-29");
});
it.each(["landlord","syndic","hotel","lease","valuer"] as TemplateId[])("requires entered prices and VAT for %s without asserting a legal regime", template => {
  const next = applyInvoiceTemplate(template, invoice, key => "translated:"+key);
  expect(next.invoice_number).toBe("KEEP-1"); expect(next.due_date).toBe("2026-10-01"); expect(next.seller.country_code).toBe("DE");
  expect(next.notes).toEqual([]); expect(next.lines.length).toBeGreaterThan(0);
  for (const line of next.lines) { expect(line.name).toMatch(/^translated:/); expect(Number.isNaN(line.unit_price_net)).toBe(true); expect(Number.isNaN(line.vat_rate_percent)).toBe(true); }
  expect(invoice.notes).toEqual(["Old template note"]);
});
it("leaves a generic document intact and never defaults blank prices or rates to zero", () => {
  expect(applyInvoiceTemplate("generic", invoice, key => key)).toBe(invoice);
  expect(Number.isNaN(blankInvoiceLine().vat_rate_percent)).toBe(true);
});
