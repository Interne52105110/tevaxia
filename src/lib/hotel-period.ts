import type { HotelPeriod } from "./hotels";

export const periodFields = {
  occupancy: "occupancyRate", adr: "adrLabel", revenue_rooms: "revenueRooms",
  revenue_fb: "revenueFb", revenue_mice: "revenueMice", revenue_other: "revenueOther",
  staff_cost: "staffCost", energy_cost: "energyCost", other_opex: "otherOpex",
  gop: "gopLabel", ebitda: "ebitdaLabel", ffe_reserve: "ffeLabel",
  compset_revpar: "compsetRevpar", mpi: "mpiCompset", ari: "ariCompset", rgi: "rgiCompset",
} as const;
export type PeriodField = keyof typeof periodFields;
export type PeriodInput = Omit<HotelPeriod, "id" | "created_at" | "updated_at" | "created_by"> & { id?: string };
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
const cents = (n: number) => Math.round(n * 100);

/** Only explicit source amounts are accepted; a blank never implies zero. */
export function prepareHotelPeriod(draft: Partial<HotelPeriod>, hotelId: string, id?: string): PeriodInput {
  const start = draft.period_start ?? "", end = draft.period_end ?? "";
  const days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
  if (!hotelId || !validDate(start) || !validDate(end) || days < 1 || days > 366) throw new Error("periodDates");
  if (!draft.notes?.trim() || draft.notes.length > 3000 || (draft.period_label?.length ?? 0) > 160) throw new Error("periodReference");
  const values = {} as Record<PeriodField, number | null>;
  for (const field of Object.keys(periodFields) as PeriodField[]) {
    const n = draft[field] ?? null;
    const signed = field === "gop" || field === "ebitda";
    const precision = field === "occupancy" || ["mpi", "ari", "rgi"].includes(field) ? 10000 : 100;
    if (n !== null && (typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > 1e9 || (!signed && n < 0) || (field === "occupancy" && n > 1) || Math.abs(n * precision - Math.round(n * precision)) > 0.00001)) throw new Error("periodNumbers");
    values[field] = n;
  }
  const revenues = [values.revenue_rooms, values.revenue_fb, values.revenue_mice, values.revenue_other];
  const total = revenues.every(n => n !== null) ? revenues.reduce<number>((s, n) => s + cents(n!), 0) / 100 : null;
  return {
    id, hotel_id: hotelId, period_start: start, period_end: end,
    period_label: draft.period_label?.trim() || null, notes: draft.notes.trim(), ...values,
    revenue_total: total,
    revpar: values.adr !== null && values.occupancy !== null ? Math.round((values.adr * values.occupancy + Number.EPSILON) * 100) / 100 : null,
    gop_margin: total !== null && total > 0 && values.gop !== null ? values.gop / total : null,
    ebitda_margin: total !== null && total > 0 && values.ebitda !== null ? values.ebitda / total : null,
  };
}
