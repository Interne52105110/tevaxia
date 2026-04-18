import { describe, it, expect } from "vitest";
import {
  EMAIL_TEMPLATES, renderTemplate, buildMailto,
  templatesByCategory, CATEGORY_LABELS,
} from "../crm/email-templates";

describe("EMAIL_TEMPLATES exhaustif", () => {
  it("10 templates minimum", () => {
    expect(EMAIL_TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });
  it("chaque template a title, subject, body, variables", () => {
    for (const t of EMAIL_TEMPLATES) {
      expect(t.title).toBeTruthy();
      expect(t.subject).toBeTruthy();
      expect(t.body).toBeTruthy();
      expect(t.variables.length).toBeGreaterThan(0);
    }
  });
  it("ids uniques", () => {
    const ids = new Set(EMAIL_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(EMAIL_TEMPLATES.length);
  });
});

describe("renderTemplate", () => {
  const t = EMAIL_TEMPLATES[0];
  it("substitue les variables définies", () => {
    const { subject, body } = renderTemplate(t, {
      prenom: "Jean",
      agence: "MonAgence",
      agent_nom: "Agent X",
      signature: "Sig",
    });
    expect(subject).toContain("Jean");
    expect(subject).toContain("MonAgence");
    expect(body).toContain("Jean");
    expect(body).toContain("Sig");
  });
  it("laisse les variables non fournies en clair", () => {
    const { body } = renderTemplate(t, { prenom: "X" });
    expect(body).toContain("{agent_nom}");
  });
});

describe("buildMailto", () => {
  it("construit un mailto: avec subject + body encodés", () => {
    const t = EMAIL_TEMPLATES[0];
    const url = buildMailto(t, "jean@example.com", { prenom: "Jean" });
    expect(url).toMatch(/^mailto:jean@example\.com/);
    expect(url).toContain("subject=");
    expect(url).toContain("body=");
    expect(url).toContain("%20"); // espaces encodés
  });
});

describe("templatesByCategory", () => {
  it("regroupe les templates par category", () => {
    const grouped = templatesByCategory();
    const total = Object.values(grouped).reduce((s, v) => s + v.length, 0);
    expect(total).toBe(EMAIL_TEMPLATES.length);
  });
  it("toutes les catégories couvertes", () => {
    const grouped = templatesByCategory();
    for (const k of Object.keys(CATEGORY_LABELS)) {
      expect(grouped).toHaveProperty(k);
    }
  });
});
