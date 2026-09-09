export const MICE_FIELDS = ["groups", "roomNights", "roomRate", "fbUnits", "fbRate", "meetingDays", "meetingRate", "roomCost", "fbCost", "meetingCost", "fixedCost", "availableNights", "availableMeetingDays"] as const;
export type MiceField = typeof MICE_FIELDS[number];
export type MiceBudget = Record<MiceField, number> & { start: string; end: string; reference: string };
const quantities = new Set<MiceField>(["groups", "roomNights", "fbUnits", "meetingDays", "availableNights", "availableMeetingDays"]);
function date(s: string) { const n = Date.parse(s + "T00:00:00Z"); if (!/^20\d{2}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== s) throw new RangeError("Invalid date"); return n; }
export function calculateMiceBudget(input: MiceBudget) {
  const days = (date(input.end) - date(input.start)) / 86400000 + 1;
  if (days < 1 || days > 366 || typeof input.reference !== "string" || !input.reference.trim() || input.reference.length > 3000) throw new RangeError("Document the period and assumptions");
  const scaled = {} as Record<MiceField, bigint>;
  for (const key of MICE_FIELDS) {
    const n = input[key], scale = quantities.has(key) ? 10000 : 100;
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1e7 || Math.abs(n * scale - Math.round(n * scale)) > 0.00001) throw new RangeError("Invalid input");
    scaled[key] = BigInt(Math.round(n * scale));
  }
  const round = (n: bigint, d: bigint) => { const cents = (n + d / 2n) / d; if (cents > 100000000000n) throw new RangeError("Out of scope"); return Number(cents); };
  const revenue = (q: MiceField, price: MiceField) => round(scaled.groups * scaled[q] * scaled[price], 100000000n);
  const cost = (key: MiceField) => round(scaled.groups * scaled[key], 10000n);
  const occupiedNights = scaled.groups * scaled.roomNights, usedMeetingDays = scaled.groups * scaled.meetingDays;
  if (occupiedNights > scaled.availableNights * 10000n || usedMeetingDays > scaled.availableMeetingDays * 10000n) throw new RangeError("Declared capacity exceeded");
  const rooms = revenue("roomNights", "roomRate"), fb = revenue("fbUnits", "fbRate"), meetings = revenue("meetingDays", "meetingRate");
  const directCosts = cost("roomCost") + cost("fbCost") + cost("meetingCost"), fixedCosts = Number(scaled.fixedCost);
  const total = rooms + fb + meetings, contribution = total - directCosts - fixedCosts;
  return { days, occupiedNights: Number(occupiedNights) / 1e8, usedMeetingDays: Number(usedMeetingDays) / 1e8, rooms: rooms / 100, fb: fb / 100, meetings: meetings / 100, revenue: total / 100, directCosts: directCosts / 100, fixedCosts: fixedCosts / 100, contribution: contribution / 100, marginPct: total === 0 ? null : contribution / total * 100 };
}
export function miceBudgetCsv(input: MiceBudget) {
  const result = calculateMiceBudget(input);
  const rows: unknown[][] = [["section", "field", "value", "unit"], ["scope", "start", input.start, "date"], ["scope", "end", input.end, "date"], ["scope", "reference", input.reference, "text"]];
  const units: Record<MiceField, string> = { groups: "expected_groups_per_period", roomNights: "room_nights_per_group", roomRate: "EUR_per_room_night", fbUnits: "fb_units_per_group", fbRate: "EUR_per_fb_unit", meetingDays: "room_days_per_group", meetingRate: "EUR_per_room_day", roomCost: "EUR_per_group", fbCost: "EUR_per_group", meetingCost: "EUR_per_group", fixedCost: "EUR_per_period", availableNights: "room_nights_per_period", availableMeetingDays: "room_days_per_period" };
  for (const key of MICE_FIELDS) rows.push(["input", key, input[key], units[key]]);
  for (const [key, value] of Object.entries(result)) rows.push(["result", key, value ?? "", key === "days" ? "days" : key === "occupiedNights" ? "room_nights" : key === "usedMeetingDays" ? "room_days" : key === "marginPct" ? "percent" : "EUR"]);
  return "\uFEFF" + rows.map(row => row.map(v => '"' + (typeof v === "string" && /^[=+@\t\r-]/.test(v) ? "'" + v : String(v)).replace(/"/g, '""') + '"').join(";")).join("\r\n");
}
