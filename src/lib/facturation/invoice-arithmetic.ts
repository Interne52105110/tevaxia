import type { FacturXLine } from "./factur-x";
type Decimal = { n: bigint; d: bigint };
function decimal(value: number): Decimal {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError("Finite invoice amount required");
  const [mantissa, exponent = "0"] = String(value).toLowerCase().split("e");
  const [whole, fraction = ""] = mantissa.replace(/^-/, "").split(".");
  const places = fraction.length - Number(exponent);
  const n = BigInt(whole + fraction) * (value < 0 ? -1n : 1n);
  return places >= 0 ? { n, d: 10n ** BigInt(places) } : { n: n * 10n ** BigInt(-places), d: 1n };
}
function round(n: bigint, d: bigint): bigint { return n < 0n ? -((-n * 2n + d) / (2n * d)) : (n * 2n + d) / (2n * d); }
function decimalText({ n, d }: Decimal): string {
  const sign = n < 0n ? "-" : "", value = n < 0n ? -n : n;
  const fraction = String(value % d).padStart(String(d).length - 1, "0").replace(/0+$/, "");
  return sign + String(value / d) + (fraction ? "." + fraction : "");
}
export function invoiceDecimalText(value: number): string { return decimalText(decimal(value)); }
export function invoiceDiscountedUnitPrice(line: FacturXLine): string {
  const p = decimal(line.unit_price_net), discount = decimal(line.discount_percent ?? 0);
  return decimalText({ n: p.n * (100n * discount.d - discount.n), d: p.d * discount.d * 100n });
}
export function invoiceAmount(cents: bigint): number {
  // Keep binary Number conversion far below the point where one cent is no longer representable.
  if (cents > 999999999999n || cents < -999999999999n) throw new RangeError("Invoice total exceeds 9,999,999,999.99");
  return Number(cents) / 100;
}
/** Decimal inputs; round the discounted line once, then sum its integer cents. */
export function invoiceLineCents(line: FacturXLine): bigint {
  const q = decimal(line.quantity), p = decimal(line.unit_price_net), discount = decimal(line.discount_percent ?? 0);
  return round(q.n * p.n * (100n * discount.d - discount.n), q.d * p.d * discount.d);
}
export function invoiceVatCents(base: bigint, rate: number): bigint {
  const r = decimal(rate);
  return round(base * r.n, 100n * r.d);
}
export function invoiceLineAmount(line: FacturXLine): number { return invoiceAmount(invoiceLineCents(line)); }
