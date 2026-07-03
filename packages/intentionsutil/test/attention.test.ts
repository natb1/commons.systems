import { describe, expect, it } from "vitest";
import type { Attention, IntentionNode } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";
import { resolveAttention } from "../src/attention.js";

/** Build a full IntentionNode fixture, filling required/default fields. */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "raw",
    parent: partial.parent ?? null,
    serves: partial.serves ?? [],
    recovers: partial.recovers ?? [],
    rationale: partial.rationale ?? null,
    reading: partial.reading ?? null,
    gap: partial.gap ?? null,
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    attributes: partial.attributes ?? {},
  };
}

/** A relative boost injection. */
function boost(amount: number, rationale = "because"): Attention {
  return { boost: amount, override: null, rationale };
}

/** An absolute branch-capping override injection. */
function override(amount: number, rationale = "because"): Attention {
  return { boost: null, override: amount, rationale };
}

/**
 * The kind nodes every fixture needs. Eligibility is data: kind-strategy and
 * kind-tactic set `goal_layer: true`, kind-virtue and kind-kind do not. So
 * strategies and tactics are eligible for a rank entry; virtues and kind nodes
 * never are.
 */
function kinds(): IntentionNode[] {
  return [
    anode({ id: "kind-kind", kind: "kind", status: "codified" }),
    anode({
      id: "kind-strategy",
      kind: "kind",
      status: "codified",
      attributes: { goal_layer: true },
    }),
    anode({
      id: "kind-tactic",
      kind: "kind",
      status: "codified",
      attributes: { goal_layer: true },
    }),
    anode({ id: "kind-virtue", kind: "kind", status: "codified" }),
  ];
}

describe("resolveAttention eligibility", () => {
  it("ranks a boosted node by its boost with itself in sources; ineligible nodes get no entry", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "strategy-1", kind: "strategy", serves: ["virtue-root"], attention: boost(5) }),
    ];

    const result = resolveAttention(nodes);

    expect(result.size).toBe(1);
    const s = result.get("strategy-1");
    expect(s?.value).toBe(5);
    expect(s?.sources).toEqual(["strategy-1"]);

    // Virtues and kind nodes are ineligible — no entry at all.
    expect(result.has("virtue-root")).toBe(false);
    expect(result.has("kind-kind")).toBe(false);
    expect(result.has("kind-strategy")).toBe(false);
    expect(result.has("kind-tactic")).toBe(false);
    expect(result.has("kind-virtue")).toBe(false);
  });

  it("gives an eligible node with no injection a value-0 entry with empty sources", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "strategy-quiet", kind: "strategy" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("strategy-quiet")).toEqual({ value: 0, sources: [] });
  });
});

describe("resolveAttention boost (undecayed, undiluted)", () => {
  it("ranks a boosted node and all its descendants at the full boost, at any depth", () => {
    // strategy-parent boost 6 has three children (two via parent, one via
    // serves) and one grandchild. None dilutes: every descendant reads 6.
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "strategy-parent", kind: "strategy", serves: ["virtue-root"], attention: boost(6) }),
      anode({ id: "sub-1", kind: "strategy", parent: "strategy-parent" }),
      anode({ id: "sub-2", kind: "strategy", parent: "strategy-parent" }),
      anode({ id: "tactic-1", kind: "tactic", serves: ["strategy-parent"] }),
      anode({ id: "grand-1", kind: "strategy", parent: "sub-1" }),
    ];

    const result = resolveAttention(nodes);
    for (const id of ["strategy-parent", "sub-1", "sub-2", "tactic-1", "grand-1"]) {
      expect(result.get(id)?.value).toBe(6);
      expect(result.get(id)?.sources).toEqual(["strategy-parent"]);
    }
  });

  it("adds two parents' claims on a shared child", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "s1", kind: "strategy", serves: ["virtue-root"], attention: boost(2) }),
      anode({ id: "s2", kind: "strategy", serves: ["virtue-root"], attention: boost(6) }),
      // child draws from s1 (parent) and s2 (serves).
      anode({ id: "child", kind: "strategy", parent: "s1", serves: ["s2"] }),
    ];

    const result = resolveAttention(nodes);
    const child = result.get("child");
    expect(child?.value).toBe(8);
    expect(child?.sources).toEqual(["s2", "s1"]); // ordered by contribution desc
  });

  it("counts a source reached via two paths (a diamond) exactly once", () => {
    // top boost 4 reaches bottom via mid1 (parent chain) AND mid2 (serves
    // chain). The union dedupes by source id, so bottom reads 4, not 8.
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "top", kind: "strategy", serves: ["virtue-root"], attention: boost(4) }),
      anode({ id: "mid1", kind: "strategy", parent: "top" }),
      anode({ id: "mid2", kind: "strategy", serves: ["top"] }),
      anode({ id: "bottom", kind: "strategy", parent: "mid1", serves: ["mid2"] }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("bottom")?.value).toBe(4);
    expect(result.get("bottom")?.sources).toEqual(["top"]);
  });

  it("adds a boost on a child of a boosted ancestor (relative boost)", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "anc", kind: "strategy", serves: ["virtue-root"], attention: boost(3) }),
      anode({ id: "mid", kind: "strategy", parent: "anc", attention: boost(2) }),
      anode({ id: "leaf", kind: "strategy", parent: "mid" }),
    ];

    const result = resolveAttention(nodes);
    // mid carries the ancestor's 3 PLUS its own 2.
    expect(result.get("mid")?.value).toBe(5);
    expect(result.get("mid")?.sources).toEqual(["anc", "mid"]);
    // leaf inherits both, undiluted.
    expect(result.get("leaf")?.value).toBe(5);
    expect(result.get("leaf")?.sources).toEqual(["anc", "mid"]);
  });
});

describe("resolveAttention override (branch cap)", () => {
  it("caps its own branch while a second parent's claim still adds — T reads 8, not 2", () => {
    // S1 boosts 10; C overrides that branch down to 2 (its own rank). D hangs
    // only off C, so D reads the capped 2. S2 boosts 6 independently. T draws
    // from both C (capped 2) and S2 (6), so T reads 8 — the override caps its
    // branch, it does not silence T's other parent.
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "s1", kind: "strategy", serves: ["virtue-root"], attention: boost(10) }),
      anode({ id: "c", kind: "strategy", parent: "s1", attention: override(2) }),
      anode({ id: "d", kind: "strategy", parent: "c" }),
      anode({ id: "s2", kind: "strategy", serves: ["virtue-root"], attention: boost(6) }),
      anode({ id: "t", kind: "strategy", parent: "c", serves: ["s2"] }),
    ];

    const result = resolveAttention(nodes);
    // Override value is the node's own rank (s1's 10 is discarded, not summed).
    expect(result.get("c")?.value).toBe(2);
    expect(result.get("c")?.sources).toEqual(["c"]);
    // Reachable only through the override branch → capped.
    expect(result.get("d")?.value).toBe(2);
    expect(result.get("d")?.sources).toEqual(["c"]);
    // Two parents, one capped: 2 + 6 = 8.
    expect(result.get("t")?.value).toBe(8);
    expect(result.get("t")?.sources).toEqual(["s2", "c"]);
  });

  it("resolves nested overrides — the nearest override wins for the subtree below it", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "root", kind: "strategy", serves: ["virtue-root"], attention: boost(100) }),
      anode({ id: "outer", kind: "strategy", parent: "root", attention: override(5) }),
      anode({ id: "between", kind: "strategy", parent: "outer" }),
      anode({ id: "inner", kind: "strategy", parent: "outer", attention: override(2) }),
      anode({ id: "leaf", kind: "strategy", parent: "inner" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("outer")?.value).toBe(5);
    expect(result.get("between")?.value).toBe(5); // outer's cap
    expect(result.get("inner")?.value).toBe(2);
    expect(result.get("leaf")?.value).toBe(2); // nearest (inner) wins
    expect(result.get("leaf")?.sources).toEqual(["inner"]);
  });
});

describe("resolveAttention cycle guard", () => {
  it("throws IntentionSchemaError on a parent-edge cycle", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "cyc-a", kind: "strategy", parent: "cyc-b" }),
      anode({ id: "cyc-b", kind: "strategy", parent: "cyc-a" }),
    ];

    expect(() => resolveAttention(nodes)).toThrow(IntentionSchemaError);
    expect(() => resolveAttention(nodes)).toThrow(/attention flow cycle/);
  });
});

describe("resolveAttention determinism", () => {
  it("returns deep-equal maps for the same input and a shuffled copy", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "s1", kind: "strategy", serves: ["virtue-root"], attention: boost(2) }),
      anode({ id: "s2", kind: "strategy", serves: ["virtue-root"], attention: boost(6) }),
      anode({ id: "c", kind: "strategy", parent: "s1", attention: override(3) }),
      anode({ id: "child", kind: "strategy", parent: "c", serves: ["s2"] }),
      anode({ id: "tactic-1", kind: "tactic", serves: ["s2"] }),
    ];
    const shuffled = [...nodes].reverse();

    const a = Object.fromEntries(resolveAttention(nodes));
    const b = Object.fromEntries(resolveAttention([...nodes]));
    const c = Object.fromEntries(resolveAttention(shuffled));

    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });
});
