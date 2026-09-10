import { invoiceDate } from "../facturation/templates";
export const PMS_SOURCES = ["mews", "cloudbeds", "opera", "protel", "generic"] as const;
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const numeric = (v: unknown, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
export interface PmsImportRow { hotel_id: string; metric_date: string; occupancy: number; adr: number | null; revpar: number; source: "pms_sync"; notes: string }

/** Complete observations only: invalid or partial batches never reach an upsert. */
export function parsePmsImport(value: unknown, now = new Date()): { hotelId: string; source: string; rows: PmsImportRow[] } {
  if (!object(value)) throw new RangeError("Object payload required");
  const hotelId = value.hotel_id;
  if (typeof hotelId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hotelId)) throw new RangeError("Valid hotel UUID required");
  const source = value.source === undefined ? "generic" : value.source;
  if (typeof source !== "string" || !PMS_SOURCES.some(s => s === source)) throw new RangeError("Unsupported PMS source");
  if (value.currency !== undefined && value.currency !== "EUR") throw new RangeError("Only EUR metrics are supported");
  const unit = value.occupancy_unit === undefined ? "ratio" : value.occupancy_unit;
  if (unit !== "ratio" && unit !== "percent") throw new RangeError("occupancy_unit must be ratio or percent");
  if (!Array.isArray(value.metrics) || value.metrics.length < 1 || value.metrics.length > 366) throw new RangeError("Provide 1 to 366 complete metrics");
  const dates = new Set<string>(), today = invoiceDate(now);
  const rows = value.metrics.map((metric, index): PmsImportRow => {
    const fail = (message: string): never => { throw new RangeError(`metrics[${index}]: ${message}`); };
    if (!object(metric)) return fail("Object required");
    const date = metric.date;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2000-01-01" || date > today || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || dates.has(date)) return fail("Unique real observation date between 2000-01-01 and today required");
    dates.add(date);
    let occupancy: number | undefined;
    if (metric.occupancy !== undefined) {
      if (!numeric(metric.occupancy, unit === "ratio" ? 1 : 100)) return fail("Invalid occupancy for the declared unit");
      occupancy = unit === "percent" ? metric.occupancy / 100 : metric.occupancy;
    }
    if (metric.rooms_sold !== undefined || metric.rooms_available !== undefined) {
      if (!numeric(metric.rooms_sold, 1e6) || !Number.isInteger(metric.rooms_sold) || !numeric(metric.rooms_available, 1e6) || !Number.isInteger(metric.rooms_available) || metric.rooms_available <= 0 || metric.rooms_sold > metric.rooms_available) return fail("Valid sold/available room counts required");
      const fromRooms = metric.rooms_sold / metric.rooms_available;
      if (occupancy !== undefined && Math.abs(occupancy - fromRooms) > 0.0001) return fail("Occupancy disagrees with room counts");
      occupancy = fromRooms;
    }
    if (occupancy === undefined) return fail("Occupancy or both room counts required");
    const adr = metric.adr;
    if (!(numeric(adr, 1e6) || (adr === null && occupancy === 0))) return fail("ADR required; null is allowed only with zero occupancy");
    if (occupancy === 0 && adr !== null && adr !== 0) return fail("ADR must be zero or null with no rooms sold");
    const revpar = occupancy * (adr ?? 0);
    if (metric.revpar !== undefined && (!numeric(metric.revpar, 1e6) || Math.abs(metric.revpar - revpar) > 0.02)) return fail("RevPAR must agree with occupancy × ADR within EUR 0.02");
    return { hotel_id: hotelId, metric_date: date, occupancy, adr, revpar, source: "pms_sync", notes: `PMS: ${source}` };
  });
  return { hotelId, source, rows };
}
