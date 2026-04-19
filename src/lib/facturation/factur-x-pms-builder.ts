// ============================================================
// Factur-X — builder dédié facturation hôtelière (folio PMS)
// ============================================================
//
// Construit une Factur-X à partir d'un folio PMS au check-out :
// chaque charge devient une ligne avec sa TVA propre (LU 3%
// hébergement, 17% F&B, 0% taxe séjour, etc.).
// ============================================================

import type { FacturXInvoice, VatCategoryCode } from "./factur-x";
import type { PmsFolioCharge, PmsChargeCategory } from "@/lib/pms/types";

export interface PmsFacturXInput {
  reservation: {
    reservation_number: string;
    booker_name?: string | null;
    booker_email?: string | null;
    check_in: string;
    check_out: string;
    nb_adults: number;
    nb_children: number;
  };
  property: {
    name: string;
    address?: string | null;
    city?: string | null;
    country_code?: string;
    iban?: string | null;
    bic?: string | null;
    vat_id?: string | null;
    legal_id?: string | null;
  };
  charges: PmsFolioCharge[];
  buyer?: {
    name?: string;
    address?: string;
    city?: string;
    country_code?: string;
    vat_id?: string;
  };
}

const CATEGORY_LABEL_FR: Record<PmsChargeCategory, string> = {
  room: "Hébergement",
  extra_bed: "Lit supplémentaire",
  taxe_sejour: "Taxe de séjour",
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
  bar: "Bar",
  minibar: "Minibar",
  room_service: "Room service",
  meeting_room: "Salle de réunion",
  parking: "Parking",
  laundry: "Blanchisserie",
  spa: "Spa & bien-être",
  phone: "Téléphone",
  internet: "Wifi & connectivité",
  transport: "Transport",
  cancellation_fee: "Frais d'annulation",
  damage: "Dommages",
  other: "Divers",
};

function vatCategoryFromRate(rate: number): VatCategoryCode {
  if (rate === 0) return "Z";
  return "S";
}

function buildInvoiceNumber(reservationNumber: string): string {
  const clean = reservationNumber.replace(/[^A-Za-z0-9]/g, "");
  return `HOT-${clean}`;
}

export function buildPmsFacturX(input: PmsFacturXInput): FacturXInvoice {
  const { reservation, property, charges, buyer } = input;

  // Filtre les charges actives (non voided)
  const activeCharges = charges.filter((c) => !c.voided);

  // Mappe chaque charge en ligne Factur-X
  const lines = activeCharges.map((c, i) => ({
    id: String(i + 1),
    name: `${CATEGORY_LABEL_FR[c.category] ?? c.category} — ${c.description}`,
    description: c.category === "room"
      ? `Du ${reservation.check_in} au ${reservation.check_out}`
      : undefined,
    quantity: c.quantity,
    unit_code: c.category === "room" ? "DAY" : "C62",
    unit_price_net: c.unit_price_ht,
    vat_category: vatCategoryFromRate(c.tva_rate),
    vat_rate_percent: c.tva_rate,
  }));

  const country = property.country_code ?? "LU";

  return {
    profile: "BASIC",
    document_type: "380",
    invoice_number: buildInvoiceNumber(reservation.reservation_number),
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: reservation.check_out,
    currency: "EUR",
    seller: {
      name: property.name,
      address_line1: property.address ?? undefined,
      city: property.city ?? undefined,
      country_code: country,
      vat_id: property.vat_id ?? undefined,
      legal_id: property.legal_id ?? undefined,
    },
    buyer: {
      name: buyer?.name ?? reservation.booker_name ?? "Client",
      address_line1: buyer?.address ?? undefined,
      city: buyer?.city ?? undefined,
      country_code: buyer?.country_code ?? country,
      vat_id: buyer?.vat_id,
      email: reservation.booker_email ?? undefined,
    },
    lines,
    notes: [
      `Séjour ${reservation.check_in} → ${reservation.check_out} · ${reservation.nb_adults} adulte(s)${reservation.nb_children > 0 ? `, ${reservation.nb_children} enfant(s)` : ""}`,
      `Réservation ${reservation.reservation_number}`,
      country === "LU" ? "TVA LU : 3% hébergement art. 39 L. TVA, 17% restauration et autres services, 0% taxe séjour (hors champ TVA)" : "",
    ].filter(Boolean) as string[],
    buyer_reference: reservation.reservation_number,
    payment_iban: property.iban ?? undefined,
    payment_bic: property.bic ?? undefined,
    payment_reference: reservation.reservation_number,
    payment_terms: "Payable à la sortie ou selon conditions de réservation",
  };
}
