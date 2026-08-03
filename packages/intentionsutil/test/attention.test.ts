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
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/**
 * A strategy fixture whose signal already reads as validated (`reading`
 * non-null, no `gap`) — the default in every describe block below EXCEPT the
 * dedicated "signal-satisfaction term" block, so those tests exercise the
 * `authored` term in isolation, undisturbed by the new `signal` term (which
 * would otherwise treat any strategy with the schema's default
 * `reading: null` as its own unvalidated validates-terminal).
 */
function svnode(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ reading: "measured", ...partial, kind: "strategy" });
}

/**
 * A relative boost injection. `tier` defaults to 1 — the tier every fixture
 * node sits in unless it carries a tier mark (rule 20 requires the tag to match
 * the node's own tier, so a marked node's injection must name its tier).
 */
function boost(amount: number, rationale = "because", tier = 1): Attention {
  return { boost: amount, override: null, rationale, tier };
}

/** An absolute branch-capping override injection. */
function override(amount: number, rationale = "because", tier = 1): Attention {
  return { boost: null, override: amount, rationale, tier };
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
    anode({ id: "kind-delegation", kind: "kind", status: "codified" }),
  ];
}

describe("resolveAttention eligibility", () => {
  it("ranks a boosted node by its boost with itself in sources; ineligible nodes get no entry", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "strategy-1", serves: ["virtue-root"], attention: boost(5) }),
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
      svnode({ id: "strategy-quiet" }),
    ];

    const result = resolveAttention(nodes);
    const quiet = result.get("strategy-quiet");
    expect(quiet?.value).toBe(0);
    expect(quiet?.sources).toEqual([]);
  });
});

describe("resolveAttention boost (undecayed, undiluted)", () => {
  it("ranks a boosted node and all its descendants at the full boost, at any depth", () => {
    // strategy-parent boost 6 has three children (two via parent, one via
    // serves) and one grandchild. None dilutes: every descendant reads 6.
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "strategy-parent", serves: ["virtue-root"], attention: boost(6) }),
      svnode({ id: "sub-1", parent: "strategy-parent" }),
      svnode({ id: "sub-2", parent: "strategy-parent" }),
      anode({ id: "tactic-1", kind: "tactic", serves: ["strategy-parent"] }),
      svnode({ id: "grand-1", parent: "sub-1" }),
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
      svnode({ id: "s1", serves: ["virtue-root"], attention: boost(2) }),
      svnode({ id: "s2", serves: ["virtue-root"], attention: boost(6) }),
      // child draws from s1 (parent) and s2 (serves).
      svnode({ id: "child", parent: "s1", serves: ["s2"] }),
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
      svnode({ id: "top", serves: ["virtue-root"], attention: boost(4) }),
      svnode({ id: "mid1", parent: "top" }),
      svnode({ id: "mid2", serves: ["top"] }),
      svnode({ id: "bottom", parent: "mid1", serves: ["mid2"] }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("bottom")?.value).toBe(4);
    expect(result.get("bottom")?.sources).toEqual(["top"]);
  });

  it("adds a boost on a child of a boosted ancestor (relative boost)", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "anc", serves: ["virtue-root"], attention: boost(3) }),
      svnode({ id: "mid", parent: "anc", attention: boost(2) }),
      svnode({ id: "leaf", parent: "mid" }),
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
      svnode({ id: "s1", serves: ["virtue-root"], attention: boost(10) }),
      svnode({ id: "c", parent: "s1", attention: override(2) }),
      svnode({ id: "d", parent: "c" }),
      svnode({ id: "s2", serves: ["virtue-root"], attention: boost(6) }),
      svnode({ id: "t", parent: "c", serves: ["s2"] }),
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
      svnode({ id: "root", serves: ["virtue-root"], attention: boost(100) }),
      svnode({ id: "outer", parent: "root", attention: override(5) }),
      svnode({ id: "between", parent: "outer" }),
      svnode({ id: "inner", parent: "outer", attention: override(2) }),
      svnode({ id: "leaf", parent: "inner" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("outer")?.value).toBe(5);
    expect(result.get("between")?.value).toBe(5); // outer's cap
    expect(result.get("inner")?.value).toBe(2);
    expect(result.get("leaf")?.value).toBe(2); // nearest (inner) wins
    expect(result.get("leaf")?.sources).toEqual(["inner"]);
  });

  it("authored override is unaffected by any derived term", () => {
    // c overrides down to 2 despite also being on the signal path (it blocks
    // tactic-terminal, which validates the unvalidated strategy-target) AND
    // serving a strategy with a high-capture delegation — both derived terms
    // would otherwise add on top, but the override pins the total absolutely.
    const nodes = [
      ...kinds(),
      anode({
        id: "delegation-x",
        kind: "delegation",
        status: "codified",
        attributes: {
          divergence: { level: "high" },
          irreversibility: { gated: "true — no export path" },
        },
      }),
      anode({ id: "strategy-target", kind: "strategy" }), // reading: null omitted → unvalidated
      svnode({
        id: "strategy-captured",
        recovers: ["delegation-x"],
      }),
      anode({
        id: "c",
        kind: "tactic",
        blocked_by: [],
        serves: ["strategy-captured"],
        attention: override(2),
      }),
      anode({
        id: "tactic-terminal",
        kind: "tactic",
        blocked_by: ["c"],
        validates: ["strategy-target"],
      }),
    ];

    const result = resolveAttention(nodes);
    const c = result.get("c");
    expect(c?.value).toBe(2);
    expect(c?.terms).toEqual([{ term: "authored", value: 2 }]);
  });
});

describe("resolveAttention cycle guard", () => {
  it("throws IntentionSchemaError on a parent-edge cycle", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "cyc-a", parent: "cyc-b" }),
      svnode({ id: "cyc-b", parent: "cyc-a" }),
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
      svnode({ id: "s1", serves: ["virtue-root"], attention: boost(2) }),
      svnode({ id: "s2", serves: ["virtue-root"], attention: boost(6) }),
      svnode({ id: "c", parent: "s1", attention: override(3) }),
      svnode({ id: "child", parent: "c", serves: ["s2"] }),
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

describe("resolveAttention signal-satisfaction term", () => {
  it("ranks an on-path node (validates an unvalidated strategy) above an otherwise-identical off-path node", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "strategy-target", kind: "strategy" }), // reading: null (default) → unvalidated
      anode({ id: "tactic-on", kind: "tactic", validates: ["strategy-target"] }),
      anode({ id: "tactic-off", kind: "tactic", validates: [] }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("tactic-on")?.value).toBe(1); // SIGNAL_TERM_WEIGHT
    expect(result.get("tactic-off")?.value).toBe(0);
  });

  it("does not treat a tactic validating an already-validated strategy as a terminal", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-done", reading: "the signal reads clean" }),
      anode({ id: "tactic-done", kind: "tactic", validates: ["strategy-done"] }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("tactic-done")?.value).toBe(0);
  });

  it("lifts an upstream blocker when a downstream tactic gains a validates edge, with no other change", () => {
    const strategyTarget = anode({ id: "strategy-target", kind: "strategy" }); // unvalidated
    const tacticA = anode({ id: "tactic-a", kind: "tactic", blocked_by: [] });
    const tacticBBefore = anode({ id: "tactic-b", kind: "tactic", blocked_by: ["tactic-a"], validates: [] });
    const tacticBAfter = anode({ id: "tactic-b", kind: "tactic", blocked_by: ["tactic-a"], validates: ["strategy-target"] });

    const before = resolveAttention([...kinds(), strategyTarget, tacticA, tacticBBefore]);
    const after = resolveAttention([...kinds(), strategyTarget, tacticA, tacticBAfter]);

    expect(before.get("tactic-a")?.value).toBe(0);
    expect(after.get("tactic-a")?.value).toBe(1); // lifted by the new downstream validates edge
  });

  it("inherits on-path status down a parent chain", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "strategy-target", kind: "strategy" }), // unvalidated
      anode({ id: "epic", kind: "tactic", blocked_by: [], validates: ["strategy-target"] }),
      anode({ id: "child", kind: "tactic", parent: "epic" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("child")?.value).toBe(1);
  });
});

describe("resolveAttention capture-resolution term", () => {
  it("orders two strategies by their recovered delegations' divergence/irreversibility axes", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "delegation-low",
        kind: "delegation",
        status: "codified",
        attributes: {
          divergence: { level: "low" },
          irreversibility: { gated: "false — fully portable" },
        },
      }),
      anode({
        id: "delegation-high",
        kind: "delegation",
        status: "codified",
        attributes: {
          divergence: { level: "high" },
          irreversibility: { gated: "true — no export path" },
        },
      }),
      svnode({ id: "strategy-low-capture", recovers: ["delegation-low"] }),
      svnode({ id: "strategy-high-capture", recovers: ["delegation-high"] }),
    ];

    const result = resolveAttention(nodes);
    const low = result.get("strategy-low-capture")?.value ?? 0;
    const high = result.get("strategy-high-capture")?.value ?? 0;
    expect(high).toBeGreaterThan(low);
    expect(low).toBeGreaterThan(0);
  });

  it("carries a serving tactic's capture score from its strategy's recovers edge", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "delegation-x",
        kind: "delegation",
        status: "codified",
        attributes: {
          divergence: { level: "moderate" },
          irreversibility: { gated: "false" },
        },
      }),
      svnode({ id: "strategy-x", recovers: ["delegation-x"] }),
      anode({ id: "tactic-x", kind: "tactic", serves: ["strategy-x"] }),
    ];

    const result = resolveAttention(nodes);
    const strategyValue = result.get("strategy-x")?.value ?? 0;
    const tacticValue = result.get("tactic-x")?.value ?? 0;
    expect(strategyValue).toBeGreaterThan(0);
    expect(tacticValue).toBe(strategyValue);
  });

  // Both capture axes are free text, not a schema-gated enum — the live store
  // already authors values beyond the plain low/moderate/high + true/false the
  // kind-delegation field spec documents: delegation-anthropic-claude and
  // delegation-banking use `low-moderate`; delegation-hosted-publishing uses
  // `moderate — would-be`; every gated delegation with a description reads
  // `partially — ...` or `largely — ...`, never a bare `true`. An exact-match
  // parse silently zeroes (divergence) or under-scores (irreversibility) these
  // real, already-recovered delegations; these cases pin the real vocabulary.

  function withCaptureAxes(attributes: Record<string, unknown>): IntentionNode[] {
    return [
      ...kinds(),
      anode({ id: "delegation-under-test", kind: "delegation", status: "codified", attributes }),
      svnode({ id: "strategy-under-test", recovers: ["delegation-under-test"] }),
    ];
  }

  it("scores a compound divergence level ('low-moderate') as its more severe component, not 0", () => {
    const result = resolveAttention(withCaptureAxes({ divergence: { level: "low-moderate" } }));
    // moderate (2) / 6 — not 0, and strictly above a plain "low" (1/6).
    expect(result.get("strategy-under-test")?.value).toBeCloseTo(2 / 6);
  });

  it("scores a qualified divergence level ('moderate — would-be') by its recognized token, not 0", () => {
    const result = resolveAttention(withCaptureAxes({ divergence: { level: "moderate — would-be" } }));
    expect(result.get("strategy-under-test")?.value).toBeCloseTo(2 / 6);
  });

  it("scores 'partially gated' strictly between 'false' and 'true' — never collapsed onto 'false'", () => {
    const falseValue = resolveAttention(
      withCaptureAxes({ irreversibility: { gated: "false" } }),
    ).get("strategy-under-test")?.value;
    const partialValue = resolveAttention(
      withCaptureAxes({ irreversibility: { gated: "partially — the authoritative record is the vendor's" } }),
    ).get("strategy-under-test")?.value;
    const trueValue = resolveAttention(
      withCaptureAxes({ irreversibility: { gated: "true — no export path" } }),
    ).get("strategy-under-test")?.value;

    expect(partialValue).toBeGreaterThan(falseValue ?? 0);
    expect(trueValue).toBeGreaterThan(partialValue ?? 0);
  });
});

// The authored term flows DOWNWARD ONLY — parent and serves, never backward
// along blocked_by. This block records that doctrine change: the 2026-07-07
// backward-distribution doctrine (a boost on a blocked node lifted its whole
// critical path) is retired. Blocking precedence is the selector's structural
// concern; an authored value must not make a blocker's rank a function of who
// happens to be blocked on it. The downward-flow half of the old block (the
// serves-edge diamond) is unchanged and still holds.
describe("resolveAttention authored flow is downward-only (no backward blocked_by)", () => {
  it("does not flow a blocked leaf's boost backward to its blocker or its blocker's blocker", () => {
    // tactic-hot (boost 5) is blocked by blocker-a; blocker-a is blocked by
    // blocker-b. Nothing flows backward: both blockers resolve to 0 with no
    // sources, and only tactic-hot itself carries the authored value.
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hot", kind: "tactic", blocked_by: ["blocker-a"], attention: boost(5) }),
      anode({ id: "blocker-a", kind: "tactic", blocked_by: ["blocker-b"] }),
      anode({ id: "blocker-b", kind: "tactic" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("tactic-hot")?.value).toBe(5);
    expect(result.get("blocker-a")?.value).toBe(0);
    expect(result.get("blocker-a")?.sources).toEqual([]);
    expect(result.get("blocker-b")?.value).toBe(0);
    expect(result.get("blocker-b")?.sources).toEqual([]);
  });

  it("leaves a blocker's own subtree untouched — nothing arrives to carry downward", () => {
    // tactic-hot (boost 5) blocked by blocker-a; blocker-a has a child via
    // parent. blocker-a receives nothing, so its child inherits nothing either.
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hot", kind: "tactic", blocked_by: ["blocker-a"], attention: boost(5) }),
      anode({ id: "blocker-a", kind: "tactic" }),
      anode({ id: "blocker-child", kind: "tactic", parent: "blocker-a" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("blocker-a")?.value).toBe(0);
    expect(result.get("blocker-a")?.sources).toEqual([]);
    expect(result.get("blocker-child")?.value).toBe(0);
    expect(result.get("blocker-child")?.sources).toEqual([]);
  });

  it("does not flow an override's value backward to blockers either", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hot", kind: "tactic", blocked_by: ["blocker-a"], attention: override(5) }),
      anode({ id: "blocker-a", kind: "tactic" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("tactic-hot")?.value).toBe(5);
    expect(result.get("blocker-a")?.value).toBe(0);
    expect(result.get("blocker-a")?.sources).toEqual([]);
  });

  it("resolves a mixed parent/blocked_by structure without throwing (no cycle can form)", () => {
    // outer (boost 4) has a child `inner` via parent, and outer is blocked by
    // inner. Under the old backward flow this was a genuine mixed cycle needing
    // fixpoint-convergence reasoning; with blocked_by out of the distributor
    // relation the structure is just a one-edge parent chain, so no cycle can
    // form at all. It must still resolve, not throw: inner inherits outer's
    // boost downward, and the blocked_by edge contributes nothing.
    const nodes = [
      ...kinds(),
      anode({ id: "outer", kind: "tactic", blocked_by: ["inner"], attention: boost(4) }),
      anode({ id: "inner", kind: "tactic", parent: "outer" }),
    ];

    let result!: ReturnType<typeof resolveAttention>; // type-safety-ok: assigned synchronously inside the expect(() => {...}) callback immediately below, before any read
    expect(() => {
      result = resolveAttention(nodes);
    }).not.toThrow();
    expect(result.get("outer")?.value).toBe(4);
    expect(result.get("inner")?.value).toBe(4);
    expect(result.get("inner")?.sources).toEqual(["outer"]);
  });

  it("counts a source reaching a node via two serves paths exactly once (downward flow, unchanged)", () => {
    // strategy-hot (boost 5) is served by two tactics: blocker and hot. Each
    // draws strategy-hot's source through its OWN serves edge, undiluted and
    // deduped by source id — the downward half of the old doctrine, unchanged.
    // The blocked_by edge from hot to blocker now contributes nothing.
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-hot", attention: boost(5) }),
      anode({ id: "blocker", kind: "tactic", serves: ["strategy-hot"] }),
      anode({ id: "hot", kind: "tactic", serves: ["strategy-hot"], blocked_by: ["blocker"] }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("blocker")?.value).toBe(5);
    expect(result.get("blocker")?.sources).toEqual(["strategy-hot"]);
    expect(result.get("hot")?.value).toBe(5);
    expect(result.get("hot")?.sources).toEqual(["strategy-hot"]);
  });
});

describe("resolveAttention tier axis", () => {
  it("resolves an unmarked node to tier 1", () => {
    const result = resolveAttention([...kinds(), svnode({ id: "strategy-plain" })]);
    expect(result.get("strategy-plain")?.tier).toBe(1);
  });

  it("resolves a bug_fix-marked node to tier 2", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-bug", attributes: { bug_fix: true } }),
    ]);
    expect(result.get("strategy-bug")?.tier).toBe(2);
  });

  it("resolves a security-marked node to tier 2", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-sec", attributes: { security: true } }),
    ]);
    expect(result.get("strategy-sec")?.tier).toBe(2);
  });

  it("resolves an explicit attributes.tier: 3 to tier 3", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-prod", attributes: { tier: 3 } }),
    ]);
    expect(result.get("strategy-prod")?.tier).toBe(3);
  });

  it("takes the MAX of a semantic mark and an explicit tier, never their sum", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-both", attributes: { bug_fix: true, tier: 3 } }),
    ]);
    expect(result.get("strategy-both")?.tier).toBe(3); // not 2 + 3
  });

  it("lifts a tactic that serves a tier-3 strategy to tier 3", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-prod", attributes: { tier: 3 } }),
      anode({ id: "tactic-child", kind: "tactic", serves: ["strategy-prod"] }),
    ]);
    expect(result.get("tactic-child")?.tier).toBe(3);
  });

  it("takes the MAX across two serving strategies of different tiers", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-two", attributes: { bug_fix: true } }),
      svnode({ id: "strategy-three", attributes: { tier: 3 } }),
      anode({
        id: "tactic-both",
        kind: "tactic",
        serves: ["strategy-two", "strategy-three"],
      }),
    ]);
    expect(result.get("tactic-both")?.tier).toBe(3);
  });

  it("does not flow tier upward — a tier-3 child leaves its parent at tier 1", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-parent" }),
      svnode({ id: "strategy-child", parent: "strategy-parent", attributes: { tier: 3 } }),
    ]);
    expect(result.get("strategy-parent")?.tier).toBe(1);
    expect(result.get("strategy-child")?.tier).toBe(3);
  });

  it("reports the inherited effective tier on an overridden node (an override pins value only)", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-prod", attributes: { tier: 3 } }),
      svnode({
        id: "strategy-capped",
        parent: "strategy-prod",
        attributes: { tier: 3 },
        attention: override(2, "capped", 3),
      }),
    ]);
    const capped = result.get("strategy-capped");
    expect(capped?.value).toBe(2); // override pins the value
    expect(capped?.tier).toBe(3); // tier is a separate axis, still resolved
  });

  // Author ruling 2026-07-31, design decision (b): tier is an ISOLATION
  // BOUNDARY — authored authority does not flow across a tier namespace.
  it("does not sum a lower-tier source's claim into a higher-tier receiver", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-low", attention: boost(10, "ordinary work") }),
      svnode({
        id: "strategy-high",
        parent: "strategy-low",
        attributes: { tier: 3 },
        attention: boost(5, "production health", 3),
      }),
    ]);
    const high = result.get("strategy-high");
    // 5, not 15: the tier-1 parent's claim is filtered out before summing.
    expect(high?.value).toBe(5);
    expect(high?.tier).toBe(3);
    // The node's own claim is never dropped — it sits at the node's own tier.
    expect(high?.sources).toEqual(["strategy-high"]);
  });

  it("still sums a SAME-tier source's claim — the filter is by tier, not by distance", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({
        id: "strategy-peer",
        attributes: { tier: 3 },
        attention: boost(10, "production health", 3),
      }),
      svnode({
        id: "strategy-heir",
        parent: "strategy-peer",
        attributes: { tier: 3 },
        attention: boost(5, "production health", 3),
      }),
    ]);
    const heir = result.get("strategy-heir");
    expect(heir?.value).toBe(15);
    expect(heir?.sources).toEqual(["strategy-peer", "strategy-heir"]);
  });

  it("drops a lower-tier source lifted through an intermediate — filtering is on the SOURCE's tier", () => {
    // strategy-low (tier 1, boost 7) -> tactic-mid (lifted to tier 3 by its
    // serves edge) -> the receiver. tactic-mid RELAYS the tier-1 claim, and
    // being lifted to tier 3 itself does not relabel that claim's origin.
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-low", attention: boost(7, "ordinary work") }),
      svnode({ id: "strategy-prod", attributes: { tier: 3 } }),
      anode({
        id: "tactic-mid",
        kind: "tactic",
        parent: "strategy-low",
        serves: ["strategy-prod"],
      }),
    ]);
    const mid = result.get("tactic-mid");
    expect(mid?.tier).toBe(3);
    expect(mid?.value).toBe(0); // the tier-1 claim does not cross the boundary
    expect(mid?.sources).toEqual([]);
  });
});

describe("resolveAttention term composition is modular", () => {
  it("leaves an authored-only node's value untouched by a sibling's unrelated signal/capture contributions", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "delegation-heavy",
        kind: "delegation",
        status: "codified",
        attributes: {
          divergence: { level: "high" },
          irreversibility: { gated: "true" },
        },
      }),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      // Sibling with no relation to the boosted node: its own signal/capture
      // contributions must not leak into strategy-boosted's composition.
      anode({ id: "strategy-target", kind: "strategy" }), // unvalidated — an on-path terminal
      svnode({ id: "strategy-captured", recovers: ["delegation-heavy"] }),
      svnode({ id: "strategy-boosted", serves: ["virtue-root"], attention: boost(7) }),
    ];

    const result = resolveAttention(nodes);
    const boosted = result.get("strategy-boosted");
    expect(boosted?.value).toBe(7);
    expect(boosted?.terms).toEqual([
      { term: "authored", value: 7 },
      { term: "signal", value: 0 },
      { term: "capture", value: 0 },
    ]);
  });
});
