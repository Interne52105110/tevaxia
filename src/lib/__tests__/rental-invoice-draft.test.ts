import { expect, it } from "vitest";
import { rentalInvoiceDraft } from "../facturation/rental-draft";
import type { RentalPayment } from "../rental-payments";
import type { RentalLot } from "../gestion-locative";
const payment = { user_id:"u",lot_id:"lot",period_year:2026,period_month:2,amount_rent:1000,amount_charges:150,amount_total:1150 } as RentalPayment;
const lot = { id:"lot",tenantName:"Tenant",address:"Property address",commune:"City" } as RentalLot;
const build = (p=payment) => rentalInvoiceDraft(p,lot,"u",{name:"Seller"},{rent:"Rent",charges:"Charges"},new Date("2026-09-09T22:30:00Z"));
it("uses the payment period and entered amounts without backdating or inventing tax data", () => {
  const inv=build();expect(inv.issue_date).toBe("2026-09-10");expect(inv.due_date).toBe("2026-02-05");
  expect(inv.invoice_number).toBe("");expect(inv.seller.country_code).toBe("");expect(inv.buyer.country_code).toBe("");
  expect(inv.notes).toEqual([]);expect(inv.lines.map(l=>l.name)).toEqual(["Rent 2026-02","Charges 2026-02"]);
  expect(inv.lines.map(l=>l.unit_price_net)).toEqual([1000,150]);expect(inv.lines.every(l=>Number.isNaN(l.vat_rate_percent))).toBe(true);
});
it.each([{user_id:"other"},{lot_id:"other"},{period_month:13},{period_year:NaN},{amount_rent:-1},{amount_charges:NaN},{amount_total:1149}])("rejects a mismatched or invalid payment %j", patch => {
  expect(()=>build({...payment,...patch})).toThrow();
});
it("does not invent a tenant name or add zero charges", () => {
  const inv=rentalInvoiceDraft({...payment,amount_charges:0,amount_total:1000},{...lot,tenantName:undefined},"u",{name:""},{rent:"Rent",charges:"Charges"});
  expect(inv.buyer.name).toBe("");expect(inv.seller.name).toBe("");expect(inv.lines).toHaveLength(1);
});
