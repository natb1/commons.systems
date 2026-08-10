import { describe, expect, it } from "vitest";
import type { IntentionNode } from "../src/schema.js";
import { mergeIntentionNodes, eq, LIST_FIELDS } from "../src/node-merge.js";

/** A minimal valid IntentionNode with every field defaulted; override as needed. */
function node(overrides: Partial<IntentionNode> = {}): IntentionNode {
  return {
    id: "tactic-x",
    kind: "tactic",
    statement: "A minimal tactic.",
    owner: "ai",
    status: "refining",
    parent: null,
    serves: [],
    recovers: [],
    rationale: null,
    reading: null,
    clarifications: [],
    tooling_goals: [],
    success_signal: null,
    attention: null,
    phase: null,
    execution: null,
    validates: [],
    blocked_by: [],
    office_hours: null,
    pace_exempt: false,
    rounds: null,
    attributes: {},
    ...overrides,
  };
}

function pair(overrides: Partial<IntentionNode> = {}, body = "# body\n") {
  return { node: node(overrides), body };
}

describe("mergeIntentionNodes", () => {
  it("(a) unions list fields, deduping an overlapping entry", () => {
    const base = pair({ serves: ["strategy-a"] });
    const ours = pair({ serves: ["strategy-a", "strategy-b"] });
    const theirs = pair({ serves: ["strategy-a", "strategy-c"] });
    const { merged, conflicts } = mergeIntentionNodes(base, ours, theirs);
    // theirs order first, then ours' novel entries; strategy-a deduped.
    expect(merged.serves).toEqual(["strategy-a", "strategy-c", "strategy-b"]);
    expect(conflicts).toHaveLength(0);
  });

  it("(b) unions attributes.conditions", () => {
    const base = pair({ attributes: { conditions: ["c1"] } });
    const ours = pair({ attributes: { conditions: ["c1", "c2"] } });
    const theirs = pair({ attributes: { conditions: ["c1", "c3"] } });
    const { merged, conflicts } = mergeIntentionNodes(base, ours, theirs);
    expect(merged.attributes.conditions).toEqual(["c1", "c3", "c2"]);
    expect(conflicts).toHaveLength(0);
  });

  it("(c) keeps an attributes key added on only one side, no conflict", () => {
    const base = pair({ attributes: { shared: 1 } });
    const ours = pair({ attributes: { shared: 1, oursOnly: "added" } });
    const theirs = pair({ attributes: { shared: 1 } });
    const { merged, conflicts } = mergeIntentionNodes(base, ours, theirs);
    expect(merged.attributes.oursOnly).toBe("added");
    expect(merged.attributes.shared).toBe(1);
    expect(conflicts).toHaveLength(0);
  });

  it("(d) merges two distinct scalar fields each edited by a different side", () => {
    const base = pair({ rationale: null, reading: null });
    const ours = pair({ rationale: "ours edited rationale", reading: null });
    const theirs = pair({ rationale: null, reading: "theirs edited reading" });
    const { merged, conflicts } = mergeIntentionNodes(base, ours, theirs);
    expect(merged.rationale).toBe("ours edited rationale");
    expect(merged.reading).toBe("theirs edited reading");
    expect(conflicts).toHaveLength(0);
  });

  it("(e) collapses an identical edit to the same scalar field", () => {
    const base = pair({ statement: "original" });
    const ours = pair({ statement: "identical new" });
    const theirs = pair({ statement: "identical new" });
    const { merged, conflicts } = mergeIntentionNodes(base, ours, theirs);
    expect(merged.statement).toBe("identical new");
    expect(conflicts).toHaveLength(0);
  });

  it("(f) reports a conflict when the same scalar field diverges; merged takes theirs", () => {
    const base = pair({ statement: "original" });
    const ours = pair({ statement: "ours version" });
    const theirs = pair({ statement: "theirs version" });
    const { merged, conflicts } = mergeIntentionNodes(base, ours, theirs);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toEqual({
      field: "statement",
      ours: "ours version",
      theirs: "theirs version",
    });
    expect(merged.statement).toBe("theirs version");
  });

  it("(g) reports a body conflict when both sides change the markdown body", () => {
    const base = pair({}, "# original body\n");
    const ours = pair({}, "# ours body\n");
    const theirs = pair({}, "# theirs body\n");
    const { body, conflicts } = mergeIntentionNodes(base, ours, theirs);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toEqual({
      field: "body",
      ours: "# ours body\n",
      theirs: "# theirs body\n",
    });
    expect(body).toBe("# theirs body\n");
  });

  it("(h) with base null, differing scalars conflict (base-comparison legs skipped)", () => {
    const ours = pair({ rationale: "ours", statement: "ours statement" });
    const theirs = pair({ rationale: "theirs", statement: "theirs statement" });
    const { merged, conflicts } = mergeIntentionNodes(null, ours, theirs);
    // No base → straight to ours-vs-theirs; both differ → both conflict.
    const fields = conflicts.map((c) => c.field).sort();
    expect(fields).toEqual(["rationale", "statement"]);
    expect(merged.rationale).toBe("theirs");
    expect(merged.statement).toBe("theirs statement");
  });

  it("with base null, an identical scalar edit still collapses without conflict", () => {
    const ours = pair({ rationale: "same" });
    const theirs = pair({ rationale: "same" });
    const { merged, conflicts } = mergeIntentionNodes(null, ours, theirs);
    expect(conflicts).toHaveLength(0);
    expect(merged.rationale).toBe("same");
  });

  it("does not treat object-key reordering as a conflict (structural eq, not stringify)", () => {
    const base = pair({ success_signal: null });
    const ss = { observable: "o", sensor: "s", threshold: "t", is_proxy: false };
    // Same object, different key insertion order on each side.
    const ours = pair({ success_signal: { ...ss } });
    const theirs = pair({
      success_signal: { is_proxy: false, threshold: "t", sensor: "s", observable: "o" },
    });
    const { conflicts } = mergeIntentionNodes(base, ours, theirs);
    expect(conflicts).toHaveLength(0);
  });
});

describe("eq", () => {
  it("is order-independent for object keys", () => {
    expect(eq({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("is order-dependent for arrays", () => {
    expect(eq([1, 2], [2, 1])).toBe(false);
    expect(eq([1, 2], [1, 2])).toBe(true);
  });

  it("distinguishes null from missing/other", () => {
    expect(eq(null, undefined)).toBe(false);
    expect(eq(null, null)).toBe(true);
  });
});

describe("LIST_FIELDS", () => {
  it("contains exactly the six union-merged fields", () => {
    expect([...LIST_FIELDS].sort()).toEqual(
      ["blocked_by", "clarifications", "recovers", "serves", "tooling_goals", "validates"].sort(),
    );
  });
});
