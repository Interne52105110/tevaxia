export type LatePayment = {
  debtor: "business" | "consumer" | "public";
  invoice: string; principal: number; fees: number; reference: string;
  periods: { start: string; end: string; rate: number; reference: string }[];
};
export const LATE_PAYMENT_SOURCES = [
  "https://guichet.public.lu/fr/entreprises/gestion-juridique-comptabilite/facturation/encaissement/interets-retard.html",
  "https://mj.gouvernement.lu/fr/service-citoyens/taux-interet-legal.html",
] as const;
const validDate = (s: string) => /^20\d{2}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
const validNumber = (n: number, max: number, precision: number) => Number.isFinite(n) && n >= 0 && n <= max && Math.abs(n * precision - Math.round(n * precision)) < 0.00001;
const halfYear = (s: string) => s.slice(0, 4) + (Number(s.slice(5, 7)) <= 6 ? "H1" : "H2");
export function calculateLatePayment(input: LatePayment) {
  if (!["business", "consumer", "public"].includes(input.debtor) || !input.invoice.trim() || input.invoice.length > 160 || !input.reference.trim() || input.reference.length > 3000) throw new Error("reference");
  if (!validNumber(input.principal, 1e9, 100) || !validNumber(input.fees, 1e9, 100)) throw new Error("amount");
  if (!Array.isArray(input.periods) || !input.periods.length || input.periods.length > 120) throw new Error("period");
  const principalCents = BigInt(Math.round(input.principal * 100));
  const rows = input.periods.map((p, index) => {
    if (!validDate(p.start) || !validDate(p.end) || p.end < p.start || !validNumber(p.rate, 100, 10000) || !p.reference.trim() || p.reference.length > 1500) throw new Error("period");
    if (halfYear(p.start) !== halfYear(p.end)) throw new Error("split");
    if (index && Date.parse(p.start) - Date.parse(input.periods[index - 1].end) !== 86400000) throw new Error("continuity");
    const days = (Date.parse(p.end) - Date.parse(p.start)) / 86400000 + 1;
    const numerator = principalCents * BigInt(Math.round(p.rate * 10000)) * BigInt(days);
    const denominator = 365n * 100n * 10000n;
    const interestCents = (numerator + denominator / 2n) / denominator;
    return { ...p, days, interest: Number(interestCents) / 100 };
  });
  const interestCents = rows.reduce((sum, row) => sum + Math.round(row.interest * 100), 0);
  return { rows, days: rows.reduce((sum, r) => sum + r.days, 0), interest: interestCents / 100, total: (Number(principalCents) + interestCents + Math.round(input.fees * 100)) / 100 };
}
export function latePaymentCsv(input: LatePayment) {
  const result = calculateLatePayment(input);
  const escape = (value: unknown) => { let s = String(value ?? ""); if (/^[\s]*[=+@-]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; };
  const rows = [
    ["invoice", input.invoice], ["debtor_type", input.debtor], ["principal_EUR", input.principal], ["fees_EUR_declared", input.fees], ["reference", input.reference],
    ["scope", "One invoice; unchanged principal; simple interest ACT/365; first and last days included; rounded per segment; fees entered once; legal entitlement and recoverability not established"],
    ["start_inclusive", "end_inclusive", "annual_rate_percent", "days", "interest_EUR", "rate_and_date_reference"],
    ...result.rows.map(r => [r.start, r.end, r.rate, r.days, r.interest, r.reference]),
    ["interest_EUR", result.interest], ["arithmetic_total_EUR", result.total], ...LATE_PAYMENT_SOURCES.map(url => ["official_source", url]),
  ];
  return "\uFEFF" + rows.map(r => r.map(escape).join(";")).join("\r\n");
}
