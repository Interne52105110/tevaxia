import { supabase } from "../supabase";

export const JOURNAL_LABEL_KEYS = ["title", "description", "scope", "inventoryScope", "loading", "signIn", "error", "retry", "month", "download", "downloading", "downloadError", "journal", "category", "count", "ht", "vat", "gross", "operating", "taxes", "total", "empty", "inventory", "coverage", "closedDays", "available", "occupied", "occupancy", "date", "closed", "open", "unknown", "back", "taxSource", "pdfScope", ...["room", "taxe_sejour", "extra_bed", "breakfast", "lunch", "dinner", "bar", "minibar", "room_service", "meeting_room", "parking", "laundry", "spa", "phone", "internet", "transport", "cancellation_fee", "damage", "other"].map(key => `cat_${key}`)];

export type JournalCharge = { id: string; category: string; line_ht: number | string; line_tva: number | string; line_ttc: number | string; posted_at: string; voided: boolean };
export type JournalAudit = { audit_date: string; total_rooms: number; occupied_rooms: number; closed: boolean };
export type JournalRow = { category: string; ht: number; vat: number; gross: number; count: number };
export type MonthlyJournal = {
  propertyId: string; propertyName: string; start: string; end: string; nextStart: string; days: number;
  rows: JournalRow[]; operating: JournalRow; taxes: JournalRow; total: JournalRow;
  recordedDays: number; closedDays: number; available: number; occupied: number; occupancy: number | null;
  audits: JournalAudit[];
};

export function journalPeriod(year: number, month: number) {
  if (!Number.isInteger(year) || year < 1900 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) throw new Error("Invalid period");
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = new Date(Date.UTC(year, month, 1));
  const last = new Date(next.getTime() - 86400000);
  return { start, end: last.toISOString().slice(0, 10), nextStart: next.toISOString().slice(0, 10), days: last.getUTCDate() };
}

function cents(value: number | string): bigint {
  if ((typeof value !== "number" && typeof value !== "string") || !/^-?\d+(\.\d{1,2})?$/.test(String(value))) throw new Error("Invalid recorded amount");
  const [whole, fraction = ""] = String(value).replace(/^-/, "").split(".");
  return (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))) * (String(value).startsWith("-") ? -1n : 1n);
}
function amount(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(-Number.MAX_SAFE_INTEGER)) throw new Error("Report amount too large");
  return Number(value) / 100;
}

/** A posting journal, not a stay-date P&L. Daily inventory remains a separate sample. */
export function aggregateMonthlyJournal(propertyId: string, propertyName: string, year: number, month: number, charges: JournalCharge[], audits: JournalAudit[]): MonthlyJournal {
  const period = journalPeriod(year, month);
  const map = new Map<string, { ht: bigint; vat: bigint; gross: bigint; count: number }>();
  const ids = new Set<string>();
  for (const c of charges) {
    if (!c.id || ids.has(c.id)) throw new Error("Duplicate charge");
    ids.add(c.id);
    const date = Date.parse(c.posted_at);
    if (!Number.isFinite(date) || !/(Z|[+-]\d{2}:\d{2})$/.test(c.posted_at)) throw new Error("Invalid posting date");
    if (date < Date.parse(period.start + "T00:00:00Z") || date >= Date.parse(period.nextStart + "T00:00:00Z")) continue;
    if (typeof c.voided !== "boolean") throw new Error("Invalid void status");
    if (c.voided) continue;
    if (typeof c.category !== "string" || !c.category.trim()) throw new Error("Missing category");
    const ht = cents(c.line_ht), vat = cents(c.line_tva), gross = cents(c.line_ttc);
    if (ht + vat !== gross) throw new Error("Unbalanced charge");
    const row = map.get(c.category) ?? { ht: 0n, vat: 0n, gross: 0n, count: 0 };
    row.ht += ht; row.vat += vat; row.gross += gross; row.count++;
    map.set(c.category, row);
  }
  const rows = [...map].sort(([a], [b]) => a.localeCompare(b)).map(([category, r]) => ({ category, ht: amount(r.ht), vat: amount(r.vat), gross: amount(r.gross), count: r.count }));
  function total(category: string, include: (key: string) => boolean): JournalRow {
    let ht = 0n, vat = 0n, gross = 0n, count = 0;
    for (const [key, r] of map) if (include(key)) { ht += r.ht; vat += r.vat; gross += r.gross; count += r.count; }
    return { category, ht: amount(ht), vat: amount(vat), gross: amount(gross), count };
  }
  const dates = new Set<string>();
  let available = 0, occupied = 0, closedDays = 0;
  for (const a of audits) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.audit_date) || a.audit_date < period.start || a.audit_date > period.end || dates.has(a.audit_date)) throw new Error("Invalid or duplicate audit date");
    if (!Number.isSafeInteger(a.total_rooms) || !Number.isSafeInteger(a.occupied_rooms) || a.total_rooms < 0 || a.occupied_rooms < 0 || a.occupied_rooms > a.total_rooms || a.total_rooms > 1000000 || typeof a.closed !== "boolean") throw new Error("Invalid recorded inventory");
    dates.add(a.audit_date); available += a.total_rooms; occupied += a.occupied_rooms;
    if (a.closed) closedDays++;
  }
  return { propertyId, propertyName, ...period, rows, operating: total("operating", key => key !== "taxe_sejour"), taxes: total("taxes", key => key === "taxe_sejour"), total: total("total", () => true), recordedDays: dates.size, closedDays, available, occupied, occupancy: available > 0 ? Math.round(occupied / available * 10000) / 100 : null, audits: [...audits].sort((a, b) => a.audit_date.localeCompare(b.audit_date)) };
}

export async function loadMonthlyJournal(userId: string, propertyId: string, year: number, month: number): Promise<MonthlyJournal> {
  const period = journalPeriod(year, month);
  const client = supabase;
  if (!client) throw new Error("Service unavailable");
  async function checkIdentity() {
    const { data, error } = await client!.auth.getUser();
    if (error || !data.user || data.user.id !== userId) throw new Error("Authentication changed");
  }
  await checkIdentity();
  const prop = await client.from("pms_properties").select("id, name").eq("id", propertyId).eq("user_id", userId).single();
  if (prop.error || !prop.data) throw new Error("Property unavailable");
  const auditResult = await client.from("pms_night_audits").select("audit_date, total_rooms, occupied_rooms, closed", { count: "exact" }).eq("property_id", propertyId).gte("audit_date", period.start).lte("audit_date", period.end).order("audit_date").range(0, 31);
  if (auditResult.error) throw auditResult.error;
  if (auditResult.count == null || auditResult.count !== auditResult.data?.length) throw new Error("Incomplete audit read");
  const charges: JournalCharge[] = [];
  let expected: number | null = null;
  // Count checks and duplicate detection refuse a truncated or shifting page set.
  // This remains a read of live records, not a transactional accounting close.
  for (let offset = 0; ; offset += 500) {
    const result = await client.from("pms_folio_charges")
      .select("id, category, line_ht, line_tva, line_ttc, posted_at, voided, pms_folios!inner(property_id)", { count: "exact" })
      .eq("pms_folios.property_id", propertyId).eq("voided", false)
      .gte("posted_at", period.start + "T00:00:00Z").lt("posted_at", period.nextStart + "T00:00:00Z")
      .order("id").range(offset, offset + 499);
    if (result.error) throw result.error;
    if (result.count == null || result.count > 200000 || (expected !== null && expected !== result.count)) throw new Error("Incomplete or changing journal");
    expected = result.count;
    const page = result.data ?? [];
    charges.push(...page as JournalCharge[]);
    if (charges.length === expected) break;
    if (page.length !== 500 || charges.length > expected) throw new Error("Incomplete journal read");
  }
  await checkIdentity();
  return aggregateMonthlyJournal(propertyId, prop.data.name, year, month, charges, auditResult.data as JournalAudit[]);
}
