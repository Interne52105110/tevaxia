export const ENERGY_CLASSES = ["A+", "A", "B", "C", "D", "E", "F", "G", "H", "I", "?"] as const;
export interface EnergyProperty { id: string; nom: string; classe: string; surface: number; valeur: number; type: string; annee: number }
export function validEnergyProperty(value: unknown): value is Omit<EnergyProperty, "id"> {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return typeof p.nom === "string" && p.nom.trim().length > 0 && p.nom.length <= 300
    && typeof p.classe === "string" && (ENERGY_CLASSES as readonly string[]).includes(p.classe)
    && typeof p.surface === "number" && Number.isFinite(p.surface) && p.surface > 0 && p.surface <= 1e7
    && typeof p.valeur === "number" && Number.isFinite(p.valeur) && p.valeur > 0 && p.valeur <= 1e12
    && typeof p.type === "string" && p.type.trim().length > 0 && p.type.length <= 100
    && typeof p.annee === "number" && Number.isInteger(p.annee) && p.annee >= 1000 && p.annee <= new Date().getFullYear();
}
export function readEnergyPortfolio(raw: string): EnergyProperty[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every(p => validEnergyProperty(p) && "id" in p && typeof p.id === "string" && p.id.length > 0)
    || new Set(data.map(p => p.id)).size !== data.length) throw new Error("Invalid saved portfolio");
  return data;
}
export function summarizeEnergyPortfolio(properties: EnergyProperty[]) {
  if (!properties.every(validEnergyProperty)) throw new Error("Invalid property");
  const totalSurface = properties.reduce((s, p) => s + p.surface, 0);
  const totalValeur = properties.reduce((s, p) => s + p.valeur, 0);
  const repartition = Object.fromEntries(ENERGY_CLASSES.map(c => [c, properties.filter(p => p.classe === c).reduce((s,p) => s + p.surface, 0)]));
  return {totalSurface, totalValeur, repartition};
}
const HEADERS = ["nom", "classe", "surface", "valeur", "type", "annee"] as const;
// Determine the delimiter from the header; never split decimal commas in semicolon files.
function csvRows(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = text.slice(0, text.search(/[\r\n]/) < 0 ? text.length : text.search(/[\r\n]/)).includes(";") ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false, closed = false;
  const pushField = () => { row.push(field.trim()); field = ""; closed = false; };
  const pushRow = () => { pushField(); if (row.some(f => f !== "")) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else field += ch;
    } else if (ch === delimiter) pushField();
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; pushRow(); }
    else if (ch === '"' && field.trim() === "" && !closed) { field = ""; quoted = true; }
    else if (ch === '"' || (closed && ch.trim())) throw new Error("Malformed CSV");
    else field += ch;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  pushRow(); return rows;
}
export function parseEnergyCsv(text: string): {properties: Omit<EnergyProperty,"id">[]; errors: string[]} {
  try {
    const rows = csvRows(text), header = rows.shift()?.map(h => h.toLowerCase());
    if (!header || !rows.length || HEADERS.some(h => header.filter(c => c === h).length !== 1)) throw new Error("Invalid header");
    const properties: Omit<EnergyProperty,"id">[] = [], errors: string[] = [];
    rows.forEach((row, i) => {
      if (row.length !== header.length) { errors.push(String(i + 2)); return; }
      const field = (key: typeof HEADERS[number]) => row[header.indexOf(key)];
      const number = (key: "surface" | "valeur" | "annee") => {
        const value = field(key).replace(/[\u00a0\u202f ]/g, "").replace(",", ".");
        return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ? Number(value) : NaN;
      };
      const p = {nom: field("nom"), classe: field("classe").toUpperCase(), surface: number("surface"), valeur: number("valeur"), type: field("type"), annee: number("annee")};
      if (validEnergyProperty(p)) properties.push(p); else errors.push(String(i + 2));
    });
    return {properties, errors};
  } catch { return {properties: [], errors: ["format"]}; }
}
export function energyPortfolioCsv(properties: Omit<EnergyProperty,"id">[]): string {
  const quote = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [HEADERS.join(","), ...properties.map(p => HEADERS.map(h => quote(p[h])).join(","))].join("\r\n");
}
