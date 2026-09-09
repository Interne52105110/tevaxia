import { expect, it } from "vitest";
import { validateInvoiceForExport } from "../facturation/export-validation";
import { buildFacturXCiiXml, type FacturXInvoice } from "../facturation/factur-x";
const base = (): FacturXInvoice => ({profile:"BASIC",document_type:"380",invoice_number:"TEST",issue_date:"2026-09-10",currency:"EUR",seller:{name:"Seller",legal_id:"123456789",vat_id:"FR00123456789",country_code:"FR"},buyer:{name:"Buyer",country_code:"FR"},lines:[{id:"1",name:"Service",quantity:1,unit_price_net:100,vat_category:"S",vat_rate_percent:20}]});
it("requires a supported seller tax identifier before standard-rate export",()=>{
  const inv=base();delete inv.seller.vat_id;expect(validateInvoiceForExport(inv).some(e=>e.field==="seller.vat_id")).toBe(true);expect(()=>buildFacturXCiiXml(inv)).toThrow();
});
it("requires an actual seller identifier even for exempt documents",()=>{
  const inv=base();delete inv.seller.vat_id;delete inv.seller.legal_id;inv.lines[0].vat_category="E";inv.lines[0].vat_rate_percent=0;inv.vat_exemption_reasons={E:"Issuer explanation"};expect(validateInvoiceForExport(inv).some(e=>e.rule==="BR-CO-26")).toBe(true);
});
it("supports a seller tax registration identifier without inventing a VAT number",()=>{
  const inv=base();delete inv.seller.vat_id;inv.seller.tax_id="TAX-TEST";inv.lines[0].vat_category="E";inv.lines[0].vat_rate_percent=0;inv.vat_exemption_reasons={E:"Exempt"};
  expect(validateInvoiceForExport(inv)).toEqual([]);const xml=buildFacturXCiiXml(inv);expect(xml).toContain('schemeID="FC">TAX-TEST</ram:ID>');expect(xml).not.toContain('schemeID="VA"');
  delete inv.seller.tax_id;expect(validateInvoiceForExport(inv).some(e=>e.field==="seller.vat_id")).toBe(true);
});
it("requires and preserves an explicit exempt reason in the VAT breakdown",()=>{
  const inv=base();inv.lines[0].vat_category="E";inv.lines[0].vat_rate_percent=0;
  expect(validateInvoiceForExport(inv).some(e=>e.rule==="BR-E-10")).toBe(true);
  inv.vat_exemption_reasons={E:"Motif légal saisi & vérifié"};expect(validateInvoiceForExport(inv)).toEqual([]);expect(buildFacturXCiiXml(inv)).toContain("<ram:ExemptionReason>Motif légal saisi &amp; vérifié</ram:ExemptionReason>");
});
it("requires the buyer identifier for reverse charge",()=>{
  const inv=base();inv.lines[0].vat_category="AE";inv.lines[0].vat_rate_percent=0;inv.vat_exemption_reasons={AE:"Reverse charge"};expect(validateInvoiceForExport(inv).some(e=>e.rule==="BR-AE-02")).toBe(true);inv.buyer.legal_id="BUYER-1";expect(validateInvoiceForExport(inv)).toEqual([]);
});
it("omits VAT rates and VAT identifiers for a valid outside-scope document",()=>{
  const inv=base();delete inv.seller.vat_id;inv.lines[0].vat_category="O";inv.lines[0].vat_rate_percent=0;inv.vat_exemption_reasons={O:"Not subject to VAT"};expect(validateInvoiceForExport(inv)).toEqual([]);const xml=buildFacturXCiiXml(inv);expect(xml).not.toContain("RateApplicablePercent");expect(xml).not.toContain('schemeID="VA"');
  inv.buyer.vat_id="FR00987654321";expect(validateInvoiceForExport(inv).some(e=>e.rule==="BR-O-02")).toBe(true);
});
it("rejects mixed outside-scope categories and unsupported intra-community delivery",()=>{
  const inv=base();inv.lines.push({...inv.lines[0],id:"2",vat_category:"O",vat_rate_percent:0});expect(validateInvoiceForExport(inv).some(e=>e.rule==="BR-O-11")).toBe(true);
  inv.lines=[{...inv.lines[0],vat_category:"K",vat_rate_percent:0}];expect(validateInvoiceForExport(inv).some(e=>e.rule==="EXPORT")).toBe(true);
});
it.each([null,[],{E:3},{E:"bad\u0000text"},{unknown:"reason"}])("rejects malformed reason data %j",reasons=>{
  expect(validateInvoiceForExport({...base(),vat_exemption_reasons:reasons}).length).toBeGreaterThan(0);
});
