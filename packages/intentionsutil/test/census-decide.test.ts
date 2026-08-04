import { describe, expect, it } from "vitest";
import { validateNode, type IntentionNode } from "../src/schema.js";
import { verifyCompletion, isCensusDefectNode, partitionDonePresent } from "../scripts/census-decide.js";

// tactic-census-scripted-tick Unit 1 — the pure decision layer for the
// scripted census dispatch-tick step. verifyCompletion and
// partitionDonePresent are pure over an in-memory node array, so these
// exercise them directly (no store, no subprocess).

const STRATEGY = "strategy-graph-native-dispatch";

function strategy(): IntentionNode {
  return validateNode({
    id: STRATEGY,
    kind: "strategy",
    statement: "s",
    owner: "ai",
    status: "codified",
    serves: [],
  });
}

function doneTactic(id: string, extra: Record<string, unknown> = {}): IntentionNode {
  return validateNode({
    id,
    kind: "tactic",
    statement: "t",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    phase: "done",
    ...extra,
  });
}

function openTactic(id: string, extra: Record<string, unknown> = {}): IntentionNode {
  return validateNode({
    id,
    kind: "tactic",
    statement: "t",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    phase: "implement",
    ...extra,
  });
}

function execution(overrides: Record<string, unknown> = {}) {
  return {
    branch: "b",
    pr: 42,
    attempts: {},
    markers: [],
    strategy_fingerprint: null,
    ...overrides,
  };
}

describe("verifyCompletion", () => {
  it("verifies a real PR merge (mergedAt + mergeCommitSha both non-null)", () => {
    const n = doneTactic("tactic-a", {
      execution: execution({
        completion: { mergedAt: "2026-07-01T00:00:00Z", mergeCommitSha: "abc123", graphCommitSha: null },
      }),
    });
    expect(verifyCompletion(n)).toBe(true);
  });

  it("verifies an out-of-band landing (graphCommitSha non-null)", () => {
    const n = doneTactic("tactic-b", {
      execution: execution({
        completion: { mergedAt: null, mergeCommitSha: null, graphCommitSha: "def456" },
      }),
    });
    expect(verifyCompletion(n)).toBe(true);
  });

  it("does not verify when execution is null", () => {
    const n = doneTactic("tactic-c");
    expect(verifyCompletion(n)).toBe(false);
  });

  it("does not verify when execution.pr is null", () => {
    const n = doneTactic("tactic-d", { execution: execution({ pr: null }) });
    expect(verifyCompletion(n)).toBe(false);
  });

  it("does not verify when completion is absent", () => {
    const n = doneTactic("tactic-e", { execution: execution() });
    expect(verifyCompletion(n)).toBe(false);
  });

  it("does not verify when completion is only partially set", () => {
    const n = doneTactic("tactic-f", {
      execution: execution({
        completion: { mergedAt: "2026-07-01T00:00:00Z", mergeCommitSha: null, graphCommitSha: null },
      }),
    });
    expect(verifyCompletion(n)).toBe(false);
  });
});

describe("isCensusDefectNode", () => {
  it("is true for a node carrying the attributes.census_defect object", () => {
    const n = doneTactic("tactic-census-defect-x", {
      attributes: { census_defect: { target: "tactic-x", reason: "no-execution", detected: "2026-08-04" } },
    });
    expect(isCensusDefectNode(n)).toBe(true);
  });

  it("is false for a node with no census_defect attribute", () => {
    expect(isCensusDefectNode(doneTactic("tactic-plain"))).toBe(false);
  });

  it("keys off the attribute, NOT the id prefix", () => {
    // Borrowing the naming convention does not make a node census bookkeeping.
    const impostor = doneTactic("tactic-census-defect-hand-authored");
    expect(isCensusDefectNode(impostor)).toBe(false);

    // ...and a census-minted defect stays recognized under any id.
    const renamed = doneTactic("tactic-renamed-away-from-the-convention", {
      attributes: { census_defect: { target: "tactic-x", reason: "no-pr", detected: "2026-08-04" } },
    });
    expect(isCensusDefectNode(renamed)).toBe(true);
  });
});

describe("partitionDonePresent", () => {
  it("puts a verified real-merge done node in prunable", () => {
    const nodes = [
      strategy(),
      doneTactic("tactic-a", {
        execution: execution({
          completion: { mergedAt: "2026-07-01T00:00:00Z", mergeCommitSha: "abc123", graphCommitSha: null },
        }),
      }),
    ];
    const p = partitionDonePresent(nodes);
    expect(p.prunable).toEqual(["tactic-a"]);
    expect(p.defects).toEqual([]);
  });

  it("puts a verified out-of-band done node in prunable", () => {
    const nodes = [
      strategy(),
      doneTactic("tactic-b", {
        execution: execution({
          completion: { mergedAt: null, mergeCommitSha: null, graphCommitSha: "def456" },
        }),
      }),
    ];
    const p = partitionDonePresent(nodes);
    expect(p.prunable).toEqual(["tactic-b"]);
    expect(p.defects).toEqual([]);
  });

  it("classifies a done node with execution === null as no-execution", () => {
    const nodes = [strategy(), doneTactic("tactic-c")];
    const p = partitionDonePresent(nodes);
    expect(p.prunable).toEqual([]);
    expect(p.defects).toEqual([{ id: "tactic-c", reason: "no-execution" }]);
  });

  it("classifies a done node with execution.pr === null as no-pr", () => {
    const nodes = [strategy(), doneTactic("tactic-d", { execution: execution({ pr: null }) })];
    const p = partitionDonePresent(nodes);
    expect(p.prunable).toEqual([]);
    expect(p.defects).toEqual([{ id: "tactic-d", reason: "no-pr" }]);
  });

  it("classifies a done node with pr set but completion null/absent as unverified-merge", () => {
    const nodes = [strategy(), doneTactic("tactic-e", { execution: execution() })];
    const p = partitionDonePresent(nodes);
    expect(p.prunable).toEqual([]);
    expect(p.defects).toEqual([{ id: "tactic-e", reason: "unverified-merge" }]);
  });

  it("classifies a done node with pr+completion set but neither verification path satisfied as unverified-merge", () => {
    const nodes = [
      strategy(),
      doneTactic("tactic-f", {
        execution: execution({
          completion: { mergedAt: "2026-07-01T00:00:00Z", mergeCommitSha: null, graphCommitSha: null },
        }),
      }),
    ];
    const p = partitionDonePresent(nodes);
    expect(p.prunable).toEqual([]);
    expect(p.defects).toEqual([{ id: "tactic-f", reason: "unverified-merge" }]);
  });

  it("puts a CLOSED census-defect node in prunable even though it does not verify", () => {
    // The regress the census QA finding reproduced: a defect node closed the
    // way its own body instructs has execution: null, so verifyCompletion is
    // false — without the isCensusDefectNode arm it becomes a defect target and
    // census mints tactic-census-defect-census-defect-… forever.
    const closed = doneTactic("tactic-census-defect-broken", {
      attributes: { census_defect: { target: "tactic-broken", reason: "no-execution", detected: "2026-08-04" } },
    });
    expect(verifyCompletion(closed)).toBe(false);

    const p = partitionDonePresent([strategy(), closed]);
    expect(p.prunable).toEqual(["tactic-census-defect-broken"]);
    expect(p.defects).toEqual([]);
  });

  it("leaves an OPEN census-defect node in neither bucket", () => {
    const open = openTactic("tactic-census-defect-broken", {
      attributes: { census_defect: { target: "tactic-broken", reason: "no-execution", detected: "2026-08-04" } },
    });
    const p = partitionDonePresent([strategy(), open]);
    expect(p.prunable).toEqual([]);
    expect(p.defects).toEqual([]);
  });

  it("excludes a non-done node from both prunable and defects", () => {
    const nodes = [strategy(), openTactic("tactic-g")];
    const p = partitionDonePresent(nodes);
    expect(p.prunable).toEqual([]);
    expect(p.defects).toEqual([]);
  });
});
