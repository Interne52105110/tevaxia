import type { PmsChargeCategory } from "./types";
export const CHARGE_CATEGORIES: PmsChargeCategory[] = ["room", "taxe_sejour", "extra_bed", "breakfast", "lunch", "dinner", "bar", "minibar", "room_service", "meeting_room", "parking", "laundry", "spa", "phone", "internet", "transport", "cancellation_fee", "damage", "other"];
export type ChargeDraft = { category: PmsChargeCategory; description: string; quantity: string; unit_price_ht: string; tva_rate: string; notes: string };
function hundredths(text: string, maximum: bigint): bigint {
  if (!/^\d+(\.\d{1,2})?$/.test(text.trim())) throw new Error("Required decimal with at most two places");
  const [whole, fraction = ""] = text.trim().split(".");
  const value = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (value > maximum) throw new Error("Amount exceeds database precision");
  return value;
}
/** Same order of cent rounding as pms_folio_charge_calc; no category implies a tax rate. */
export function prepareCharge(draft: ChargeDraft) {
  const description = draft.description.trim(), notes = draft.notes.trim();
  if (!CHARGE_CATEGORIES.includes(draft.category) || !description || description.length > 500 || !notes || notes.length > 2000) throw new Error("Description and price/tax reference required");
  const quantity = hundredths(draft.quantity, 99999999n), price = hundredths(draft.unit_price_ht, 9999999999n), rate = hundredths(draft.tva_rate, 9999n);
  if (quantity === 0n) throw new Error("Positive quantity required");
  const ht = (quantity * price + 50n) / 100n;
  const vat = (ht * rate + 5000n) / 10000n;
  const gross = ht + vat;
  if (gross > 999999999999n) throw new Error("Line exceeds database precision");
  return { category: draft.category, description, notes, quantity: Number(quantity) / 100, unit_price_ht: Number(price) / 100, tva_rate: Number(rate) / 100, ht: Number(ht) / 100, vat: Number(vat) / 100, gross: Number(gross) / 100 };
}
