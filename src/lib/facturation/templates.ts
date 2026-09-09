import type { FacturXInvoice, FacturXLine } from "./factur-x";
export type TemplateId = "generic" | "landlord" | "syndic" | "hotel" | "lease" | "valuer";

export function invoiceDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Luxembourg", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addInvoiceDays(date: string, days: number): string {
  const next = new Date(date + "T12:00:00Z"); next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}
export function blankInvoiceLine(): FacturXLine {
  return { id: "", name: "", quantity: 1, unit_code: "C62", unit_price_net: NaN, vat_category: "S", vat_rate_percent: NaN };
}
/** A template supplies editable labels only, never a tax conclusion or professional qualification. */
export function applyInvoiceTemplate(template: TemplateId, current: FacturXInvoice, label: (key: string) => string): FacturXInvoice {
  if (template === "generic") return current;
  const keys = template === "hotel" ? ["night", "breakfast"] : template === "lease" ? ["rent", "charges"] : [template === "landlord" ? "rent" : template === "syndic" ? "management" : "valuation"];
  return { ...current, lines: keys.map((key, index) => ({ ...blankInvoiceLine(), id: String(index + 1), name: label(key), unit_code: key === "night" ? "DAY" : key === "rent" ? "MON" : "C62" })), notes: [] };
}
