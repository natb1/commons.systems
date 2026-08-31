import { describe, expect, it } from "vitest";
import type { Attention, IntentionNode } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";
import {
  compareRankKeyDesc,
  computeSignalPath,
  resolveAttention,
} from "../src/attention.js";

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
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    superseded_by: partial.superseded_by ?? [],
    supersession_expiry: partial.supersession_expiry ?? null,
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/**
 * A strategy fixture whose signal already reads as validated (`reading`
 * non-null, no `gap`). Signal reachability no longer contributes magnitude to
 * the rank, but `computeSignalPath` still reads these fields, so the fixtures
 * keep the distinction explicit.
 */
function svnode(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ reading: "measured", ...partial, kind: "strategy" });
}

/**
 * A per-tier boost injection: `boost({ 1: 3, 2: 5 })` claims 3 on the tier-1
 * scale and 5 on the tier-2 scale. Sparse by construction — a tier left out of
 * the object makes no claim in that tier at all, which the resolver reads as a
 * contribution of 0 in that tier's ranking.
 */
function boost(boosts: Record<number, number>, rationale = "because"): Attention {
  const out: Record<string, number> = {};
  for (const [tier, amount] of Object.entries(boosts)) out[String(tier)] = amount;
  return { boosts: out, rationale };
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
      svnode({ id: "strategy-1", serves: ["virtue-root"], attention: boost({ 1: 5 }) }),
    ];

    const result = resolveAttention(nodes);

    expect(result.size).toBe(1);
    const s = result.get("strategy-1");
    expect(s?.score).toBe(5);
    expect(s?.sources).toEqual(["strategy-1"]);
    // The served virtue is a lineage member (depth 1) even though it is
    // ineligible for a rank entry of its own, and it carries no score — so the
    // band it defines is 0 and has no source.
    expect(s?.depth).toBe(1);
    expect(s?.band).toBe(0);
    expect(s?.bandSource).toBeNull();

    // Virtues and kind nodes are ineligible — no entry at all.
    expect(result.has("virtue-root")).toBe(false);
    expect(result.has("kind-kind")).toBe(false);
    expect(result.has("kind-strategy")).toBe(false);
    expect(result.has("kind-tactic")).toBe(false);
    expect(result.has("kind-virtue")).toBe(false);
  });

  it("gives an eligible node with no injection a zero entry with empty sources", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-quiet" }),
    ];

    const result = resolveAttention(nodes);
    const quiet = result.get("strategy-quiet");
    expect(quiet?.score).toBe(0);
    expect(quiet?.band).toBe(0);
    expect(quiet?.depth).toBe(0);
    expect(quiet?.sources).toEqual([]);
  });
});

describe("resolveAttention lineage score (undecayed, deduped)", () => {
  it("ranks a boosted node and all its descendants at the full boost, at any depth", () => {
    // strategy-parent boost 6 has three children (two via parent, one via
    // serves) and one grandchild. None dilutes: every descendant reads 6.
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "strategy-parent", serves: ["virtue-root"], attention: boost({ 1: 6 }) }),
      svnode({ id: "sub-1", parent: "strategy-parent" }),
      svnode({ id: "sub-2", parent: "strategy-parent" }),
      anode({ id: "tactic-1", kind: "tactic", serves: ["strategy-parent"] }),
      svnode({ id: "grand-1", parent: "sub-1" }),
    ];

    const result = resolveAttention(nodes);
    for (const id of ["strategy-parent", "sub-1", "sub-2", "tactic-1", "grand-1"]) {
      expect(result.get(id)?.score).toBe(6);
      expect(result.get(id)?.sources).toEqual(["strategy-parent"]);
    }
    // Direct children band on the boosted parent's score.
    expect(result.get("sub-1")?.band).toBe(6);
    expect(result.get("sub-1")?.bandSource).toBe("strategy-parent");
    expect(result.get("tactic-1")?.band).toBe(6);
    // Depth grows down the chain: the grandchild's lineage adds sub-1.
    expect(result.get("sub-1")?.depth).toBe(2); // strategy-parent, virtue-root
    expect(result.get("grand-1")?.depth).toBe(3); // + sub-1
  });

  it("adds two parents' claims on a shared child", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "s1", serves: ["virtue-root"], attention: boost({ 1: 2 }) }),
      svnode({ id: "s2", serves: ["virtue-root"], attention: boost({ 1: 6 }) }),
      // child draws from s1 (parent) and s2 (serves).
      svnode({ id: "child", parent: "s1", serves: ["s2"] }),
    ];

    const result = resolveAttention(nodes);
    const child = result.get("child");
    expect(child?.score).toBe(8);
    expect(child?.sources).toEqual(["s2", "s1"]); // ordered by contribution desc
    // Band takes the MAX parent score, not the sum.
    expect(child?.band).toBe(6);
    expect(child?.bandSource).toBe("s2");
  });

  it("counts an ancestor reached via two paths (a diamond) exactly once in score AND depth", () => {
    // top boost 4 reaches bottom via mid1 (parent chain) AND mid2 (serves
    // chain). Lineage is a SET, so bottom reads 4, not 8, and counts `top`
    // once toward depth.
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "top", serves: ["virtue-root"], attention: boost({ 1: 4 }) }),
      svnode({ id: "mid1", parent: "top" }),
      svnode({ id: "mid2", serves: ["top"] }),
      svnode({ id: "bottom", parent: "mid1", serves: ["mid2"] }),
    ];

    const result = resolveAttention(nodes);
    const bottom = result.get("bottom");
    expect(bottom?.score).toBe(4);
    expect(bottom?.sources).toEqual(["top"]);
    // {mid1, mid2, top, virtue-root} — top and virtue-root appear via both
    // routes and are counted once each.
    expect(bottom?.depth).toBe(4);
  });

  it("adds a boost on a child of a boosted ancestor (relative boost)", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "anc", serves: ["virtue-root"], attention: boost({ 1: 3 }) }),
      svnode({ id: "mid", parent: "anc", attention: boost({ 1: 2 }) }),
      svnode({ id: "leaf", parent: "mid" }),
    ];

    const result = resolveAttention(nodes);
    // mid carries the ancestor's 3 PLUS its own 2.
    expect(result.get("mid")?.score).toBe(5);
    expect(result.get("mid")?.sources).toEqual(["anc", "mid"]);
    // leaf inherits both, undiluted.
    expect(result.get("leaf")?.score).toBe(5);
    expect(result.get("leaf")?.sources).toEqual(["anc", "mid"]);
  });
});

// The `override` field (an absolute branch cap) is gone with the per-tier boost
// map, and with it the idea that a magic number anywhere can pin a subtree's
// rank below what its lineage says. This block replaces the old override
// coverage with the property that subsumes it: lineage flow is uncapped, and
// the way to correct a branch that is "too hot" is to RESTRUCTURE the lineage —
// drop the edge that was making the claim reach — not to author a cap.
describe("resolveAttention has no cap — correction is by restructuring lineage", () => {
  it("flows a hot ancestor's claim down uncapped, and stops it only when the edge is removed", () => {
    const withEdge = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "s1", serves: ["virtue-root"], attention: boost({ 1: 10 }) }),
      svnode({ id: "c", parent: "s1", attention: boost({ 1: 2 }) }),
      svnode({ id: "d", parent: "c" }),
    ];

    const withEdgeResult = resolveAttention(withEdge);
    // No cap exists: c reads its own 2 PLUS the inherited 10, and d inherits
    // the whole 12 in turn.
    expect(withEdgeResult.get("c")?.score).toBe(12);
    expect(withEdgeResult.get("d")?.score).toBe(12);

    // Correcting a graph that says the wrong thing means changing what reaches
    // what. Re-root c off s1 and the claim stops arriving — the same effect the
    // old `override` cap tried to buy with a number.
    const restructured = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      svnode({ id: "s1", serves: ["virtue-root"], attention: boost({ 1: 10 }) }),
      svnode({ id: "c", serves: ["virtue-root"], attention: boost({ 1: 2 }) }),
      svnode({ id: "d", parent: "c" }),
    ];

    const restructuredResult = resolveAttention(restructured);
    expect(restructuredResult.get("c")?.score).toBe(2);
    expect(restructuredResult.get("d")?.score).toBe(2);
    expect(restructuredResult.get("d")?.sources).toEqual(["c"]);
  });

  it("a node's own claim adds to what it inherits — it never replaces it", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "root", attention: boost({ 1: 100 }) }),
      svnode({ id: "mid", parent: "root", attention: boost({ 1: 5 }) }),
      svnode({ id: "leaf", parent: "mid", attention: boost({ 1: 2 }) }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("mid")?.score).toBe(105);
    expect(result.get("leaf")?.score).toBe(107);
    expect(result.get("leaf")?.sources).toEqual(["root", "mid", "leaf"]);
  });
});

describe("resolveAttention parent relation", () => {
  it("treats a strategy's recovers edge as a parent edge (delegation joins the lineage)", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "delegation-x",
        kind: "delegation",
        status: "codified",
        attributes: { divergence: { level: "moderate" } },
      }),
      svnode({ id: "strategy-x", recovers: ["delegation-x"] }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("strategy-x")?.depth).toBe(1); // the recovered delegation
  });

  it("treats reverse blocked_by as a parent edge — a blocked node's boost reaches its blockers", () => {
    // tactic-hot (boost 5) is blocked by blocker-a; blocker-a is blocked by
    // blocker-b. Unblocking work is what the blockers are FOR, so the claim
    // reaches both, transitively and undiluted.
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-hot",
        kind: "tactic",
        blocked_by: ["blocker-a"],
        attention: boost({ 1: 5 }),
      }),
      anode({ id: "blocker-a", kind: "tactic", blocked_by: ["blocker-b"] }),
      anode({ id: "blocker-b", kind: "tactic" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("tactic-hot")?.score).toBe(5);
    expect(result.get("blocker-a")?.score).toBe(5);
    expect(result.get("blocker-a")?.sources).toEqual(["tactic-hot"]);
    expect(result.get("blocker-b")?.score).toBe(5);
    expect(result.get("blocker-b")?.depth).toBe(2); // blocker-a, tactic-hot
  });

  it("carries what a blocker inherits on down into the blocker's own subtree", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-hot",
        kind: "tactic",
        blocked_by: ["blocker-a"],
        attention: boost({ 1: 5 }),
      }),
      anode({ id: "blocker-a", kind: "tactic" }),
      anode({ id: "blocker-child", kind: "tactic", parent: "blocker-a" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("blocker-a")?.score).toBe(5);
    expect(result.get("blocker-child")?.score).toBe(5);
    expect(result.get("blocker-child")?.sources).toEqual(["tactic-hot"]);
  });

  it("counts a source reaching a node via two serves paths exactly once", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-hot", attention: boost({ 1: 5 }) }),
      anode({ id: "blocker", kind: "tactic", serves: ["strategy-hot"] }),
      anode({ id: "hot", kind: "tactic", serves: ["strategy-hot"], blocked_by: ["blocker"] }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("blocker")?.score).toBe(5);
    expect(result.get("blocker")?.sources).toEqual(["strategy-hot"]);
    expect(result.get("hot")?.score).toBe(5);
    expect(result.get("hot")?.sources).toEqual(["strategy-hot"]);
  });
});

describe("resolveAttention band axis", () => {
  it("bands a node on its best parent's score, in the CHILD's resolved tier", () => {
    // strategy-planner sits in tier 1 and claims 10 there, but only 4 on the
    // tier-2 scale. tactic-bug is a bug fix, so it resolves to tier 2 — and it
    // must band on the parent's TIER-2 score (4), never on the tier-1 magnitude
    // (10), which is meaningless on the tier-2 scale.
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-planner", attention: boost({ 1: 10, 2: 4 }) }),
      anode({
        id: "tactic-bug",
        kind: "tactic",
        serves: ["strategy-planner"],
        attributes: { bug_fix: true },
        attention: boost({ 2: 1 }),
      }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("strategy-planner")?.tier).toBe(1);
    expect(result.get("strategy-planner")?.score).toBe(10); // reported in ITS tier

    const bug = result.get("tactic-bug");
    expect(bug?.tier).toBe(2);
    expect(bug?.band).toBe(4); // the parent's tier-2 score, not its tier-1 10
    expect(bug?.bandSource).toBe("strategy-planner");
    expect(bug?.score).toBe(5); // own 1 + inherited tier-2 4
  });

  it("reports band 0 with a null bandSource when a node has no parents", () => {
    const result = resolveAttention([...kinds(), svnode({ id: "strategy-alone", attention: boost({ 1: 9 }) })]);
    const alone = result.get("strategy-alone");
    expect(alone?.score).toBe(9);
    expect(alone?.band).toBe(0);
    expect(alone?.bandSource).toBeNull();
  });

  it("breaks a band tie by ascending parent id", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "p-alpha", attention: boost({ 1: 5 }) }),
      svnode({ id: "p-beta", attention: boost({ 1: 5 }) }),
      anode({ id: "tactic-child", kind: "tactic", serves: ["p-beta", "p-alpha"] }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("tactic-child")?.band).toBe(5);
    expect(result.get("tactic-child")?.bandSource).toBe("p-alpha");
  });
});

describe("resolveAttention terminal (done) nodes", () => {
  it("zeroes a done node's own contribution while staying transparent to its children", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-top", attention: boost({ 1: 5 }) }),
      anode({
        id: "tactic-done",
        kind: "tactic",
        serves: ["strategy-top"],
        phase: "done",
        attention: boost({ 1: 7 }),
      }),
      anode({ id: "tactic-live", kind: "tactic", parent: "tactic-done" }),
    ];

    const result = resolveAttention(nodes);
    // The done node's own 7 never counts, for itself or anyone.
    expect(result.get("tactic-done")?.score).toBe(5);

    const live = result.get("tactic-live");
    // Transparent pass-through: the live child still inherits everything ABOVE
    // the done parent (5), and never sees the done node's own 7.
    expect(live?.score).toBe(5);
    expect(live?.sources).toEqual(["strategy-top"]);
    // The done node is not a lineage member, so it adds no depth.
    expect(live?.depth).toBe(1); // strategy-top only
    // But the edge is NOT severed — banding still runs through the done parent,
    // which passes its ancestors' score along.
    expect(live?.band).toBe(5);
    expect(live?.bandSource).toBe("tactic-done");
  });

  it("ignores a done node's OWN tier mark but still relays an inherited tier", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-prod", attributes: { tier: 3 } }),
      // Own bug_fix mark would be tier 2, but the node is done: it asserts
      // nothing. The tier 3 it inherits from strategy-prod still flows through.
      anode({
        id: "tactic-relay",
        kind: "tactic",
        serves: ["strategy-prod"],
        phase: "done",
        attributes: { bug_fix: true },
      }),
      anode({ id: "tactic-below", kind: "tactic", parent: "tactic-relay" }),
      // A done node with nothing above it asserts only the default tier.
      anode({ id: "tactic-solo", kind: "tactic", phase: "done", attributes: { bug_fix: true } }),
      anode({ id: "tactic-under-solo", kind: "tactic", parent: "tactic-solo" }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("tactic-relay")?.tier).toBe(3);
    expect(result.get("tactic-below")?.tier).toBe(3);
    expect(result.get("tactic-solo")?.tier).toBe(1); // own bug_fix mark ignored
    expect(result.get("tactic-under-solo")?.tier).toBe(1);
  });

  it("drops a DONE blockee from the relation instead of letting it keep lifting its blocker", () => {
    // tactic-blocker blocks two nodes: one still live, one finished. Only the
    // live one may reach it. `blocked_by` edges to a completed node are never
    // rewritten (blockersComplete treats a done blocker as cleared), so the
    // stale edge would otherwise pin the blocker at the finished work's urgency
    // forever — the "a done blocker is cleared" convention openBlockers and the
    // retired officeHours surfacing lift both applied.
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-hot", attributes: { tier: 3 }, attention: boost({ 3: 9 }) }),
      anode({
        id: "tactic-finished",
        kind: "tactic",
        serves: ["strategy-hot"],
        phase: "done",
        blocked_by: ["tactic-blocker"],
      }),
      anode({ id: "tactic-blocker", kind: "tactic" }),
    ];

    const blocker = resolveAttention(nodes).get("tactic-blocker");
    // The done blockee carried score 9 and tier 3; neither reaches the blocker.
    expect(blocker?.score).toBe(0);
    expect(blocker?.band).toBe(0);
    expect(blocker?.bandSource).toBeNull();
    expect(blocker?.depth).toBe(0);
    expect(blocker?.tier).toBe(1);

    // Flip the blockee back to live and every axis flows again — the drop is
    // keyed on `phase: "done"`, not on the edge being absent.
    const live = nodes.map((n) =>
      n.id === "tactic-finished" ? ({ ...n, phase: "implement" } as typeof n) : n,
    );
    const lifted = resolveAttention(live).get("tactic-blocker");
    expect(lifted?.tier).toBe(3);
    expect(lifted?.score).toBe(9);
    expect(lifted?.band).toBe(9);
    expect(lifted?.bandSource).toBe("tactic-finished");
    expect(lifted?.depth).toBe(2); // tactic-finished + strategy-hot
  });
});

describe("resolveAttention cycle handling", () => {
  it("throws IntentionSchemaError on a pure parent-edge cycle", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "cyc-a", parent: "cyc-b" }),
      svnode({ id: "cyc-b", parent: "cyc-a" }),
    ];

    expect(() => resolveAttention(nodes)).toThrow(IntentionSchemaError);
    expect(() => resolveAttention(nodes)).toThrow(/attention flow cycle/);
  });

  it("converges on a MIXED cycle across the widened relation without throwing or hanging", () => {
    // cyc-child.parent = cyc-blocker, and cyc-child.blocked_by = [cyc-blocker],
    // so cyc-blocker's parents include cyc-child (reverse blocked_by) while
    // cyc-child's parents include cyc-blocker. That is a real cycle in the
    // unified relation. Rejecting it is the write path's job (see
    // tactic-attention-unified-relation-cycle-rule); the resolver's obligation
    // is only to converge — which the bounded set-union fixpoint guarantees.
    const nodes = [
      ...kinds(),
      anode({
        id: "cyc-child",
        kind: "tactic",
        parent: "cyc-blocker",
        blocked_by: ["cyc-blocker"],
      }),
      anode({ id: "cyc-blocker", kind: "tactic", attention: boost({ 1: 3 }) }),
    ];

    let result!: ReturnType<typeof resolveAttention>; // type-safety-ok: assigned synchronously inside the expect(() => {...}) callback immediately below, before any read
    expect(() => {
      result = resolveAttention(nodes);
    }).not.toThrow();

    // Both members converge on the same lineage set {cyc-child, cyc-blocker},
    // so the single authored 3 is counted exactly once for each.
    expect(result.get("cyc-blocker")?.score).toBe(3);
    expect(result.get("cyc-child")?.score).toBe(3);
    expect(result.get("cyc-child")?.depth).toBe(2);
  });
});

describe("resolveAttention determinism", () => {
  it("returns deep-equal maps for the same input and a shuffled copy", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({
        id: "delegation-d",
        kind: "delegation",
        status: "codified",
        attributes: {
          divergence: { level: "moderate" },
          irreversibility: { gated: "partially — vendor holds the record" },
        },
      }),
      svnode({ id: "s1", serves: ["virtue-root"], attention: boost({ 1: 2 }) }),
      svnode({ id: "s2", serves: ["virtue-root"], attention: boost({ 1: 6, 2: 3 }), recovers: ["delegation-d"] }),
      svnode({ id: "c", parent: "s1", attention: boost({ 1: 3 }) }),
      svnode({ id: "child", parent: "c", serves: ["s2"] }), // diamond into virtue-root
      anode({ id: "tactic-1", kind: "tactic", serves: ["s2"], blocked_by: ["tactic-2"] }),
      anode({ id: "tactic-2", kind: "tactic", serves: ["s1"] }),
      anode({ id: "tactic-3", kind: "tactic", parent: "tactic-2", phase: "done" }),
      anode({ id: "tactic-4", kind: "tactic", parent: "tactic-3", attributes: { bug_fix: true } }),
    ];
    const shuffled = [...nodes].reverse();

    const a = Object.fromEntries(resolveAttention(nodes));
    const b = Object.fromEntries(resolveAttention([...nodes]));
    const c = Object.fromEntries(resolveAttention(shuffled));

    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });
});

// The standalone `signal` rank TERM is gone: signal reachability no longer adds
// magnitude to any node's score. `computeSignalPath` itself is unchanged and
// still exported — the graph router's strategy-eligibility gate consumes it —
// so this block covers the reachability predicate directly, plus the fact that
// being on-path no longer moves the rank.
describe("computeSignalPath reachability (no longer a rank term)", () => {
  it("marks a tactic validating an unvalidated strategy, and everything blocking it, as on-path", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "strategy-target", kind: "strategy" }), // reading: null (default) → unvalidated
      anode({
        id: "tactic-on",
        kind: "tactic",
        validates: ["strategy-target"],
        blocked_by: ["tactic-blocker"],
      }),
      anode({ id: "tactic-blocker", kind: "tactic" }),
      anode({ id: "tactic-off", kind: "tactic", validates: [] }),
    ];

    const onPath = computeSignalPath(nodes);
    expect(onPath.has("strategy-target")).toBe(true);
    expect(onPath.has("tactic-on")).toBe(true);
    expect(onPath.has("tactic-blocker")).toBe(true);
    expect(onPath.has("tactic-off")).toBe(false);
  });

  it("does not treat a tactic validating an already-validated strategy as a terminal", () => {
    const nodes = [
      ...kinds(),
      svnode({ id: "strategy-done", reading: "the signal reads clean" }),
      anode({ id: "tactic-done-validates", kind: "tactic", validates: ["strategy-done"] }),
    ];

    expect(computeSignalPath(nodes).has("tactic-done-validates")).toBe(false);
  });

  it("inherits on-path status down a parent chain", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "strategy-target", kind: "strategy" }), // unvalidated
      anode({ id: "epic", kind: "tactic", validates: ["strategy-target"] }),
      anode({ id: "child", kind: "tactic", parent: "epic" }),
    ];

    expect(computeSignalPath(nodes).has("child")).toBe(true);
  });

  it("adds no score of its own — an on-path node with no boost still ranks 0", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "strategy-target", kind: "strategy" }), // unvalidated
      anode({ id: "tactic-on", kind: "tactic", validates: ["strategy-target"] }),
      anode({ id: "tactic-off", kind: "tactic" }),
    ];

    const result = resolveAttention(nodes);
    expect(computeSignalPath(nodes).has("tactic-on")).toBe(true);
    expect(result.get("tactic-on")?.score).toBe(0);
    expect(result.get("tactic-off")?.score).toBe(0);
  });
});

describe("resolveAttention capture-resolution contribution", () => {
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
    const low = result.get("strategy-low-capture")?.score ?? 0;
    const high = result.get("strategy-high-capture")?.score ?? 0;
    expect(high).toBeGreaterThan(low);
    expect(low).toBeGreaterThan(0);
  });

  it("delivers a serving tactic's capture score as ordinary lineage from the recovering strategy", () => {
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
      // Two hops down: the addend is attributed once, on the owner, and flows
      // the whole way rather than being re-derived one serves-hop away.
      anode({ id: "tactic-x-child", kind: "tactic", parent: "tactic-x" }),
    ];

    const result = resolveAttention(nodes);
    const strategyScore = result.get("strategy-x")?.score ?? 0;
    expect(strategyScore).toBeGreaterThan(0);
    expect(result.get("tactic-x")?.score).toBe(strategyScore);
    expect(result.get("tactic-x-child")?.score).toBe(strategyScore);
    expect(result.get("tactic-x")?.sources).toEqual(["strategy-x"]);
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
    expect(result.get("strategy-under-test")?.score).toBeCloseTo(2 / 6);
  });

  it("scores a qualified divergence level ('moderate — would-be') by its recognized token, not 0", () => {
    const result = resolveAttention(withCaptureAxes({ divergence: { level: "moderate — would-be" } }));
    expect(result.get("strategy-under-test")?.score).toBeCloseTo(2 / 6);
  });

  it("scores 'partially gated' strictly between 'false' and 'true' — never collapsed onto 'false'", () => {
    const falseValue = resolveAttention(
      withCaptureAxes({ irreversibility: { gated: "false" } }),
    ).get("strategy-under-test")?.score;
    const partialValue = resolveAttention(
      withCaptureAxes({ irreversibility: { gated: "partially — the authoritative record is the vendor's" } }),
    ).get("strategy-under-test")?.score;
    const trueValue = resolveAttention(
      withCaptureAxes({ irreversibility: { gated: "true — no export path" } }),
    ).get("strategy-under-test")?.score;

    expect(partialValue).toBeGreaterThan(falseValue ?? 0);
    expect(trueValue).toBeGreaterThan(partialValue ?? 0);
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

  // Tier isolation is now STRUCTURAL: per-tier boosts mean tier T's ranking
  // reads only `boosts[T]`, so a claim authored on another tier's scale is
  // invisible there by construction. The old cross-tier source FILTER is gone —
  // its net effect is preserved here, without the side effect of also dropping
  // a tier-2 boost that a tier-1 strategy explicitly authored (see the last
  // case in this block).
  it("does not sum a tier-1 claim into a tier-3 receiver's score", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-low", attention: boost({ 1: 10 }, "ordinary work") }),
      svnode({
        id: "strategy-high",
        parent: "strategy-low",
        attributes: { tier: 3 },
        attention: boost({ 3: 5 }, "production health"),
      }),
    ]);
    const high = result.get("strategy-high");
    // 5, not 15: the tier-1 parent claims nothing on the tier-3 scale.
    expect(high?.score).toBe(5);
    expect(high?.tier).toBe(3);
    expect(high?.sources).toEqual(["strategy-high"]);
  });

  it("still sums a SAME-tier claim — isolation is by tier namespace, not by distance", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({
        id: "strategy-peer",
        attributes: { tier: 3 },
        attention: boost({ 3: 10 }, "production health"),
      }),
      svnode({
        id: "strategy-heir",
        parent: "strategy-peer",
        attributes: { tier: 3 },
        attention: boost({ 3: 5 }, "production health"),
      }),
    ]);
    const heir = result.get("strategy-heir");
    expect(heir?.score).toBe(15);
    expect(heir?.sources).toEqual(["strategy-peer", "strategy-heir"]);
  });

  it("ignores a lower-tier claim relayed through a tier-lifted intermediate", () => {
    // strategy-low claims 7 on the tier-1 scale only. tactic-mid is lifted to
    // tier 3 by its serves edge; being lifted does not relabel the tier-1 claim
    // it relays, and there is no tier-3 claim anywhere, so it scores 0.
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-low", attention: boost({ 1: 7 }, "ordinary work") }),
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
    expect(mid?.score).toBe(0);
    expect(mid?.sources).toEqual([]);
  });

  it("honors a tier-2 boost a tier-1 strategy authored — the old isolation filter would have dropped it", () => {
    // strategy-planner sits in tier 1 but explicitly claims 9 on the tier-2
    // scale. A bug-fix tactic serving it resolves to tier 2 and DOES see that
    // claim; the strategy's own tier-1 report is unaffected by it.
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-planner", attention: boost({ 1: 1, 2: 9 }) }),
      anode({
        id: "tactic-bugfix",
        kind: "tactic",
        serves: ["strategy-planner"],
        attributes: { bug_fix: true },
      }),
    ]);
    expect(result.get("strategy-planner")?.tier).toBe(1);
    expect(result.get("strategy-planner")?.score).toBe(1);
    const bugfix = result.get("tactic-bugfix");
    expect(bugfix?.tier).toBe(2);
    expect(bugfix?.score).toBe(9);
    expect(bugfix?.sources).toEqual(["strategy-planner"]);
  });
});

describe("compareRankKeyDesc", () => {
  it("orders tier outermost, then band, then score, then depth — all descending", () => {
    const base = { tier: 1, band: 1, score: 1, depth: 1 };
    expect(compareRankKeyDesc({ ...base, tier: 2 }, base)).toBeLessThan(0);
    expect(compareRankKeyDesc({ ...base, band: 2 }, base)).toBeLessThan(0);
    expect(compareRankKeyDesc({ ...base, score: 2 }, base)).toBeLessThan(0);
    expect(compareRankKeyDesc({ ...base, depth: 2 }, base)).toBeLessThan(0);
    expect(compareRankKeyDesc(base, base)).toBe(0);
    // Tier dominates every inner component.
    expect(
      compareRankKeyDesc({ tier: 2, band: 0, score: 0, depth: 0 }, { tier: 1, band: 99, score: 99, depth: 99 }),
    ).toBeLessThan(0);
  });

  it("sorts a mixed list highest-first", () => {
    const keys = [
      { tier: 1, band: 0, score: 0, depth: 0 },
      { tier: 1, band: 0, score: 0, depth: 3 },
      { tier: 2, band: 0, score: 0, depth: 0 },
      { tier: 1, band: 5, score: 0, depth: 0 },
    ];
    expect([...keys].sort(compareRankKeyDesc)).toEqual([
      { tier: 2, band: 0, score: 0, depth: 0 },
      { tier: 1, band: 5, score: 0, depth: 0 },
      { tier: 1, band: 0, score: 0, depth: 3 },
      { tier: 1, band: 0, score: 0, depth: 0 },
    ]);
  });

  it("puts a child ahead of its parent on depth when tier, band and score all tie", () => {
    const result = resolveAttention([
      ...kinds(),
      svnode({ id: "strategy-p" }),
      svnode({ id: "strategy-c", parent: "strategy-p" }),
    ]);
    const parent = result.get("strategy-p");
    const child = result.get("strategy-c");
    expect(parent).toBeDefined();
    expect(child).toBeDefined();
    // Everything ties except depth: the child's lineage holds one more node.
    expect(child?.tier).toBe(parent?.tier);
    expect(child?.band).toBe(parent?.band);
    expect(child?.score).toBe(parent?.score);
    expect(child?.depth).toBe(1);
    expect(parent?.depth).toBe(0);
    expect(compareRankKeyDesc(child!, parent!)).toBeLessThan(0); // type-safety-ok: the toBeDefined() assertions on parent and child above already proved both are non-null; Map.get()'s return type just doesn't narrow across separate expect() statements
  });
});
