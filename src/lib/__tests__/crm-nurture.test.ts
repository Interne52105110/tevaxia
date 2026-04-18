import { describe, it, expect } from "vitest";
import {
  NURTURE_SEQUENCES, getSequence, getTemplateFromStep, estimateSequenceDuration,
} from "../crm/nurture-sequences";

describe("NURTURE_SEQUENCES", () => {
  it("5 séquences définies minimum", () => {
    expect(NURTURE_SEQUENCES.length).toBeGreaterThanOrEqual(5);
  });
  it("chaque séquence a id/name/steps non vides", () => {
    for (const seq of NURTURE_SEQUENCES) {
      expect(seq.id).toBeTruthy();
      expect(seq.name).toBeTruthy();
      expect(seq.steps.length).toBeGreaterThan(0);
    }
  });
  it("ids uniques", () => {
    const ids = new Set(NURTURE_SEQUENCES.map((s) => s.id));
    expect(ids.size).toBe(NURTURE_SEQUENCES.length);
  });
  it("chaque step a delay_days >= 0 et template_id + task_title", () => {
    for (const seq of NURTURE_SEQUENCES) {
      for (const step of seq.steps) {
        expect(step.delay_days).toBeGreaterThanOrEqual(0);
        expect(step.template_id).toBeTruthy();
        expect(step.task_title).toBeTruthy();
      }
    }
  });
});

describe("getSequence", () => {
  it("trouve une séquence existante", () => {
    expect(getSequence("prospect_silent_30j")).not.toBeNull();
  });
  it("retourne null pour id inconnu", () => {
    expect(getSequence("unknown_id")).toBeNull();
  });
});

describe("getTemplateFromStep", () => {
  it("récupère le template depuis EMAIL_TEMPLATES", () => {
    const seq = NURTURE_SEQUENCES[0];
    const step = seq.steps[0];
    const tpl = getTemplateFromStep(step);
    expect(tpl).not.toBeNull();
    expect(tpl?.id).toBe(step.template_id);
  });
});

describe("estimateSequenceDuration", () => {
  it("retourne le max delay_days des steps", () => {
    const seq = NURTURE_SEQUENCES.find((s) => s.id === "prospect_silent_30j");
    if (!seq) throw new Error("seq not found");
    const max = Math.max(...seq.steps.map((s) => s.delay_days));
    expect(estimateSequenceDuration(seq)).toBe(max);
  });
});
