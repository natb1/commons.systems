import { describe, expect, it } from "vitest";
import type { Execution, IntentionNode } from "../src/schema.js";
import {
  PHASE_LADDER,
  readingDate,
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

  it("skips draft (explicit and null-phase) and done tactics", () => {
    const nodes = [
      tactic({ id: "tactic-draft", phase: "draft" }),
      tactic({ id: "tactic-nophase", phase: null }),
      tactic({ id: "tactic-done", phase: "done" }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
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

  it("draft children do not block a strategy (drafts are input)", () => {
    const nodes = [
      strategy({ id: "strategy-s" }),
      tactic({ id: "tactic-child", serves: ["strategy-s"], validates: ["strategy-s"], phase: "draft" }),
      tactic({ id: "tactic-child2", serves: ["strategy-s"], validates: ["strategy-s"], phase: null }),
    ];
    expect(candidateIds(nodes)).toEqual(["strategy-s"]);
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
        rounds: { count: 2, last_completed: "2026-07-01T00:00:00Z" },
      }),
    ]);
    expect(sel.candidates).toEqual([]);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "rounds-cap", strategy: "strategy-s" }),
    ]);
  });

  it("fresh-reading gate: rounds.count > 0 with a null reading is stale", () => {
    const sel = selectGraphTargets([
      strategy({
        id: "strategy-s",
        gap: "gapped",
        rounds: { count: 1, last_completed: "2026-07-01T00:00:00Z" },
      }),
    ]);
    expect(sel.candidates).toEqual([]);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "stale-reading", strategy: "strategy-s" }),
    ]);
  });

  it("fresh-reading gate: a reading older than last_completed is stale", () => {
    const sel = selectGraphTargets([
      strategy({
        id: "strategy-s",
        gap: "gapped",
        reading: "sampled 2026-06-20, still red",
        rounds: { count: 1, last_completed: "2026-07-01T00:00:00Z" },
      }),
    ]);
    expect(sel.candidates).toEqual([]);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "stale-reading", strategy: "strategy-s" }),
    ]);
  });

  it("fresh-reading gate: a reading newer than last_completed passes", () => {
    const sel = selectGraphTargets([
      strategy({
        id: "strategy-s",
        gap: "gapped",
        reading: "sampled 2026-07-05, still red",
        rounds: { count: 1, last_completed: "2026-07-01T00:00:00Z" },
      }),
    ]);
    expect(sel.candidates.map((c) => c.id)).toEqual(["strategy-s"]);
  });

  it("first round (rounds.count == 0 or rounds null) is always fresh", () => {
    const nodes = [
      strategy({ id: "strategy-a", rounds: { count: 0, last_completed: null } }),
      strategy({ id: "strategy-b" }),
    ];
    expect(candidateIds(nodes)).toEqual(["strategy-a", "strategy-b"]);
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

  it("a stale fingerprint freezes the subtree and emits one re-evaluation candidate", () => {
    const sel = selectGraphTargets(frozenGraph("stale-fingerprint"));
    // Both subtree tactics are excluded; the strategy surfaces as the one
    // queued re-evaluation /align-tactics session.
    expect(sel.candidates.map((c) => c.id)).toEqual(["strategy-s"]);
    expect(sel.candidates[0]?.reevaluation).toBe(true);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "freeze", strategy: "strategy-s" }),
    ]);
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

  it("a parked strategy emits no re-evaluation candidate even when frozen", () => {
    const nodes = frozenGraph("stale-fingerprint").map((n) =>
      n.id === "strategy-s"
        ? { ...n, office_hours: { reason: "parked", since: "2026-07-01", recommendation: null } }
        : n,
    );
    const sel = selectGraphTargets(nodes);
    expect(sel.candidates).toEqual([]);
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "freeze", strategy: "strategy-s" }),
    ]);
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

  it("within one rank level, the phase ladder orders closest-to-done first", () => {
    const nodes = [
      strategy({ id: "strategy-s", reading: "validated" }),
      tactic({ id: "tactic-implement", phase: "implement" }),
      tactic({ id: "tactic-review", phase: "review" }),
      tactic({ id: "tactic-qa", phase: "qa" }),
      tactic({ id: "tactic-fix", phase: "fix" }),
    ];
    expect(candidateIds(nodes)).toEqual([
      "tactic-review",
      "tactic-fix",
      "tactic-qa",
      "tactic-implement",
    ]);
  });

  it("an eligible strategy sorts at the align-tactics rung, after tactics of equal rank", () => {
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

  it("the ladder covers every selectable phase", () => {
    expect(PHASE_LADDER).toEqual(["main-qa", "review", "fix", "qa", "implement", "align-tactics"]);
  });
});

describe("strategyFingerprint", () => {
  it("state writes (reading/gap/rounds/office_hours/attention) never change it", () => {
    const base = strategy({ id: "strategy-s" });
    const fp = strategyFingerprint(base);
    expect(strategyFingerprint({ ...base, reading: "new reading" })).toBe(fp);
    expect(strategyFingerprint({ ...base, gap: "new gap" })).toBe(fp);
    expect(
      strategyFingerprint({ ...base, rounds: { count: 1, last_completed: "2026-07-01" } }),
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
