// ============================================================
// Factur-X — génération XML EN 16931 (CII D22B)
// ============================================================
//
// Génère le XML "Factur-X" (norme FR/DE identique, basée sur la norme
// européenne EN 16931) au format UN/CEFACT Cross Industry Invoice (CII)
// D22B. Ce XML est conçu pour être embarqué dans un PDF/A-3 (Factur-X)
// ou transmis seul via Peppol / PPF pour la réforme e-invoicing FR du
// 1er septembre 2026.
//
// Profils Factur-X supportés :
//   - MINIMUM          (réduit, 8 champs)
//   - BASIC WL         (sans lignes détaillées)
//   - BASIC            (lignes détaillées, usage FR typique)
//   - EN 16931         (= COMFORT, recommandé)
//   - EXTENDED         (hors cadre EN 16931 — usage B2B étendu)
//
// Cette V1 cible le profil BASIC (couvre >95% des cas immo FR/LU).
//
// Références :
//   - EN 16931-1:2017 — modèle sémantique
//   - FNFE-MPE Factur-X v1.0.07 (08/2024)
//   - Art. 242 nonies A annexe II CGI — mentions obligatoires
//   - Loi 1990-1170 + Directive UE 2014/55 + UE 2020/4 e-invoicing
//
// ============================================================

import { validateInvoice } from "./invoice-validation";
import { invoiceAmount, invoiceLineCents, invoiceLineAmount, invoiceVatCents, invoiceDecimalText, invoiceDiscountedUnitPrice } from "./invoice-arithmetic";

export type VatScheme =
  | "FR" // France
  | "LU" // Luxembourg
  | "BE" | "DE" | "NL" | "IT" | "ES"; // autres UE

/** Codes TVA EN 16931 (sous-ensemble usage immo LU/FR) */
export type VatCategoryCode =
  | "S"    // Standard rate
  | "Z"    // Zero rate
  | "E"    // Exempt
  | "AE"   // Reverse charge
  | "K"    // Intra-EU supply
  | "G"    // Export outside EU
  | "O";   // Outside scope

/** Type de document EN 16931 (UNTDID 1001) — sous-ensemble utile */
export type DocumentTypeCode =
  | "380"  // Commercial invoice
  | "381"  // Credit note
  | "384"  // Corrected invoice
  | "386"; // Prepayment invoice

export interface FacturXParty {
  name: string;
  trading_name?: string; // nom commercial
  legal_id?: string;     // SIREN FR / RCS LU / équivalent
  vat_id?: string;       // TVA intracom. ex "FR12345678901"
  address_line1?: string;
  address_line2?: string;
  postcode?: string;
  city?: string;
  country_code: string;  // ISO 3166-1 alpha-2
  email?: string;
  phone?: string;
}

export interface FacturXLine {
  id: string;            // identifiant ligne (ex "1")
  name: string;          // libellé article/prestation
  description?: string;  // description longue optionnelle
  quantity: number;
  unit_code?: string;    // UN/ECE Rec 20, ex "C62" (one), "MTK" (m²), "HUR" (heure), "MON" (month)
  unit_price_net: number; // prix unitaire HT
  discount_percent?: number; // remise ligne %
  vat_category: VatCategoryCode;
  vat_rate_percent: number;  // ex 17, 20, 3, 0
}

export interface FacturXInvoice {
  /** Profile name (pour le XMP meta & validation interne) */
  profile: "MINIMUM" | "BASIC_WL" | "BASIC" | "EN_16931" | "EXTENDED";
  document_type: DocumentTypeCode;
  invoice_number: string;
  issue_date: string;   // YYYY-MM-DD
  due_date?: string;    // YYYY-MM-DD
  currency: string;     // ISO 4217 ex "EUR"
  seller: FacturXParty;
  buyer: FacturXParty;
  lines: FacturXLine[];
  /** Mentions libres (ex mandat SEPA, ref contrat, CGV) */
  notes?: string[];
  /** Référence client/contrat/marché */
  buyer_reference?: string;
  contract_reference?: string;
  purchase_order_reference?: string;
  /** Paiement : IBAN/BIC vendeur pour règlement */
  payment_iban?: string;
  payment_bic?: string;
  payment_reference?: string;
  payment_terms?: string; // ex "30 jours fin de mois"
}

// ============================================================
// Helpers
// ============================================================

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmt2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function dateToCii(iso: string): string {
  // "2026-03-15" -> "20260315" (format 102)
  return iso.replace(/-/g, "");
}

function profileToGuideline(profile: FacturXInvoice["profile"]): string {
  switch (profile) {
    case "MINIMUM": return "urn:factur-x.eu:1p0:minimum";
    case "BASIC_WL": return "urn:factur-x.eu:1p0:basicwl";
    case "BASIC": return "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic";
    case "EN_16931": return "urn:cen.eu:en16931:2017";
    case "EXTENDED": return "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended";
  }
}

// ============================================================
// Calculs totaux (EN 16931 BR-CO-*)
// ============================================================

export interface FacturXTotals {
  line_total: number;          // BT-106 Sum of Invoice line net amount
  allowance_total: number;     // BT-107 Sum of allowances on document level
  charge_total: number;        // BT-108 Sum of charges on document level
  tax_basis: number;           // BT-109 Invoice total without VAT
  vat_total: number;           // BT-110 Invoice total VAT amount
  grand_total: number;         // BT-112 Invoice total with VAT
  paid_amount: number;         // BT-113 Amount paid
  amount_due: number;          // BT-115 Amount due for payment
  /** Ventilation TVA par taux (BR-CO-17) */
  vat_breakdown: Array<{
    category: VatCategoryCode;
    rate_percent: number;
    taxable_amount: number;
    tax_amount: number;
  }>;
}

export function computeTotals(inv: FacturXInvoice): FacturXTotals {
  const lineTotals = inv.lines.map(invoiceLineCents);
  const lineCents = lineTotals.reduce((sum, value) => sum + value, 0n);
  const line_total = invoiceAmount(lineCents);
  const groups = new Map<string, { cat: VatCategoryCode; rate: number; base: bigint }>();
  inv.lines.forEach((line, i) => {
    const key = `${line.vat_category}|${line.vat_rate_percent}`;
    const group = groups.get(key) ?? { cat: line.vat_category, rate: line.vat_rate_percent, base: 0n };
    group.base += lineTotals[i]; groups.set(key, group);
  });
  let vatCents = 0n;
  const vat_breakdown = Array.from(groups.values()).map(group => {
    const tax = invoiceVatCents(group.base, group.rate); vatCents += tax;
    return { category: group.cat, rate_percent: group.rate, taxable_amount: invoiceAmount(group.base), tax_amount: invoiceAmount(tax) };
  });
  const tax_basis = line_total;
  const vat_total = invoiceAmount(vatCents);
  const grand_total = invoiceAmount(lineCents + vatCents);

  return {
    line_total,
    allowance_total: 0,
    charge_total: 0,
    tax_basis,
    vat_total,
    grand_total,
    paid_amount: 0,
    amount_due: grand_total,
    vat_breakdown,
  };
}

// ============================================================
// Génération XML CII D22B
// ============================================================

function renderParty(p: FacturXParty, isSeller: boolean): string {
  const addressParts = [
    p.address_line1 ? `        <ram:LineOne>${xmlEscape(p.address_line1)}</ram:LineOne>` : "",
    p.address_line2 ? `        <ram:LineTwo>${xmlEscape(p.address_line2)}</ram:LineTwo>` : "",
    p.postcode ? `        <ram:PostcodeCode>${xmlEscape(p.postcode)}</ram:PostcodeCode>` : "",
    p.city ? `        <ram:CityName>${xmlEscape(p.city)}</ram:CityName>` : "",
    `        <ram:CountryID>${xmlEscape(p.country_code)}</ram:CountryID>`,
  ].filter(Boolean).join("\n");

  const vatBlock = p.vat_id
    ? `      <ram:SpecifiedTaxRegistration>
        <ram:ID schemeID="VA">${xmlEscape(p.vat_id)}</ram:ID>
      </ram:SpecifiedTaxRegistration>`
    : "";

  const legalBlock = p.legal_id
    ? `      <ram:SpecifiedLegalOrganization>
        <ram:ID>${xmlEscape(p.legal_id)}</ram:ID>
      </ram:SpecifiedLegalOrganization>`
    : "";

  const tag = isSeller ? "SellerTradeParty" : "BuyerTradeParty";

  return `    <ram:${tag}>
      <ram:Name>${xmlEscape(p.name)}</ram:Name>
${legalBlock}
      <ram:PostalTradeAddress>
${addressParts}
      </ram:PostalTradeAddress>
${vatBlock}
    </ram:${tag}>`;
}

function renderLine(line: FacturXLine, idx: number): string {
  const net = invoiceLineAmount(line);
  const desc = line.description
    ? `<ram:Description>${xmlEscape(line.description)}</ram:Description>`
    : "";
  return `    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${xmlEscape(line.id || String(idx + 1))}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${xmlEscape(line.name)}</ram:Name>
        ${desc}
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${invoiceDiscountedUnitPrice(line)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${xmlEscape(line.unit_code ?? "C62")}">${invoiceDecimalText(line.quantity)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${xmlEscape(line.vat_category)}</ram:CategoryCode>
          <ram:RateApplicablePercent>${invoiceDecimalText(line.vat_rate_percent)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${fmt2(net)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
}

function renderVatBreakdown(totals: FacturXTotals): string {
  return totals.vat_breakdown.map((v) => `    <ram:ApplicableTradeTax>
      <ram:CalculatedAmount>${fmt2(v.tax_amount)}</ram:CalculatedAmount>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:BasisAmount>${fmt2(v.taxable_amount)}</ram:BasisAmount>
      <ram:CategoryCode>${xmlEscape(v.category)}</ram:CategoryCode>
      <ram:RateApplicablePercent>${invoiceDecimalText(v.rate_percent)}</ram:RateApplicablePercent>
    </ram:ApplicableTradeTax>`).join("\n");
}

export function buildFacturXCiiXml(inv: FacturXInvoice): string {
  const errors = validateInvoice(inv);
  if (errors.length) throw new RangeError(errors.map(error => `${error.field}: ${error.message}`).join("; "));
  const totals = computeTotals(inv);
  const guideline = profileToGuideline(inv.profile);
  const notes = (inv.notes ?? []).map((n) =>
    `  <ram:IncludedNote>
    <ram:Content>${xmlEscape(n)}</ram:Content>
  </ram:IncludedNote>`
  ).join("\n");

  const dueBlock = inv.due_date
    ? `    <ram:SpecifiedTradePaymentTerms>
      <ram:DueDateDateTime>
        <udt:DateTimeString format="102">${dateToCii(inv.due_date)}</udt:DateTimeString>
      </ram:DueDateDateTime>
      ${inv.payment_terms ? `<ram:Description>${xmlEscape(inv.payment_terms)}</ram:Description>` : ""}
    </ram:SpecifiedTradePaymentTerms>`
    : "";

  const paymentMeans = inv.payment_iban
    ? `    <ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:TypeCode>58</ram:TypeCode>
      <ram:PayeePartyCreditorFinancialAccount>
        <ram:IBANID>${xmlEscape(inv.payment_iban.replace(/\s/g, ""))}</ram:IBANID>
      </ram:PayeePartyCreditorFinancialAccount>
      ${inv.payment_bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
        <ram:BICID>${xmlEscape(inv.payment_bic)}</ram:BICID>
      </ram:PayeeSpecifiedCreditorFinancialInstitution>` : ""}
    </ram:SpecifiedTradeSettlementPaymentMeans>`
    : "";

  const buyerRef = inv.buyer_reference
    ? `  <ram:BuyerReference>${xmlEscape(inv.buyer_reference)}</ram:BuyerReference>`
    : "";

  const contractRef = inv.contract_reference
    ? `    <ram:ContractReferencedDocument>
      <ram:IssuerAssignedID>${xmlEscape(inv.contract_reference)}</ram:IssuerAssignedID>
    </ram:ContractReferencedDocument>`
    : "";

  const poRef = inv.purchase_order_reference
    ? `    <ram:BuyerOrderReferencedDocument>
      <ram:IssuerAssignedID>${xmlEscape(inv.purchase_order_reference)}</ram:IssuerAssignedID>
    </ram:BuyerOrderReferencedDocument>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${guideline}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${xmlEscape(inv.invoice_number)}</ram:ID>
    <ram:TypeCode>${xmlEscape(inv.document_type)}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${dateToCii(inv.issue_date)}</udt:DateTimeString>
    </ram:IssueDateTime>
${notes}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${inv.lines.map(renderLine).join("\n")}
    <ram:ApplicableHeaderTradeAgreement>
${buyerRef}
${renderParty(inv.seller, true)}
${renderParty(inv.buyer, false)}
${poRef}
${contractRef}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery />
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${xmlEscape(inv.currency)}</ram:InvoiceCurrencyCode>
${paymentMeans}
${renderVatBreakdown(totals)}
${dueBlock}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${fmt2(totals.line_total)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${fmt2(totals.tax_basis)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${xmlEscape(inv.currency)}">${fmt2(totals.vat_total)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${fmt2(totals.grand_total)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${fmt2(totals.paid_amount)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${fmt2(totals.amount_due)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// ============================================================
// Tables de TVA FR / LU
// ============================================================

/** Taux TVA France applicables immo / prestations (2026) */
export const VAT_RATES_FR = {
  standard: 20,
  intermediate: 10,    // rénovation logement, hôtel restauration
  reduced: 5.5,        // travaux amélioration énergétique, ALURanc.
  super_reduced: 2.1,  // presse, médicaments remb.
} as const;

/** Taux TVA Luxembourg applicables immo / prestations (2026) */
export const VAT_RATES_LU = {
  standard: 17,        // standard LU
  intermediate: 14,    // vin, gaz…
  reduced: 8,          // chauffage, électricité (temp.)
  super_reduced: 3,    // hébergement hôtelier, F&B
  zero: 0,
  exempt: 0,           // location habitation (exempt art. 44 §1 f LTVA)
} as const;

/** Numérotation séquentielle conforme Art. 242 nonies A annexe II CGI FR */
export function formatInvoiceNumber(prefix: string, year: number, sequence: number): string {
  const yy = String(year).slice(-2);
  const seq = String(sequence).padStart(5, "0");
  return `${prefix}-${yy}-${seq}`;
}

// ============================================================
// Validation EN 16931 business rules (sous-ensemble V1)
// ============================================================

export { validateInvoice, type ValidationError } from "./invoice-validation";
