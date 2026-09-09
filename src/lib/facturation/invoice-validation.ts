export const SUPPORTED_INVOICE_PROFILES = ["BASIC", "EN_16931", "EXTENDED"] as const;

export interface ValidationError { rule: string; field: string; message: string }
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown) => typeof value === "string" && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const number = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

/** Input integrity checks only: passing these is not EN 16931 or tax compliance certification. */
export function validateInvoice(inv: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const add = (rule: string, field: string, message: string) => errors.push({ rule, field, message });
  if (!object(inv)) return [{ rule: "INPUT", field: "invoice", message: "Objet facture requis" }];
  if (typeof inv.profile !== "string" || !["MINIMUM", "BASIC_WL", "BASIC", "EN_16931", "EXTENDED"].includes(inv.profile)) add("INPUT", "profile", "Profil inconnu");
  if (inv.profile === "MINIMUM" || inv.profile === "BASIC_WL") add("PROFILE", "profile", "Ce profil sans lignes détaillées n’est pas pris en charge. Choisissez BASIC, EN 16931 ou EXTENDED.");
  if (!text(inv.invoice_number) || !(inv.invoice_number as string).trim()) add("BR-02", "invoice_number", "Numéro de facture requis");
  if (!date(inv.issue_date)) add("BR-03", "issue_date", "Date d’émission réelle au format YYYY-MM-DD requise");
  if (inv.due_date !== undefined && inv.due_date !== "" && !date(inv.due_date)) add("INPUT", "due_date", "Échéance invalide");
  if (!["380", "381", "384", "386"].includes(String(inv.document_type)) || typeof inv.document_type !== "string") add("BR-04", "document_type", "Type de document inconnu");
  if (typeof inv.currency !== "string" || !/^[A-Z]{3}$/.test(inv.currency)) add("BR-05", "currency", "Code devise ISO 4217 requis");
  for (const [field, nameRule, countryRule] of [["seller", "BR-06", "BR-08"], ["buyer", "BR-07", "BR-11"]]) {
    const party = inv[field];
    if (!object(party)) { add(nameRule, field, "Identité structurée requise"); continue; }
    if (!text(party.name) || !(party.name as string).trim()) add(nameRule, `${field}.name`, "Nom requis");
    if (typeof party.country_code !== "string" || !/^[A-Z]{2}$/.test(party.country_code)) add(countryRule, `${field}.country_code`, "Pays ISO alpha-2 requis");
    for (const key of ["trading_name", "legal_id", "vat_id", "tax_id", "address_line1", "address_line2", "postcode", "city", "email", "phone"]) {
      if (party[key] !== undefined && !text(party[key])) add("INPUT", `${field}.${key}`, "Texte invalide");
    }
  }
  for (const key of ["buyer_reference", "contract_reference", "purchase_order_reference", "payment_iban", "payment_bic", "payment_reference", "payment_terms"]) {
    if (inv[key] !== undefined && !text(inv[key])) add("INPUT", key, "Texte invalide");
  }
  if (inv.vat_exemption_reasons !== undefined && (!object(inv.vat_exemption_reasons) || !Object.entries(inv.vat_exemption_reasons).every(([category, reason]) => ["S","Z","E","AE","K","G","O"].includes(category) && text(reason)))) add("INPUT", "vat_exemption_reasons", "Motifs TVA invalides");
  if (inv.notes !== undefined && (!Array.isArray(inv.notes) || !inv.notes.every(text))) add("INPUT", "notes", "Liste de textes requise");
  if (!Array.isArray(inv.lines) || !inv.lines.length) { add("BR-16", "lines", "Au moins une ligne requise"); return errors; }
  inv.lines.forEach((line, i) => {
    const field = `lines[${i}]`;
    if (!object(line)) { add("INPUT", field, "Ligne structurée requise"); return; }
    if (!text(line.name) || !(line.name as string).trim()) add("BR-21", `${field}.name`, "Libellé requis");
    for (const key of ["id", "description", "unit_code"]) if (line[key] !== undefined && !text(line[key])) add("INPUT", `${field}.${key}`, "Texte invalide");
    if (!number(line.quantity, Number.MIN_VALUE, 1e9)) add("BR-22", `${field}.quantity`, "Quantité numérique positive requise (maximum 1 milliard)");
    if (!number(line.unit_price_net, 0, 1e9)) add("BR-27", `${field}.unit_price_net`, "Prix HT numérique requis, entre 0 et 1 milliard");
    if (!number(line.vat_rate_percent, 0, 100)) add("BR-CO-17", `${field}.vat_rate_percent`, "Taux TVA numérique requis, entre 0 et 100");
    if (line.discount_percent !== undefined && !number(line.discount_percent, 0, 100)) add("INPUT", `${field}.discount_percent`, "Remise numérique requise, entre 0 et 100");
    if (typeof line.vat_category !== "string" || !["S", "Z", "E", "AE", "K", "G", "O"].includes(line.vat_category)) add("INPUT", `${field}.vat_category`, "Catégorie TVA inconnue");
    else if ((line.vat_category === "S" && line.vat_rate_percent === 0) || (line.vat_category !== "S" && typeof line.vat_rate_percent === "number" && line.vat_rate_percent !== 0)) add("INPUT", `${field}.vat_rate_percent`, "Catégorie TVA et taux incohérents");
  });
  return errors;
}
