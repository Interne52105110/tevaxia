import { describe, it, expect } from "vitest";
import {
  resolutionVerdict, expressedCount, quorumReached,
  MAJORITY_LABEL, VOTE_LABEL, STATUS_LABEL,
  type Resolution,
} from "../coownership-assemblies";

function fakeRes(o: Partial<Resolution> = {}): Resolution {
  return {
    id: "r1", assembly_id: "a1", number: 1,
    title: "Approval budget", description: null,
    majority_type: "simple", result: "pending",
    votes_yes_tantiemes: 0, votes_no_tantiemes: 0,
    votes_abstain_tantiemes: 0, votes_absent_tantiemes: 0,
    created_at: "", updated_at: "", ...o,
  };
}

describe("expressedCount", () => {
  it("somme yes + no + abstain (pas absent)", () => {
    const r = fakeRes({
      votes_yes_tantiemes: 400, votes_no_tantiemes: 200,
      votes_abstain_tantiemes: 100, votes_absent_tantiemes: 300,
    });
    expect(expressedCount(r)).toBe(700);
  });
});

describe("resolutionVerdict", () => {
  it("simple majority threshold 50", () => {
    const v = resolutionVerdict(fakeRes({ majority_type: "simple" }), 1000);
    expect(v.reachedThreshold).toBe(50);
  });
  it("double majority threshold 66.67", () => {
    const v = resolutionVerdict(fakeRes({ majority_type: "double" }), 1000);
    expect(v.reachedThreshold).toBeCloseTo(66.67, 1);
  });
  it("unanimity threshold 100", () => {
    const v = resolutionVerdict(fakeRes({ majority_type: "unanimity" }), 1000);
    expect(v.reachedThreshold).toBe(100);
  });
  it("pctExpressed = (yes+no+abs) / total × 100", () => {
    const v = resolutionVerdict(fakeRes({
      votes_yes_tantiemes: 400, votes_no_tantiemes: 100,
    }), 1000);
    expect(v.pctExpressed).toBe(50);
  });
  it("pctYes = yes / expressed × 100", () => {
    const v = resolutionVerdict(fakeRes({
      votes_yes_tantiemes: 300, votes_no_tantiemes: 100,
    }), 1000);
    expect(v.pctYes).toBe(75);
  });
  it("pctYes = 0 si rien d'exprimé", () => {
    const v = resolutionVerdict(fakeRes(), 1000);
    expect(v.pctYes).toBe(0);
  });
});

describe("quorumReached", () => {
  it("50% quorum : 500 tantièmes exprimés sur 1000 → true", () => {
    const r = fakeRes({
      votes_yes_tantiemes: 300, votes_no_tantiemes: 200,
    });
    expect(quorumReached([r], 1000, 50)).toBe(true);
  });
  it("50% quorum : 400 tantièmes exprimés sur 1000 → false", () => {
    const r = fakeRes({
      votes_yes_tantiemes: 300, votes_no_tantiemes: 100,
    });
    expect(quorumReached([r], 1000, 50)).toBe(false);
  });
  it("vide → false", () => {
    expect(quorumReached([], 1000, 50)).toBe(false);
  });
});

describe("Constants exhaustive", () => {
  it("4 types de majorité", () => {
    expect(MAJORITY_LABEL.simple).toContain("simple");
    expect(MAJORITY_LABEL.absolute).toContain("absolue");
    expect(MAJORITY_LABEL.double).toContain("2/3");
    expect(MAJORITY_LABEL.unanimity).toContain("nanimité");
  });
  it("4 votes + 5 statuts", () => {
    expect(VOTE_LABEL.yes).toBe("Pour");
    expect(VOTE_LABEL.absent).toBe("Absent");
    expect(STATUS_LABEL.draft).toBe("Brouillon");
    expect(STATUS_LABEL.in_progress).toBe("En cours");
  });
});
