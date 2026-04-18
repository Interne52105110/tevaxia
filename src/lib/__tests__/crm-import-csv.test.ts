import { describe, it, expect } from "vitest";
import {
  parseCsv, detectColumnMapping, mapRowToContact, buildImportResult,
} from "../crm/import-csv";

describe("parseCsv", () => {
  it("détecte séparateur ; et parse les headers", () => {
    const { headers, rows, delimiter } = parseCsv("Nom;Prénom;Email\nDupont;Jean;j@d.lu");
    expect(delimiter).toBe(";");
    expect(headers).toEqual(["nom", "prénom", "email"]);
    expect(rows[0]).toEqual({ nom: "Dupont", "prénom": "Jean", email: "j@d.lu" });
  });
  it("détecte séparateur , si plus fréquent", () => {
    const { delimiter } = parseCsv("Name,Email,Phone\nJean,j@d,12345");
    expect(delimiter).toBe(",");
  });
  it("strip BOM UTF-8", () => {
    const { headers } = parseCsv("\uFEFFName;Email\nX;x@x");
    expect(headers).toEqual(["name", "email"]);
  });
  it("parse quotes correctement", () => {
    const { rows } = parseCsv('Name;City\n"Dupont, Jean";Luxembourg');
    expect(rows[0]).toEqual({ name: "Dupont, Jean", city: "Luxembourg" });
  });
  it("ignore les lignes commencant par #", () => {
    const { rows } = parseCsv("Name\n# commentaire\nX");
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("X");
  });
});

describe("detectColumnMapping", () => {
  it("map aliases français standards", () => {
    const m = detectColumnMapping(["prénom", "nom", "email", "téléphone", "société"]);
    expect(m.first_name).toBe("prénom");
    expect(m.last_name).toBe("nom");
    expect(m.email).toBe("email");
    expect(m.phone).toBe("téléphone");
    expect(m.company_name).toBe("société");
  });
  it("map aliases anglais", () => {
    const m = detectColumnMapping(["firstname", "lastname", "email", "phone"]);
    expect(m.first_name).toBe("firstname");
    expect(m.last_name).toBe("lastname");
  });
});

describe("mapRowToContact", () => {
  it("crée un contact particulier valide", () => {
    const row = { prenom: "Jean", nom: "Dupont", email: "j@dupont.lu" };
    const mapping = { first_name: "prenom", last_name: "nom", email: "email" };
    const r = mapRowToContact(row, mapping);
    expect(r.errors).toHaveLength(0);
    expect(r.parsed.first_name).toBe("Jean");
    expect(r.parsed.last_name).toBe("Dupont");
    expect(r.parsed.email).toBe("j@dupont.lu");
    expect(r.parsed.is_company).toBe(false);
  });
  it("flag société si company_name présent", () => {
    const row = { societe: "Tevaxia SARL", email: "c@t.lu" };
    const mapping = { company_name: "societe", email: "email" };
    const r = mapRowToContact(row, mapping);
    expect(r.parsed.is_company).toBe(true);
    expect(r.parsed.company_name).toBe("Tevaxia SARL");
  });
  it("erreur si ni nom/prénom ni société", () => {
    const r = mapRowToContact({ email: "x@x.lu" }, { email: "email" });
    expect(r.errors.length).toBeGreaterThan(0);
  });
  it("erreur si email invalide", () => {
    const r = mapRowToContact({ prenom: "X", email: "not-an-email" }, { first_name: "prenom", email: "email" });
    expect(r.errors.some((e) => e.includes("Email invalide"))).toBe(true);
  });
  it("parse budget avec virgule décimale", () => {
    const r = mapRowToContact({ prenom: "X", budget_min: "500000,50" },
      { first_name: "prenom", budget_min: "budget_min" });
    expect(r.parsed.budget_min).toBe(500000.5);
  });
  it("parse target_zones avec séparateur virgule OU point-virgule", () => {
    const r = mapRowToContact({ prenom: "X", zones: "Luxembourg; Limpertsberg, Belair" },
      { first_name: "prenom", target_zones: "zones" });
    expect(r.parsed.target_zones).toEqual(["Luxembourg", "Limpertsberg", "Belair"]);
  });
  it("marketing_opt_in toujours false par défaut (RGPD)", () => {
    const r = mapRowToContact({ prenom: "X" }, { first_name: "prenom" });
    expect(r.parsed.marketing_opt_in).toBe(false);
  });
});

describe("buildImportResult", () => {
  it("construit résultat complet avec valid/invalid counts", () => {
    const csv = `Prénom;Nom;Email
Jean;Dupont;j@d.lu
;;invalid
Marie;Curie;m@c.lu`;
    const r = buildImportResult(csv);
    expect(r.total).toBe(3);
    expect(r.valid).toBe(2);
    expect(r.invalid).toBe(1);
  });
});
