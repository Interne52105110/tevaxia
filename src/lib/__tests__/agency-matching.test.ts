import { describe, it, expect } from "vitest";
import { scoreMatch, matchVerdict, BUYER_CONTACT_KINDS, MATCHABLE_MANDATE_STATUSES } from "../agency-matching";
import type { AgencyMandate } from "../agency-mandates";
import type { CrmContact } from "../crm/types";

function fakeContact(o: Partial<CrmContact> = {}): CrmContact {
  return {
    id: "c1", user_id: "u1", org_id: null, kind: "acquereur",
    is_company: false, first_name: "Jean", last_name: "Dupont",
    company_name: null, email: null, phone: null, address: null,
    postal_code: null, city: null, country: null,
    budget_min: 400000, budget_max: 600000,
    target_surface_min: 80, target_surface_max: 120,
    target_zones: ["Luxembourg", "Limpertsberg"],
    tags: ["appartement"],
    notes: null, marketing_opt_in: false, marketing_opt_in_at: null,
    assigned_to: null, created_at: "", updated_at: "", ...o,
  };
}

function fakeMandate(o: Partial<AgencyMandate> = {}): AgencyMandate {
  return {
    id: "m1", user_id: "u1", org_id: null, reference: "R1",
    property_address: "10 rue X", property_commune: "Luxembourg",
    property_type: "appartement",
    property_surface: 100, property_bedrooms: 2, property_bathrooms: 1,
    property_floor: 3, property_year_built: 2020,
    property_epc_class: "B", property_description: null,
    prix_demande: 500000,
    client_name: null, client_email: null, client_phone: null,
    mandate_type: "exclusif", status: "mandat_signe",
    commission_pct: 3, commission_amount_estimee: 15000, commission_amount_percue: null,
    start_date: null, end_date: null, signed_at: null, sold_at: null,
    sold_price: null, notes: null,
    is_co_mandate: false, co_agency_name: null,
    co_agency_commission_pct: null, co_agency_contact: null,
    is_published: false, published_at: null, media_count: 0,
    days_to_sign: null, days_to_close: null,
    created_at: "", updated_at: "", ...o,
  };
}

describe("scoreMatch — match parfait", () => {
  it("acquéreur idéal → score proche du maximum", () => {
    const s = scoreMatch(fakeContact(), fakeMandate());
    expect(s.budget).toBe(40);
    expect(s.surface).toBe(30);
    expect(s.zone).toBe(20);
    expect(s.type).toBe(10);
    expect(s.total).toBe(100);
  });
});

describe("scoreMatch — budget", () => {
  it("prix = min → full budget score", () => {
    const s = scoreMatch(fakeContact(), fakeMandate({ prix_demande: 400000 }));
    expect(s.budget).toBe(40);
  });
  it("prix juste hors budget (5% au-dessus du max) → 30 pts", () => {
    const s = scoreMatch(fakeContact(), fakeMandate({ prix_demande: 630000 })); // +5%
    expect(s.budget).toBe(30);
  });
  it("prix très éloigné → 0", () => {
    const s = scoreMatch(fakeContact(), fakeMandate({ prix_demande: 900000 }));
    expect(s.budget).toBe(0);
  });
  it("pas de budget contact → score partiel", () => {
    const s = scoreMatch(
      fakeContact({ budget_min: null, budget_max: null }),
      fakeMandate(),
    );
    expect(s.budget).toBe(10);
  });
});

describe("scoreMatch — surface", () => {
  it("surface dans cible → 30 pts", () => {
    expect(scoreMatch(fakeContact(), fakeMandate({ property_surface: 90 })).surface).toBe(30);
  });
  it("surface 10% en dessous de min → 20 pts", () => {
    // target min = 80, 10% en dessous = 72
    expect(scoreMatch(fakeContact(), fakeMandate({ property_surface: 72 })).surface).toBe(20);
  });
  it("surface très petite → 0", () => {
    expect(scoreMatch(fakeContact(), fakeMandate({ property_surface: 30 })).surface).toBe(0);
  });
});

describe("scoreMatch — zone", () => {
  it("commune dans zones → 20 pts", () => {
    expect(scoreMatch(fakeContact(), fakeMandate({ property_commune: "Luxembourg" })).zone).toBe(20);
  });
  it("match insensible à la casse", () => {
    expect(scoreMatch(fakeContact(), fakeMandate({ property_commune: "LUXEMBOURG" })).zone).toBe(20);
  });
  it("commune hors zones → 0", () => {
    expect(scoreMatch(fakeContact(), fakeMandate({ property_commune: "Esch" })).zone).toBe(0);
  });
});

describe("scoreMatch — type", () => {
  it("type dans tags → 10 pts", () => {
    expect(scoreMatch(fakeContact(), fakeMandate({ property_type: "appartement" })).type).toBe(10);
  });
  it("type non dans tags → 0", () => {
    expect(scoreMatch(fakeContact(), fakeMandate({ property_type: "terrain" })).type).toBe(0);
  });
  it("tags vides → 3 pts (indulgence)", () => {
    expect(scoreMatch(fakeContact({ tags: [] }), fakeMandate()).type).toBe(3);
  });
});

describe("matchVerdict", () => {
  it("≥ 70 = strong", () => {
    expect(matchVerdict(100)).toBe("strong");
    expect(matchVerdict(70)).toBe("strong");
  });
  it("40-69 = possible", () => {
    expect(matchVerdict(69)).toBe("possible");
    expect(matchVerdict(40)).toBe("possible");
  });
  it("<40 = weak", () => {
    expect(matchVerdict(39)).toBe("weak");
    expect(matchVerdict(0)).toBe("weak");
  });
});

describe("constants", () => {
  it("BUYER_CONTACT_KINDS couvre prospect/lead/acquereur", () => {
    expect(BUYER_CONTACT_KINDS).toContain("prospect");
    expect(BUYER_CONTACT_KINDS).toContain("lead");
    expect(BUYER_CONTACT_KINDS).toContain("acquereur");
    expect(BUYER_CONTACT_KINDS).not.toContain("vendeur");
  });
  it("MATCHABLE_MANDATE_STATUSES n'inclut pas vendu/abandonné", () => {
    expect(MATCHABLE_MANDATE_STATUSES).not.toContain("vendu");
    expect(MATCHABLE_MANDATE_STATUSES).not.toContain("abandonne");
    expect(MATCHABLE_MANDATE_STATUSES).toContain("diffuse");
    expect(MATCHABLE_MANDATE_STATUSES).toContain("en_visite");
  });
});

describe("scoreMatch — notes humaines", () => {
  it("retourne 4 notes (une par axe)", () => {
    const s = scoreMatch(fakeContact(), fakeMandate());
    expect(s.notes).toHaveLength(4);
    expect(s.notes[0]).toContain("budget");
    expect(s.notes[2]).toContain("zones cibles");
  });
});
