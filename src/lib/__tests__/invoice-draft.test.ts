import { expect, it } from "vitest";
import { invoiceDraftKey, parseInvoiceDraft } from "../facturation/draft";
const draft = { profile:"BASIC",document_type:"380",invoice_number:"",issue_date:"",currency:"EUR",seller:{name:"",country_code:"LU"},buyer:{name:"",country_code:"LU"},lines:[{id:"1",name:"",quantity:1,unit_price_net:null,vat_category:"S",vat_rate_percent:17}],notes:[] };
it("separates named users from each other and anonymous drafts", () => {
  expect(new Set([null,"guest","alice","bob","user:alice"].map(invoiceDraftKey)).size).toBe(5);
});
it("restores incomplete editable data and a blank price without converting it to zero", () => {
  const parsed=parseInvoiceDraft(JSON.stringify(draft));
  expect(parsed.seller.name).toBe(""); expect(Number.isNaN(parsed.lines[0].unit_price_net)).toBe(true);
});
it.each([null,[],{}, {...draft,seller:null},{...draft,lines:[null]},{...draft,notes:[{}]},{...draft,lines:[{...draft.lines[0],quantity:"2"}]}])("rejects malformed draft structures before the form reads them", value => {
  expect(()=>parseInvoiceDraft(JSON.stringify(value))).toThrow();
});
