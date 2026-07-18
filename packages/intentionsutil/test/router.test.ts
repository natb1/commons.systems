import { describe, expect, it } from "vitest";
import type { Execution, IntentionNode } from "../src/schema.js";
import { PHASES } from "../src/schema.js";
import {
  frozenTacticSelectable,
  readingDate,
  resolveFrozenDescendant,
  selectGraphTargets,
  strategyAlignSelectable,
  strategyFingerprint,
} from "../src/router.js";

/** Build a full IntentionNode fixture, filling required/default fields. */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "ai",
    status: partial.status ?? "codified",
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

/** A tactic fixture. */
function tactic(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ ...partial, kind: "tactic" });
}

/**
 * A strategy fixture. Defaults to an UNVALIDATED signal (`reading: null`,
 * `gap: null`) — the state in which a strategy is a candidate for an
 * `/align-tactics` session.
 */
function strategy(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ ...partial, kind: "strategy" });
}

/** An in-flight execution record fixture. */
function exec(partial: Partial<Execution> = {}): Execution {
  return {
    branch: partial.branch ?? "some-branch",
    pr: partial.pr ?? null,
    attempts: partial.attempts ?? {},
    markers: partial.markers ?? [],
    strategy_fingerprint: partial.strategy_fingerprint ?? null,
  };
}

/**
 * The kind nodes `resolveAttention` reads for goal-layer eligibility, so
 * ordering tests get real ranks (a fixture graph without them ranks every
 * node 0, which still exercises the ladder/id tiebreaks but not rank).
 */
function kinds(): IntentionNode[] {
  return [
    anode({ id: "kind-strategy", kind: "kind", attributes: { goal_layer: true } }),
    anode({ id: "kind-tactic", kind: "kind", attributes: { goal_layer: true } }),
  ];
}

function candidateIds(nodes: IntentionNode[]): string[] {
  return selectGraphTargets(nodes).candidates.map((c) => c.id);
}

describe("tactic eligibility", () => {
  it("selects an open, unblocked, unparked tactic", () => {
    const sel = selectGraphTargets([tactic({ id: "tactic-a", phase: "implement" })]);
    expect(sel.candidates).toHaveLength(1);
    expect(sel.candidates[0]).toMatchObject({
      id: "tactic-a",
      kind: "tactic",
      phase: "implement",
      reevaluation: false,
    });
  });

  it("skips a parked tactic (office_hours non-null)", () => {
    const nodes = [
      tactic({
        id: "tactic-a",
        phase: "implement",
        office_hours: { reason: "needs a human", since: "2026-07-01", recommendation: null },
      }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("skips a done tactic; draft tactics now surface at align-tactics", () => {
    // tactic-graph-frozen-tactic-dispatch: a draft/raw tactic (explicit or
    // null-phase) is now a first-class candidate at the align-tactics rung; only
    // a DONE tactic is fully excluded.
    const nodes = [
      tactic({ id: "tactic-draft", phase: "draft" }),
      tactic({ id: "tactic-nophase", phase: null }),
      tactic({ id: "tactic-done", phase: "done" }),
    ];
    // Both drafts sort at the draft progression index (0), id ascending.
    expect(candidateIds(nodes)).toEqual(["tactic-draft", "tactic-nophase"]);
    for (const c of selectGraphTargets(nodes).candidates) {
      expect(c).toMatchObject({ kind: "tactic", phase: "align-tactics", reevaluation: false });
    }
  });

  it("skips a tactic with a present, not-done blocker", () => {
    const nodes = [
      tactic({ id: "tactic-a", phase: "implement", blocked_by: ["tactic-b"] }),
      tactic({ id: "tactic-b", phase: "implement" }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-b"]);
  });

  it("treats an ABSENT blocker as complete (prune-on-done)", () => {
    const nodes = [
      tactic({ id: "tactic-a", phase: "implement", blocked_by: ["tactic-pruned"] }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-a"]);
  });

  it("treats a present phase:done blocker as complete", () => {
    const nodes = [
      tactic({ id: "tactic-a", phase: "implement", blocked_by: ["tactic-b"] }),
      tactic({ id: "tactic-b", phase: "done" }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-a"]);
  });

  it("passes pace_exempt and execution.pr through to the candidate", () => {
    const sel = selectGraphTargets([
      tactic({ id: "tactic-a", phase: "fix", pace_exempt: true, execution: exec({ pr: 42 }) }),
    ]);
    expect(sel.candidates[0]).toMatchObject({ pace_exempt: true, pr: 42 });
  });

  it("skips a phase:review tactic once execution.markers includes 'reviewed' (tick-owned)", () => {
    const nodes = [
      tactic({
        id: "tactic-reviewed",
        phase: "review",
        execution: exec({ markers: ["reviewed"] }),
      }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("still selects a phase:review tactic without the 'reviewed' marker", () => {
    const nodes = [
      tactic({
        id: "tactic-review",
        phase: "review",
        execution: exec({ markers: [] }),
      }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-review"]);
  });
});

describe("strategy eligibility", () => {
  it("selects an unvalidated, childless, unparked strategy as align-tactics", () => {
    const sel = selectGraphTargets([strategy({ id: "strategy-s" })]);
    expect(sel.candidates).toHaveLength(1);
    expect(sel.candidates[0]).toMatchObject({
      id: "strategy-s",
      kind: "strategy",
      phase: "align-tactics",
      pr: null,
      reevaluation: false,
    });
  });

  it("skips a parked strategy", () => {
    const nodes = [
      strategy({ id: "strategy-s", office_hours: { reason: "capped", since: "2026-07-01", recommendation: null } }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("skips a strategy with a non-draft child tactic ON its signal path", () => {
    const nodes = [
      strategy({ id: "strategy-s" }),
      // On-path: the child validates the strategy's (unvalidated) signal.
      tactic({ id: "tactic-child", serves: ["strategy-s"], validates: ["strategy-s"], phase: "implement" }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-child"]);
  });

  it("draft children do not block a strategy's fresh round (drafts are input)", () => {
    const nodes = [
      strategy({ id: "strategy-s" }),
      tactic({ id: "tactic-child", serves: ["strategy-s"], validates: ["strategy-s"], phase: "draft" }),
      tactic({ id: "tactic-child2", serves: ["strategy-s"], validates: ["strategy-s"], phase: null }),
    ];
    // The strategy still emits its fresh align-tactics round; additively, each
    // draft child ALSO surfaces as its own align-tactics candidate
    // (tactic-graph-frozen-tactic-dispatch). The strategy sorts first (align
    // rung, index 1) ahead of the drafts (draft index 0), then id ascending.
    expect(candidateIds(nodes)).toEqual(["strategy-s", "tactic-child", "tactic-child2"]);
  });

  it("an OFF-path non-draft child does not block the strategy", () => {
    const nodes = [
      strategy({ id: "strategy-s" }),
      // Serves the strategy but has no validates edge and no blocked_by/parent
      // chain to a validates-terminal — off the signal path by construction.
      tactic({ id: "tactic-offpath", serves: ["strategy-s"], phase: "implement" }),
    ];
    expect(candidateIds(nodes)).toContain("strategy-s");
  });

  it("a non-draft child on the path through a parent chain blocks the strategy", () => {
    const nodes = [
      strategy({ id: "strategy-s" }),
      tactic({ id: "tactic-root", serves: ["strategy-s"], validates: ["strategy-s"], phase: "draft" }),
      // Child inherits strategy membership through the parent chain, and is
      // on-path because its parent is a validates-terminal.
      tactic({ id: "tactic-leaf", parent: "tactic-root", phase: "implement" }),
    ];
    expect(candidateIds(nodes)).not.toContain("strategy-s");
  });

  it("skips a strategy whose signal is validated (reading set, no gap)", () => {
    const nodes = [strategy({ id: "strategy-s", reading: "holding at threshold" })];
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("a validated-but-gapped signal keeps the strategy eligible", () => {
    const nodes = [
      strategy({ id: "strategy-s", reading: "below threshold", gap: "reading under threshold" }),
    ];
    expect(candidateIds(nodes)).toEqual(["strategy-s"]);
  });

  it("skips at the rounds cap and logs a rounds-cap event", () => {
    const sel = selectGraphTargets([
      strategy({
        id: "strategy-s",
        gap: "still gapped",
        reading: "fresh 2026-07-06",
        rounds: { count: 2, last_completed: "2026-07-01T00:00:00Z", last_aligned: "2026-07-01" },
      }),
    ]);
    expect(sel.candidates).toEqual([]);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "rounds-cap", strategy: "strategy-s" }),
    ]);
  });

  it("fresh-reading gate: last_aligned set with a null reading is stale", () => {
    const sel = selectGraphTargets([
      strategy({
        id: "strategy-s",
        gap: "gapped",
        rounds: { count: 1, last_completed: "2026-07-01T00:00:00Z", last_aligned: "2026-07-01" },
      }),
    ]);
    expect(sel.candidates).toEqual([]);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "stale-reading", strategy: "strategy-s" }),
    ]);
  });

  it("fresh-reading gate: a reading not newer than last_aligned is stale", () => {
    const sel = selectGraphTargets([
      strategy({
        id: "strategy-s",
        gap: "gapped",
        reading: "sampled 2026-06-20, still red",
        rounds: { count: 1, last_completed: "2026-07-01T00:00:00Z", last_aligned: "2026-07-01" },
      }),
    ]);
    expect(sel.candidates).toEqual([]);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "stale-reading", strategy: "strategy-s" }),
    ]);
  });

  it("fresh-reading gate: a reading newer than last_aligned passes", () => {
    const sel = selectGraphTargets([
      strategy({
        id: "strategy-s",
        gap: "gapped",
        reading: "sampled 2026-07-05, still red",
        rounds: { count: 1, last_completed: "2026-07-01T00:00:00Z", last_aligned: "2026-07-01" },
      }),
    ]);
    expect(sel.candidates.map((c) => c.id)).toEqual(["strategy-s"]);
  });

  it("never aligned (last_aligned null, whether rounds is null or count is 0) is always fresh", () => {
    const nodes = [
      strategy({ id: "strategy-a", rounds: { count: 0, last_completed: null, last_aligned: null } }),
      strategy({ id: "strategy-b" }),
    ];
    expect(candidateIds(nodes)).toEqual(["strategy-a", "strategy-b"]);
  });

  it("regression: a strategy with count still 0 but last_aligned set (born-parked-only children never prune) is gated by last_aligned, not count", () => {
    const nodes = [
      strategy({
        id: "strategy-s",
        gap: "gapped",
        reading: "sampled 2026-06-20, still red",
        rounds: { count: 0, last_completed: null, last_aligned: "2026-07-01" },
      }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
  });
});

describe("soft-freeze gate", () => {
  const frozenGraph = (fingerprint: string | null): IntentionNode[] => {
    const s = strategy({ id: "strategy-s" });
    return [
      s,
      tactic({
        id: "tactic-stale",
        serves: ["strategy-s"],
        phase: "implement",
        execution: exec({ strategy_fingerprint: fingerprint }),
      }),
      tactic({ id: "tactic-sibling", serves: ["strategy-s"], phase: "qa" }),
    ];
  };

  it("a stale fingerprint re-surfaces the frozen tactics at align-tactics", () => {
    const sel = selectGraphTargets(frozenGraph("stale-fingerprint"));
    // tactic-graph-frozen-tactic-dispatch: the re-evaluation now targets the
    // frozen TACTICS directly (not the strategy id). Both subtree tactics are
    // excluded from their normal phase skill and re-emitted as align-tactics
    // re-evaluation candidates. strategy-s ALSO emits its own fresh round here
    // because its frozen children carry no `validates` edge — they are off the
    // signal path, so the fresh-round child gate does not block the strategy.
    // Order: rank 0 across the board, then progression ordinal desc over each
    // node's REAL phase (tactic-sibling qa=4 > tactic-stale implement=2 >
    // strategy-s align=1).
    expect(sel.candidates.map((c) => c.id)).toEqual([
      "tactic-sibling",
      "tactic-stale",
      "strategy-s",
    ]);
    const stale = sel.candidates.find((c) => c.id === "tactic-stale");
    const sibling = sel.candidates.find((c) => c.id === "tactic-sibling");
    expect(stale).toMatchObject({ kind: "tactic", phase: "align-tactics", reevaluation: true });
    expect(sibling).toMatchObject({ kind: "tactic", phase: "align-tactics", reevaluation: true });
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "freeze", strategy: "strategy-s" }),
    ]);
  });

  it("a frozen tactic's normal phase-skill candidate is suppressed (only align-tactics remains)", () => {
    const sel = selectGraphTargets(frozenGraph("stale-fingerprint"));
    // tactic-stale is at phase `implement`, tactic-sibling at `qa`, but neither
    // emits an executable phase-skill candidate — only the single align-tactics
    // re-eval candidate.
    const staleCands = sel.candidates.filter((c) => c.id === "tactic-stale");
    expect(staleCands).toHaveLength(1);
    expect(staleCands[0]).toMatchObject({ phase: "align-tactics" });
    const siblingCands = sel.candidates.filter((c) => c.id === "tactic-sibling");
    expect(siblingCands).toHaveLength(1);
    expect(siblingCands[0]).toMatchObject({ phase: "align-tactics" });
  });

  it("a matching fingerprint does not freeze", () => {
    const s = strategy({ id: "strategy-s" });
    const sel = selectGraphTargets([
      s,
      tactic({
        id: "tactic-current",
        serves: ["strategy-s"],
        validates: ["strategy-s"],
        phase: "implement",
        execution: exec({ strategy_fingerprint: strategyFingerprint(s) }),
      }),
    ]);
    expect(sel.events).toEqual([]);
    expect(sel.candidates.map((c) => c.id)).toEqual(["tactic-current"]);
  });

  it("a null fingerprint is not stale (stamping starts with the align machinery)", () => {
    const sel = selectGraphTargets(frozenGraph(null));
    expect(sel.events).toEqual([]);
    expect(sel.candidates.map((c) => c.id)).toContain("tactic-stale");
  });

  it("parking the strategy drops its own candidate but not the frozen tactics' re-eval", () => {
    // The re-eval now targets the tactics directly, so parking the STRATEGY no
    // longer suppresses them — only the strategy's own (fresh-round) candidate
    // is gated out. The tactics carry office_hours null and still emit.
    const nodes = frozenGraph("stale-fingerprint").map((n) =>
      n.id === "strategy-s"
        ? { ...n, office_hours: { reason: "parked", since: "2026-07-01", recommendation: null } }
        : n,
    );
    const sel = selectGraphTargets(nodes);
    expect(sel.candidates.map((c) => c.id)).toEqual(["tactic-sibling", "tactic-stale"]);
    expect(sel.candidates.every((c) => c.kind === "tactic" && c.phase === "align-tactics")).toBe(true);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "freeze", strategy: "strategy-s" }),
    ]);
  });

  it("parking a frozen tactic drops its own re-eval candidate", () => {
    // office_hours gating applies to the frozen-tactic emission too.
    const nodes = frozenGraph("stale-fingerprint").map((n) =>
      n.id === "tactic-stale"
        ? { ...n, office_hours: { reason: "parked", since: "2026-07-01", recommendation: null } }
        : n,
    );
    const ids = selectGraphTargets(nodes).candidates.map((c) => c.id);
    expect(ids).not.toContain("tactic-stale");
    expect(ids).toContain("tactic-sibling");
  });

  it("a done child of a frozen subtree is NOT re-emitted as an align-tactics re-eval candidate", () => {
    // A `done` tactic can sit in the store during a freeze because transition-node
    // writes `done` without pruning (prune is a separate, lagging step). The
    // soft-freeze scan must not surface it as a `/align-tactics` re-eval target:
    // done (the highest progression ordinal) would otherwise sort to the TOP and
    // dispatch a re-plan against a completed/merged tactic.
    const nodes: IntentionNode[] = [
      strategy({ id: "strategy-s" }),
      tactic({
        id: "tactic-stale",
        serves: ["strategy-s"],
        phase: "implement",
        execution: exec({ strategy_fingerprint: "stale-fingerprint" }),
      }),
      tactic({ id: "tactic-done", serves: ["strategy-s"], phase: "done" }),
    ];
    const ids = selectGraphTargets(nodes).candidates.map((c) => c.id);
    expect(ids).not.toContain("tactic-done");
    // the open frozen child still re-surfaces
    expect(ids).toContain("tactic-stale");
  });

  // Multi-serves: the per-strategy map stamp must not false-freeze siblings.
  // An honest tactic serving two strategies carries one fingerprint per serving
  // strategy; a single legacy string cannot equal two substance hashes, which is
  // the class of freeze this map form fixes.
  const multiServes = (
    fingerprint: string | Record<string, string> | null,
  ): { nodes: IntentionNode[]; sA: IntentionNode; sB: IntentionNode } => {
    const sA = strategy({ id: "strategy-a", reading: "validated" });
    const sB = strategy({ id: "strategy-b", reading: "validated" });
    const nodes = [
      sA,
      sB,
      tactic({
        id: "tactic-multi",
        serves: ["strategy-a", "strategy-b"],
        validates: ["strategy-a", "strategy-b"],
        phase: "implement",
        execution: exec({ strategy_fingerprint: fingerprint }),
      }),
    ];
    return { nodes, sA, sB };
  };

  it("a map stamp fresh against BOTH serving strategies produces no freeze", () => {
    const { nodes, sA, sB } = multiServes(null);
    const stamped = {
      "strategy-a": strategyFingerprint(sA),
      "strategy-b": strategyFingerprint(sB),
    };
    const withStamp = nodes.map((n) =>
      n.id === "tactic-multi" ? { ...n, execution: exec({ strategy_fingerprint: stamped }) } : n,
    );
    const sel = selectGraphTargets(withStamp);
    expect(sel.events.filter((e) => e.event === "freeze")).toEqual([]);
    expect(sel.candidates.map((c) => c.id)).toContain("tactic-multi");
  });

  it("a map entry stale against ONE serving strategy freezes only that strategy", () => {
    const { nodes, sA } = multiServes(null);
    // Fresh against strategy-a, deliberately stale against strategy-b.
    const stamped = { "strategy-a": strategyFingerprint(sA), "strategy-b": "stale-b" };
    const withStamp = nodes.map((n) =>
      n.id === "tactic-multi" ? { ...n, execution: exec({ strategy_fingerprint: stamped }) } : n,
    );
    const sel = selectGraphTargets(withStamp);
    const frozen = sel.events.filter((e) => e.event === "freeze").map((e) => e.strategy);
    expect(frozen).toEqual(["strategy-b"]);
    expect(frozen).not.toContain("strategy-a");
  });

  it("a legacy bare-string stamp freezes every serving strategy (compare-against-all)", () => {
    const { nodes } = multiServes("legacy-single-string");
    const sel = selectGraphTargets(nodes);
    const frozen = sel.events.filter((e) => e.event === "freeze").map((e) => e.strategy).sort();
    // One string cannot match two substance hashes, so both strategies freeze —
    // the legacy behavior this migration preserves until a re-stamp converts it.
    expect(frozen).toEqual(["strategy-a", "strategy-b"]);
  });
});

describe("frozen-node candidates", () => {
  it("a draft tactic (unparked, unblocked) emits an align-tactics candidate", () => {
    const sel = selectGraphTargets([tactic({ id: "tactic-draft", phase: "draft" })]);
    expect(sel.candidates).toHaveLength(1);
    expect(sel.candidates[0]).toMatchObject({
      id: "tactic-draft",
      kind: "tactic",
      phase: "align-tactics",
      pr: null,
      reevaluation: false,
    });
  });

  it("a null-phase (raw) tactic emits an align-tactics candidate", () => {
    const sel = selectGraphTargets([tactic({ id: "tactic-raw", phase: null })]);
    expect(sel.candidates[0]).toMatchObject({
      id: "tactic-raw",
      kind: "tactic",
      phase: "align-tactics",
      reevaluation: false,
    });
  });

  it("a parked draft tactic emits no candidate", () => {
    const nodes = [
      tactic({
        id: "tactic-draft",
        phase: "draft",
        office_hours: { reason: "needs a human", since: "2026-07-01", recommendation: null },
      }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("a draft tactic with a present, not-done blocker emits no candidate", () => {
    const nodes = [
      tactic({ id: "tactic-draft", phase: "draft", blocked_by: ["tactic-b"] }),
      tactic({ id: "tactic-b", phase: "implement" }),
    ];
    // Only the executable blocker candidate; the draft is gated out by its
    // incomplete blocker.
    expect(candidateIds(nodes)).toEqual(["tactic-b"]);
  });

  it("a soft-frozen tactic emits a single align-tactics re-eval candidate carrying its PR", () => {
    const s = strategy({ id: "strategy-s", reading: "validated" });
    const nodes = [
      s,
      tactic({
        id: "tactic-stale",
        serves: ["strategy-s"],
        phase: "implement",
        execution: exec({ pr: 77, strategy_fingerprint: "stale-fingerprint" }),
      }),
    ];
    const sel = selectGraphTargets(nodes);
    const cands = sel.candidates.filter((c) => c.id === "tactic-stale");
    expect(cands).toHaveLength(1);
    expect(cands[0]).toMatchObject({
      kind: "tactic",
      phase: "align-tactics",
      pr: 77,
      reevaluation: true,
    });
    // No executable `implement` candidate for the same id.
    expect(cands.some((c) => c.phase === "implement")).toBe(false);
  });
});

describe("resolveFrozenDescendant", () => {
  it("returns the higher-ranked frozen descendant (draft vs soft-frozen)", () => {
    const s = strategy({ id: "strategy-s", reading: "validated" });
    const nodes = [
      ...kinds(),
      s,
      // A draft child, boosted so it out-ranks the soft-frozen sibling.
      tactic({
        id: "tactic-draft",
        serves: ["strategy-s"],
        phase: "draft",
        attention: { boost: 5, override: null, rationale: "hot" },
      }),
      // A soft-frozen (open, stale-fingerprint) child at lower rank.
      tactic({
        id: "tactic-stale",
        serves: ["strategy-s"],
        phase: "implement",
        execution: exec({ strategy_fingerprint: "stale-fingerprint" }),
      }),
    ];
    const resolved = resolveFrozenDescendant(s, nodes);
    expect(resolved?.id).toBe("tactic-draft");
  });

  it("resolves a descendant reached through the parent chain", () => {
    const s = strategy({ id: "strategy-s", reading: "validated" });
    const nodes = [
      ...kinds(),
      s,
      tactic({ id: "tactic-root", serves: ["strategy-s"], phase: "draft" }),
      // Inherits strategy membership via parent; itself a draft frozen node.
      tactic({ id: "tactic-leaf", parent: "tactic-root", phase: "draft" }),
    ];
    const resolved = resolveFrozenDescendant(s, nodes);
    // Both are drafts at rank 0; id ascending picks tactic-leaf first.
    expect(resolved?.id).toBe("tactic-leaf");
  });

  it("returns null for a strategy with no tactic children", () => {
    const s = strategy({ id: "strategy-s", reading: "validated" });
    expect(resolveFrozenDescendant(s, [...kinds(), s])).toBeNull();
  });

  it("returns null when all descendants are non-frozen (open, in-flight)", () => {
    const s = strategy({ id: "strategy-s", reading: "validated" });
    const nodes = [
      ...kinds(),
      s,
      tactic({ id: "tactic-open", serves: ["strategy-s"], phase: "implement" }),
    ];
    expect(resolveFrozenDescendant(s, nodes)).toBeNull();
  });
});

describe("frozenTacticSelectable", () => {
  it("is true for an eligible draft tactic (agrees with candidate membership)", () => {
    const nodes = [tactic({ id: "tactic-draft", phase: "draft" })];
    expect(frozenTacticSelectable(nodes[0], nodes)).toBe(true);
  });

  it("is false for a non-frozen open tactic (routes to its phase skill, not align-tactics)", () => {
    const nodes = [tactic({ id: "tactic-open", phase: "implement" })];
    expect(frozenTacticSelectable(nodes[0], nodes)).toBe(false);
  });

  it("is false for a parked draft tactic", () => {
    const nodes = [
      tactic({
        id: "tactic-draft",
        phase: "draft",
        office_hours: { reason: "parked", since: "2026-07-01", recommendation: null },
      }),
    ];
    expect(frozenTacticSelectable(nodes[0], nodes)).toBe(false);
  });

  it("is true for a soft-frozen tactic", () => {
    const s = strategy({ id: "strategy-s", reading: "validated" });
    const stale = tactic({
      id: "tactic-stale",
      serves: ["strategy-s"],
      phase: "implement",
      execution: exec({ strategy_fingerprint: "stale-fingerprint" }),
    });
    const nodes = [s, stale];
    expect(frozenTacticSelectable(stale, nodes)).toBe(true);
  });
});

describe("ordering", () => {
  it("resolved attention rank is the outermost axis", () => {
    const nodes = [
      ...kinds(),
      tactic({
        id: "tactic-low",
        phase: "review",
        attention: { boost: 1, override: null, rationale: "low" },
      }),
      tactic({
        id: "tactic-high",
        phase: "implement",
        attention: { boost: 5, override: null, rationale: "high" },
      }),
    ];
    // Higher rank wins even though review is closer to done than implement.
    expect(candidateIds(nodes)).toEqual(["tactic-high", "tactic-low"]);
  });

  it("within one rank level, the progression ordinal orders closest-to-done first (qa sorts before fix)", () => {
    const nodes = [
      strategy({ id: "strategy-s", reading: "validated" }),
      tactic({ id: "tactic-implement", phase: "implement" }),
      tactic({ id: "tactic-review", phase: "review" }),
      tactic({ id: "tactic-qa", phase: "qa" }),
      tactic({ id: "tactic-fix", phase: "fix" }),
    ];
    expect(candidateIds(nodes)).toEqual([
      "tactic-review",
      "tactic-qa",
      "tactic-fix",
      "tactic-implement",
    ]);
  });

  it("an eligible strategy sorts at the align-tactics rung, after tactics of equal rank", () => {
    // Under the progression ordinal, implement (PHASES index 2) is more-progressed
    // than a strategy's align-tactics rung (index 1), so the tactic sorts first.
    const nodes = [
      strategy({ id: "strategy-s" }),
      tactic({ id: "tactic-implement", phase: "implement" }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-implement", "strategy-s"]);
  });

  it("id ascending is the deterministic tiebreak", () => {
    const nodes = [
      tactic({ id: "tactic-b", phase: "implement" }),
      tactic({ id: "tactic-a", phase: "implement" }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-a", "tactic-b"]);
  });

  it("the progression ordinal runs over the full PHASES order", () => {
    expect(PHASES).toEqual([
      "draft",
      "align-tactics",
      "implement",
      "fix",
      "qa",
      "review",
      "main-qa",
      "done",
    ]);
  });
});

describe("strategyFingerprint", () => {
  it("state writes (reading/gap/rounds/office_hours/attention) never change it", () => {
    const base = strategy({ id: "strategy-s" });
    const fp = strategyFingerprint(base);
    expect(strategyFingerprint({ ...base, reading: "new reading" })).toBe(fp);
    expect(strategyFingerprint({ ...base, gap: "new gap" })).toBe(fp);
    expect(
      strategyFingerprint({
        ...base,
        rounds: { count: 1, last_completed: "2026-07-01", last_aligned: null },
      }),
    ).toBe(fp);
    expect(
      strategyFingerprint({ ...base, office_hours: { reason: "r", since: "2026-07-01", recommendation: null } }),
    ).toBe(fp);
    expect(
      strategyFingerprint({ ...base, attention: { boost: 3, override: null, rationale: "r" } }),
    ).toBe(fp);
  });

  it("substance writes change it", () => {
    const base = strategy({ id: "strategy-s" });
    const fp = strategyFingerprint(base);
    expect(strategyFingerprint({ ...base, statement: "changed" })).not.toBe(fp);
    expect(
      strategyFingerprint({
        ...base,
        clarifications: [{ question: "q", answer: "a" }],
      }),
    ).not.toBe(fp);
    expect(
      strategyFingerprint({
        ...base,
        success_signal: { observable: "o", sensor: "s", threshold: "t", is_proxy: false },
      }),
    ).not.toBe(fp);
  });

  it("serves is order-normalized", () => {
    const base = strategy({ id: "strategy-s", serves: ["virtue-a", "virtue-b"] });
    const reordered = strategy({ id: "strategy-s", serves: ["virtue-b", "virtue-a"] });
    expect(strategyFingerprint(base)).toBe(strategyFingerprint(reordered));
  });
});

describe("strategyAlignSelectable", () => {
  // A fixture graph exercising every strategy-selectability branch: a fresh
  // eligible strategy, a validated (dropped) one, a soft-frozen re-evaluation
  // one, a parked one, and a strategy blocked by a non-draft on-path child.
  const fixture = (): IntentionNode[] => {
    const frozenStrategy = strategy({ id: "strategy-frozen" });
    return [
      ...kinds(),
      strategy({ id: "strategy-fresh" }),
      strategy({ id: "strategy-validated", reading: "holding at threshold" }),
      strategy({
        id: "strategy-parked",
        office_hours: { reason: "parked", since: "2026-07-01", recommendation: null },
      }),
      strategy({ id: "strategy-blocked" }),
      tactic({
        id: "tactic-onpath",
        serves: ["strategy-blocked"],
        validates: ["strategy-blocked"],
        phase: "implement",
      }),
      frozenStrategy,
      tactic({
        id: "tactic-frozen-child",
        serves: ["strategy-frozen"],
        phase: "implement",
        execution: exec({ strategy_fingerprint: "stale-fingerprint" }),
      }),
    ];
  };

  it("agrees with selectGraphTargets membership across the fixture graph (behavior-preserving)", () => {
    const nodes = fixture();
    const emitted = new Set(
      selectGraphTargets(nodes)
        .candidates.filter((c) => c.kind === "strategy" && c.phase === "align-tactics")
        .map((c) => c.id),
    );
    for (const n of nodes) {
      expect(strategyAlignSelectable(n, nodes)).toBe(emitted.has(n.id));
    }
  });

  it("is true for a fresh eligible strategy and the frozen re-evaluation strategy", () => {
    const nodes = fixture();
    expect(strategyAlignSelectable(strategy({ id: "strategy-fresh" }), nodes)).toBe(true);
    expect(strategyAlignSelectable(strategy({ id: "strategy-frozen" }), nodes)).toBe(true);
  });

  it("is false for validated, parked, and on-path-blocked strategies", () => {
    const nodes = fixture();
    expect(strategyAlignSelectable(strategy({ id: "strategy-validated" }), nodes)).toBe(false);
    expect(strategyAlignSelectable(strategy({ id: "strategy-parked" }), nodes)).toBe(false);
    expect(strategyAlignSelectable(strategy({ id: "strategy-blocked" }), nodes)).toBe(false);
  });
});

describe("readingDate", () => {
  it("extracts the newest ISO date in the text", () => {
    expect(readingDate("sampled 2026-06-20; re-sampled 2026-07-02, still red")).toBe("2026-07-02");
  });

  it("returns null when no parseable date exists", () => {
    expect(readingDate("single holder, nothing documented")).toBeNull();
  });
});
