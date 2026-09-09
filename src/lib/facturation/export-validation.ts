import { validateInvoice, type ValidationError } from "./invoice-validation";
import type { FacturXInvoice } from "./factur-x";

/** Supported-field checks, not a determination of the applicable tax regime. */
export function validateInvoiceForExport(value: unknown): ValidationError[] {
  const errors = validateInvoice(value);
  if (errors.length) return errors;
  const inv = value as FacturXInvoice;
  const present = (value?: string) => Boolean(value?.trim());
  const add = (rule: string, field: string, message: string) => errors.push({ rule, field, message });
  const categories = new Set(inv.lines.map(line => line.vat_category));
  if (!present(inv.seller.legal_id) && !present(inv.seller.vat_id)) add("BR-CO-26", "seller", "Identifiant légal ou numéro TVA du vendeur requis");
  if ((["S","Z","E","AE","G"] as const).some(category => categories.has(category)) && !present(inv.seller.vat_id) && !present(inv.seller.tax_id)) add("EXPORT", "seller.vat_id", "Numéro TVA ou identifiant fiscal du vendeur requis pour la catégorie choisie");
  if (present(inv.buyer.tax_id)) add("EXPORT", "buyer.tax_id", "Utilisez le numéro TVA ou l’identifiant légal du client ; son autre identifiant fiscal n’est pas pris en charge");
  if (categories.has("AE") && !present(inv.buyer.vat_id) && !present(inv.buyer.legal_id)) add("BR-AE-02", "buyer", "Autoliquidation : numéro TVA ou identifiant légal du client requis");
  if (categories.has("K")) add("EXPORT", "lines", "La livraison intracommunautaire requiert des informations de livraison non prises en charge par ce générateur");
  if (categories.has("O")) {
    if (categories.size !== 1) add("BR-O-11", "lines", "La catégorie hors champ ne peut pas être mélangée à d’autres catégories dans ce document");
    if (present(inv.seller.vat_id) || present(inv.buyer.vat_id)) add("BR-O-02", "seller.vat_id", "Un document hors champ ne doit pas contenir les numéros TVA du vendeur ou du client");
  }
  for (const category of categories) {
    const reason = inv.vat_exemption_reasons?.[category];
    if (["E","AE","G","O"].includes(category) && !present(reason)) add(`BR-${category}-10`, "vat_exemption_reasons", `Motif ou mention fiscale requis pour ${category}`);
    if (["S","Z"].includes(category) && present(reason)) add("EXPORT", "vat_exemption_reasons", `Pas de motif d’exonération pour la catégorie ${category}`);
  }
  return errors;
}
