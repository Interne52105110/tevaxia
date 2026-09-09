import { describe, expect, it } from "vitest";
import { computeTotals, buildFacturXCiiXml, type FacturXInvoice, type FacturXLine } from "../facturation/factur-x";
import { invoiceLineAmount, invoiceDecimalText, invoiceDiscountedUnitPrice } from "../facturation/invoice-arithmetic";
const line = (price: number, quantity=1, discount=0): FacturXLine => ({ id:"1",name:"Test",quantity,unit_price_net:price,discount_percent:discount,vat_category:"S",vat_rate_percent:20 });
const invoice = (lines: FacturXLine[]): FacturXInvoice => ({ profile:"BASIC", document_type:"380", invoice_number:"TEST",issue_date:"2026-09-10",currency:"EUR",seller:{name:"Seller",vat_id:"LU12345678",country_code:"LU"},buyer:{name:"Buyer",country_code:"LU"},lines });
describe("decimal invoice arithmetic",()=>{
  it.each([[1.005,1.01],[2.675,2.68],[1.0049,1],[0.005,0.01]])("rounds a line of %s to %s",(input,output)=>expect(invoiceLineAmount(line(input))).toBe(output));
  it("sums already rounded lines and rounds VAT once per category/rate",()=>{
    const total=computeTotals(invoice([line(1.005),line(0.335,2,10),line(0.2,0.1)]));
    expect(total.line_total).toBe(1.63);expect(total.vat_total).toBe(0.33);expect(total.grand_total).toBe(1.96);
  });
  it("does not leave floating point residues when summing cents",()=>expect(computeTotals(invoice([line(0.1),line(0.1),line(0.1)])).line_total).toBe(0.3));
  it("keeps separate rate and category bases including zero tax",()=>{
    const inv=invoice([line(0.05),{...line(0.05),vat_rate_percent:10},{...line(0.1),vat_category:"E",vat_rate_percent:0}]);
    const result=computeTotals(inv);expect(result.vat_breakdown).toHaveLength(3);expect(result.line_total).toBe(0.2);expect(result.vat_total).toBe(0.02);expect(result.grand_total).toBe(0.22);
  });
  it("serializes quantity and discounted XML unit price without silent precision loss",()=>{
    const l=line(0.335,2,10),xml=buildFacturXCiiXml(invoice([l]));
    expect(invoiceDiscountedUnitPrice(l)).toBe("0.3015");expect(xml).toContain("<ram:ChargeAmount>0.3015</ram:ChargeAmount>");expect(xml).toContain("<ram:LineTotalAmount>0.60</ram:LineTotalAmount>");
    expect(buildFacturXCiiXml(invoice([line(1,0.123456)]))).toContain('unitCode="C62">0.123456</ram:BilledQuantity>');
  });
  it("handles scientific notation and zero discounts",()=>{
    expect(invoiceDecimalText(1e-7)).toBe("0.0000001");expect(invoiceDecimalText(1e21)).toBe("1000000000000000000000");
    expect(invoiceDiscountedUnitPrice(line(10,1,100))).toBe("0");expect(invoiceLineAmount(line(10,1,100))).toBe(0);
  });
  it("rejects missing/non-finite numeric inputs and unsafe cent totals",()=>{
    for(const value of [NaN,Infinity,undefined]) expect(()=>invoiceLineAmount(line(value as number))).toThrow(RangeError);
    expect(()=>computeTotals(invoice([line(1e9,1e9)]))).toThrow(RangeError);
  });
});
