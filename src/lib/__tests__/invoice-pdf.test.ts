import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { generateFacturXPdf } from "../facturation/factur-x-pdf";
import { buildFacturXCiiXml, type FacturXInvoice } from "../facturation/factur-x";
const invoice = (): FacturXInvoice => ({profile:"BASIC",document_type:"381",invoice_number:"QA-Référence & test",issue_date:"2026-09-10",currency:"EUR",seller:{name:"Société Müller",vat_id:"FR00123456789",country_code:"FR"},buyer:{name:"Client Noël",country_code:"FR"},lines:[{id:"1",name:"Service",quantity:1,unit_price_net:100,vat_category:"S",vat_rate_percent:20}]});
describe("invoice PDF rendering",()=>{
  it("preserves a payment reference and terms even without a due date",()=>{
    const inv=invoice();inv.payment_reference="PAY & REF";inv.payment_terms="On receipt";
    const xml=buildFacturXCiiXml(inv);
    expect(xml).toContain("<ram:PaymentReference>PAY &amp; REF</ram:PaymentReference>");expect(xml).toContain("<ram:Description>On receipt</ram:Description>");
  });
  it("paginates long content and writes localized document titles with valid UTF-8 XMP",async()=>{
    const inv=invoice();inv.lines=Array.from({length:12},(_,i)=>({...inv.lines[0],id:String(i+1),description:"Long description with details and accents éèä. ".repeat(20)}));
    const artifact=await generateFacturXPdf(inv,{locale:"en"});
    const pdf=await PDFDocument.load(artifact.pdfBytes,{updateMetadata:false});
    expect(pdf.getPageCount()).toBeGreaterThan(1);expect(pdf.getTitle()).toBe("Credit note QA-Référence & test");expect(pdf.getAuthor()).toBe("Société Müller");
    const metadata=pdf.context.lookup(pdf.catalog.get(PDFName.of("Metadata")));
    if (!(metadata instanceof PDFRawStream)) throw new Error("Missing PDF metadata stream");
    const xml=new TextDecoder("utf-8",{fatal:true}).decode(metadata.getContents());
    expect(xml).toContain("Credit note QA-Référence &amp; test");expect(xml).toContain("Société Müller");
    expect(artifact.xml).toContain("Long description with details and accents éèä.");
  },15000);
  it("rejects a glyph that cannot be rendered rather than silently dropping it",async()=>{
    const inv=invoice();inv.buyer.name="Unsupported 🏠";
    await expect(generateFacturXPdf(inv)).rejects.toThrow("Unsupported PDF character");
  });
  it("uses the corrected-invoice title for the German document",async()=>{
    const inv=invoice();inv.document_type="384";
    const pdf=await PDFDocument.load((await generateFacturXPdf(inv,{locale:"de"})).pdfBytes);
    expect(pdf.getTitle()).toBe("Berichtigte Rechnung QA-Référence & test");
  });
});
