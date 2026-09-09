import type { FacturXInvoice } from "./factur-x";
import { invoiceDate } from "./templates";
import type { RentalPayment } from "../rental-payments";
import type { RentalLot } from "../gestion-locative";

/** Prepare recorded rental amounts for review, without inferring VAT, country or invoice sequence. */
export function rentalInvoiceDraft(payment: RentalPayment, lot: RentalLot, userId: string, seller: { name: string; address?: string }, labels: { rent: string; charges: string }, now = new Date()): FacturXInvoice {
  if (!userId || payment.user_id !== userId || payment.lot_id !== lot.id) throw new Error("Rental payment owner or property mismatch");
  const { period_year: year, period_month: month } = payment;
  if (!Number.isInteger(year) || year < 1000 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) throw new Error("Invalid rental period");
  if ([payment.amount_rent, payment.amount_charges, payment.amount_total].some(n => typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1e9)) throw new Error("Invalid rental amounts");
  if (Math.round((payment.amount_rent + payment.amount_charges) * 100) !== Math.round(payment.amount_total * 100)) throw new Error("Inconsistent rental total");
  const period = `${year}-${String(month).padStart(2,"0")}`;
  return {
    profile: "BASIC", document_type: "380", invoice_number: "", issue_date: invoiceDate(now), due_date: `${period}-05`, currency: "EUR",
    seller: { name: seller.name, address_line1: seller.address, country_code: "" },
    buyer: { name: lot.tenantName ?? "", address_line1: lot.address, city: lot.commune, country_code: "" },
    lines: [
      { id:"1",name:`${labels.rent} ${period}`,quantity:1,unit_code:"MON",unit_price_net:payment.amount_rent,vat_category:"S",vat_rate_percent:NaN },
      ...(payment.amount_charges > 0 ? [{ id:"2",name:`${labels.charges} ${period}`,quantity:1,unit_code:"MON",unit_price_net:payment.amount_charges,vat_category:"S" as const,vat_rate_percent:NaN }] : []),
    ],
    notes: [],
  };
}
