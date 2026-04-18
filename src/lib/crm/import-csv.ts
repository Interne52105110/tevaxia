// ============================================================
// CRM — Import contacts CSV
// ============================================================
//
// Parse d'un fichier CSV, validation et mapping vers CrmContact.
// Supporte séparateurs ; ou ,, quotes doubles, BOM UTF-8.

import type { CrmContactKind } from "./types";

export interface CsvImportRow {
  raw: Record<string, string>;
  parsed: {
    kind: CrmContactKind;
    is_company: boolean;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    budget_min: number | null;
    budget_max: number | null;
    target_surface_min: number | null;
    target_surface_max: number | null;
    target_zones: string[];
    tags: string[];
    notes: string | null;
    marketing_opt_in: boolean;
  };
  errors: string[];
}

export interface CsvImportResult {
  headers: string[];
  rows: CsvImportRow[];
  delimiter: ";" | ",";
  total: number;
  valid: number;
  invalid: number;
}

/**
 * Parse un contenu CSV en détectant le délimiteur automatiquement.
 */
export function parseCsv(content: string): { headers: string[]; rows: Record<string, string>[]; delimiter: ";" | "," } {
  // Strip BOM
  const text = content.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [], delimiter: ";" };

  // Détecte délimiteur (compare nb occurrences en 1ère ligne hors quotes)
  const firstLine = lines[0];
  const nbSemi = countOutsideQuotes(firstLine, ";");
  const nbComma = countOutsideQuotes(firstLine, ",");
  const delimiter: ";" | "," = nbSemi >= nbComma ? ";" : ",";

  const headers = splitCsvLine(firstLine, delimiter).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("#")) continue; // commentaires
    const cells = splitCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (cells[j] ?? "").trim();
    }
    rows.push(row);
  }
  return { headers, rows, delimiter };
}

function countOutsideQuotes(s: string, char: string): number {
  let inQuote = false;
  let count = 0;
  for (const c of s) {
    if (c === '"') inQuote = !inQuote;
    else if (c === char && !inQuote) count++;
  }
  return count;
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuote = false;
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i += 2; continue;
      }
      inQuote = !inQuote;
      i++; continue;
    }
    if (c === delim && !inQuote) {
      out.push(current);
      current = "";
      i++; continue;
    }
    current += c;
    i++;
  }
  out.push(current);
  return out;
}

// ============================================================
// Mapping auto des colonnes usuelles → champs CrmContact
// ============================================================

const COLUMN_ALIASES: Record<string, string[]> = {
  first_name: ["prenom", "first_name", "firstname", "prénom", "given name"],
  last_name: ["nom", "last_name", "lastname", "nom de famille", "surname", "family name"],
  company_name: ["societe", "société", "company", "company_name", "entreprise", "raison sociale"],
  email: ["email", "e-mail", "mail", "courriel"],
  phone: ["telephone", "téléphone", "phone", "mobile", "tel"],
  address: ["adresse", "address", "rue", "street"],
  postal_code: ["code_postal", "cp", "postal_code", "zip", "zipcode"],
  city: ["ville", "city", "localite", "localité"],
  country: ["pays", "country"],
  budget_min: ["budget_min", "budget minimum", "prix_min"],
  budget_max: ["budget_max", "budget maximum", "prix_max"],
  target_surface_min: ["surface_min"],
  target_surface_max: ["surface_max"],
  target_zones: ["zones", "target_zones", "quartiers", "communes"],
  tags: ["tags", "étiquettes", "labels", "categories"],
  notes: ["notes", "commentaires", "remarks", "observations"],
  kind: ["categorie", "catégorie", "kind", "type", "category"],
};

export function detectColumnMapping(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [target, aliases] of Object.entries(COLUMN_ALIASES)) {
    const found = headers.find((h) => aliases.some((a) => h === a || h.replace(/[_-]/g, " ") === a));
    if (found) map[target] = found;
  }
  return map;
}

function parseNumber(v: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseKind(v: string): CrmContactKind {
  const lower = v.toLowerCase();
  if (["prospect", "lead", "acquereur", "acquéreur", "vendeur", "bailleur", "locataire", "partenaire"].includes(lower)) {
    const map: Record<string, CrmContactKind> = {
      prospect: "prospect", lead: "lead",
      acquereur: "acquereur", "acquéreur": "acquereur",
      vendeur: "vendeur", bailleur: "bailleur",
      locataire: "locataire", partenaire: "partenaire",
    };
    return map[lower] ?? "prospect";
  }
  return "prospect";
}

function parseList(v: string): string[] {
  if (!v) return [];
  return v.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

export function mapRowToContact(
  raw: Record<string, string>,
  mapping: Record<string, string>,
): CsvImportRow {
  const g = (key: string) => raw[mapping[key] ?? key] ?? "";
  const errors: string[] = [];
  const companyName = g("company_name");
  const isCompany = companyName.length > 0;
  const firstName = g("first_name").trim() || null;
  const lastName = g("last_name").trim() || null;
  if (!isCompany && !firstName && !lastName) {
    errors.push("Nom requis (prénom + nom, ou nom société).");
  }
  const email = g("email").trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(`Email invalide : ${email}`);
  }
  return {
    raw,
    parsed: {
      kind: parseKind(g("kind")),
      is_company: isCompany,
      first_name: firstName,
      last_name: lastName,
      company_name: companyName || null,
      email,
      phone: g("phone").trim() || null,
      address: g("address").trim() || null,
      postal_code: g("postal_code").trim() || null,
      city: g("city").trim() || null,
      country: g("country").trim() || "LU",
      budget_min: parseNumber(g("budget_min")),
      budget_max: parseNumber(g("budget_max")),
      target_surface_min: parseNumber(g("target_surface_min")),
      target_surface_max: parseNumber(g("target_surface_max")),
      target_zones: parseList(g("target_zones")),
      tags: parseList(g("tags")),
      notes: g("notes").trim() || null,
      marketing_opt_in: false, // toujours false par défaut (RGPD)
    },
    errors,
  };
}

export function buildImportResult(
  csvContent: string,
): CsvImportResult {
  const { headers, rows, delimiter } = parseCsv(csvContent);
  const mapping = detectColumnMapping(headers);
  const parsed = rows.map((r) => mapRowToContact(r, mapping));
  return {
    headers, delimiter,
    rows: parsed,
    total: parsed.length,
    valid: parsed.filter((r) => r.errors.length === 0).length,
    invalid: parsed.filter((r) => r.errors.length > 0).length,
  };
}
