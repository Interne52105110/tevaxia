export const HOUSEKEEPING_FIELDS = ["availableRooms", "checkoutRooms", "stayoverRooms", "checkoutMinutes", "stayoverMinutes", "publicMinutes", "paidHours", "productiveMinutes", "hourlyCost", "supervisors", "supervisorHours", "supervisorHourlyCost"] as const;
export type HousekeepingField = typeof HOUSEKEEPING_FIELDS[number];
export type HousekeepingPlan = Record<HousekeepingField, number> & { date: string; reference: string };
export function calculateHousekeeping(input: HousekeepingPlan) {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(input.date) || !Number.isFinite(Date.parse(input.date)) || new Date(input.date).toISOString().slice(0, 10) !== input.date || !input.reference.trim() || input.reference.length > 3000) throw new Error("reference");
  for (const k of HOUSEKEEPING_FIELDS) {
    const v = input[k], integer = ["availableRooms", "checkoutRooms", "stayoverRooms", "supervisors"].includes(k);
    if (!Number.isFinite(v) || v < 0 || v > 100000 || (integer ? !Number.isInteger(v) : Math.abs(v * 100 - Math.round(v * 100)) > .00001)) throw new Error("number");
  }
  if (input.checkoutRooms + input.stayoverRooms > input.availableRooms || input.paidHours > 24 || input.supervisorHours > 24 || input.productiveMinutes > input.paidHours * 60 + .000001) throw new Error("capacity");
  if (input.checkoutRooms > 0 && input.checkoutMinutes === 0 || input.stayoverRooms > 0 && input.stayoverMinutes === 0 || input.supervisors > 0 && input.supervisorHours === 0) throw new Error("time");
  const workload = input.checkoutRooms * Math.round(input.checkoutMinutes * 100) + input.stayoverRooms * Math.round(input.stayoverMinutes * 100) + Math.round(input.publicMinutes * 100);
  const capacity = Math.round(input.productiveMinutes * 100);
  if (workload > 0 && capacity === 0) throw new Error("capacity");
  const agents = workload === 0 ? 0 : Math.ceil(workload / capacity);
  if (agents > 100000) throw new Error("capacity");
  const cost = (count: number, hours: number, hourly: number) => Number((BigInt(count) * BigInt(Math.round(hours * 100)) * BigInt(Math.round(hourly * 100)) + 50n) / 100n);
  const agentCents = cost(agents, input.paidHours, input.hourlyCost);
  const supervisorCents = cost(input.supervisors, input.supervisorHours, input.supervisorHourlyCost);
  const totalCost = (agentCents + supervisorCents) / 100;
  const cleaned = input.checkoutRooms + input.stayoverRooms;
  return {
    workloadMinutes: workload / 100, workloadHours: workload / 6000, agents, supervisors: input.supervisors,
    agentCost: agentCents / 100, supervisorCost: supervisorCents / 100, totalCost,
    costPerCleanedRoom: cleaned > 0 ? totalCost / cleaned : null,
    costPerAvailableRoom: input.availableRooms > 0 ? totalCost / input.availableRooms : null,
    utilizationPct: agents > 0 ? workload / (agents * capacity) * 100 : null,
  };
}
export function housekeepingCsv(input: HousekeepingPlan) {
  const result = calculateHousekeeping(input);
  const escape = (v: unknown) => { let s = String(v ?? ""); if (/^[\s]*[=+@-]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; };
  const rows = [["date", input.date], ["reference", input.reference], ["scope", "Daily declared workload; no PMS import or invented weekly forecast; agents rounded up to complete shifts; supervisors entered separately; employer costs in EUR; breaks/nonproductive time excluded from productive minutes; not an employment-law or staffing certification"],
    ["input", "value", "unit"], ...HOUSEKEEPING_FIELDS.map(k => [k, input[k], k.includes("Hours") ? "hours" : k.includes("Minutes") ? "minutes" : k.includes("Cost") ? "EUR/hour employer cost" : "count"]),
    ["result", "value"], ...Object.entries(result).map(([k, v]) => [k, v === null ? "unknown" : v])];
  return "\uFEFF" + rows.map(r => r.map(escape).join(";")).join("\r\n");
}
