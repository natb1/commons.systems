import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Execution, IntentionNode, SuccessSignal } from "../src/schema.js";
import { PHASES } from "../src/schema.js";
import {
  FLEET_ALARM_KINDS,
  frozenTacticSelectable,
  readingDate,
  resolveFrozenDescendant,
  selectGraphTargets,
  strategyAlignSelectable,
  strategyFingerprint,
  tacticScopeFingerprint,
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

/** A tactic fixture. */
function tactic(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ ...partial, kind: "tactic" });
}

/**
 * A strategy fixture. Defaults to an UNVALIDATED signal (`reading: null`,
 * which alone makes `isSignalUnvalidated` true regardless of the derived
 * `gap`) — the state in which a strategy is a candidate for an
 * `/align-tactics` session.
 */
function strategy(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ ...partial, kind: "strategy" });
}

/**
 * A `success_signal` whose threshold ("green") a fixture's `reading` string
 * (e.g. "fresh 2026-07-06") never happens to equal, so `deriveGap` (see
 * sensors.ts) reports a non-null gap — the "signal named, reading present,
 * still gapped" fixture shape several `selectGraphTargets`/`strategyAlignSelectable`
 * tests below need, now that `gap` is derived on read rather than authored
 * directly on the fixture.
 */
const GAPPED_SIGNAL: SuccessSignal = {
  observable: "o",
  sensor: "s",
  threshold: "green",
  is_proxy: false,
};

/** An in-flight execution record fixture. */
function exec(partial: Partial<Execution> = {}): Execution {
  return {
    branch: partial.branch ?? "some-branch",
    pr: partial.pr ?? null,
    attempts: partial.attempts ?? {},
    markers: partial.markers ?? [],
    strategy_fingerprint: partial.strategy_fingerprint ?? null,
    fix: partial.fix ?? null,
    conflict: partial.conflict ?? null,
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
        office_hours: { reason: "needs a human", since: "2026-07-01", recommendation: null, session_type: "other" },
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
      tactic({ id: "tactic-a", phase: "qa", pace_exempt: true, execution: exec({ pr: 42 }) }),
    ]);
    expect(sel.candidates[0]).toMatchObject({ pace_exempt: true, pr: 42 });
  });

  it("overrides phase to 'fix' and surfaces execution.fix when a CI-fix interrupt is active", () => {
    // The ladder phase (qa) is preserved on the node; the candidate is emitted as
    // a fix candidate and carries the raw interrupt state for the shell gate's
    // pending-CI guard.
    const fix = { since: "2026-07-18", attempt: 2, pushed_sha: "abc123" };
    const sel = selectGraphTargets([
      tactic({ id: "tactic-a", phase: "qa", execution: exec({ pr: 42, fix }) }),
    ]);
    const c = sel.candidates.find((x) => x.id === "tactic-a");
    expect(c?.phase).toBe("fix");
    expect(c?.fix).toEqual(fix);
  });

  it("surfaces fix:null and the real ladder phase when no interrupt is active", () => {
    const sel = selectGraphTargets([
      tactic({ id: "tactic-a", phase: "qa", execution: exec({ pr: 42 }) }),
    ]);
    const c = sel.candidates.find((x) => x.id === "tactic-a");
    expect(c?.phase).toBe("qa");
    expect(c?.fix).toBeNull();
  });

  it("surfaces a phase:review reviewed tactic as a pending-merge candidate", () => {
    // tactic-graph-router-conflict-routing: the reviewed-marker EXCLUSION is
    // retired. A reviewed node awaiting its armed auto-merge is emitted as
    // `pending-merge` so the shell sensor gate can read its mergeability every
    // tick — but never as `review`, which would re-run the finished review pass.
    const nodes = [
      tactic({
        id: "tactic-reviewed",
        phase: "review",
        execution: exec({ markers: ["reviewed"] }),
      }),
    ];
    const sel = selectGraphTargets(nodes);
    expect(candidateIds(nodes)).toEqual(["tactic-reviewed"]);
    expect(sel.candidates[0]).toMatchObject({ id: "tactic-reviewed", phase: "pending-merge" });
  });

  it("emits a reviewed tactic as 'conflict' — never pending-merge — while execution.conflict is set", () => {
    const conflict = { since: "2026-08-03", attempt: 1 };
    const nodes = [
      tactic({
        id: "tactic-conflicted",
        phase: "review",
        execution: exec({ markers: ["reviewed"], conflict }),
      }),
    ];
    const sel = selectGraphTargets(nodes);
    expect(candidateIds(nodes)).toEqual(["tactic-conflicted"]);
    expect(sel.candidates[0]?.phase).toBe("conflict");
  });

  it("gives execution.fix precedence over execution.conflict", () => {
    // Both interrupts set: `fix` wins, exactly as it already outranks the
    // ladder phase.
    const nodes = [
      tactic({
        id: "tactic-both",
        phase: "review",
        execution: exec({
          markers: ["reviewed"],
          fix: { since: "2026-08-01", attempt: 1, pushed_sha: null },
          conflict: { since: "2026-08-03", attempt: 1 },
        }),
      }),
    ];
    expect(selectGraphTargets(nodes).candidates[0]?.phase).toBe("fix");
  });

  it("never emits a reviewed tactic at phase 'review', under any interrupt combination", () => {
    const fix = { since: "2026-08-01", attempt: 1, pushed_sha: null };
    const conflict = { since: "2026-08-03", attempt: 1 };
    const combos: Array<Partial<Execution>> = [
      { markers: ["reviewed"] },
      { markers: ["reviewed"], fix },
      { markers: ["reviewed"], conflict },
      { markers: ["reviewed"], fix, conflict },
    ];
    for (const [i, partial] of combos.entries()) {
      const nodes = [tactic({ id: `tactic-r${i}`, phase: "review", execution: exec(partial) })];
      const sel = selectGraphTargets(nodes);
      expect(sel.candidates).toHaveLength(1);
      expect(sel.candidates[0]?.phase).not.toBe("review");
    }
  });

  it("re-surfaces a phase:review reviewed tactic as a fix candidate once execution.fix is set", () => {
    const fix = { since: "2026-07-18", attempt: 1, pushed_sha: null };
    const nodes = [
      tactic({
        id: "tactic-review-stalled",
        phase: "review",
        execution: { ...exec({ markers: ["reviewed"] }), fix },
      }),
    ];
    const sel = selectGraphTargets(nodes);
    expect(candidateIds(nodes)).toEqual(["tactic-review-stalled"]);
    expect(sel.candidates[0]).toMatchObject({ id: "tactic-review-stalled", phase: "fix" });
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

  it("emits a fix candidate when execution.fix is set, regardless of the real ladder phase", () => {
    // A CI-fix interrupt is carried orthogonally on execution.fix; the node's
    // real phase (e.g. qa) stays put, but the candidate surfaces as phase:"fix".
    const nodes = [
      tactic({
        id: "tactic-under-fix",
        phase: "qa",
        execution: { ...exec({ pr: 7 }), fix: { since: "2026-07-18", attempt: 1, pushed_sha: null } },
      }),
    ];
    const sel = selectGraphTargets(nodes);
    expect(sel.candidates[0]).toMatchObject({ id: "tactic-under-fix", phase: "fix" });
  });

  it("emits the real ladder phase when execution.fix is unset", () => {
    const nodes = [
      tactic({ id: "tactic-clean", phase: "qa", execution: { ...exec({ pr: 7 }), fix: null } }),
    ];
    const sel = selectGraphTargets(nodes);
    expect(sel.candidates[0]).toMatchObject({ id: "tactic-clean", phase: "qa" });
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
      strategy({ id: "strategy-s", office_hours: { reason: "capped", since: "2026-07-01", recommendation: null, session_type: "other" } }),
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

  it("a persisted done child on the path re-enables the strategy's next align round", () => {
    // reconcile-graph writes `phase: "done"` and LEAVES the tactic on disk, so a
    // completed child stays on the signal path (computeSignalPath does not filter
    // by phase). It must not disqualify the strategy, or every strategy that
    // completes one tactic would drop out of the queue permanently.
    const nodes = [
      strategy({ id: "strategy-s" }),
      tactic({ id: "tactic-child", serves: ["strategy-s"], validates: ["strategy-s"], phase: "done" }),
    ];
    expect(candidateIds(nodes)).toContain("strategy-s");
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

  it("skips a strategy whose signal is validated (reading meets threshold, no gap)", () => {
    const nodes = [
      strategy({
        id: "strategy-s",
        success_signal: { ...GAPPED_SIGNAL, threshold: "holding at threshold" },
        reading: "holding at threshold",
      }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("a validated-but-gapped signal keeps the strategy eligible", () => {
    const nodes = [
      strategy({
        id: "strategy-s",
        success_signal: GAPPED_SIGNAL,
        reading: "below threshold",
      }),
    ];
    expect(candidateIds(nodes)).toEqual(["strategy-s"]);
  });

  it("skips at the rounds cap and logs a rounds-cap event", () => {
    const sel = selectGraphTargets([
      strategy({
        id: "strategy-s",
        success_signal: GAPPED_SIGNAL,
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
        success_signal: GAPPED_SIGNAL,
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
        success_signal: GAPPED_SIGNAL,
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
        success_signal: GAPPED_SIGNAL,
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
        success_signal: GAPPED_SIGNAL,
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
    // tactic-freeze-resurface-stale-children-only: the freeze scan only sweeps
    // children whose OWN stamp is stale against the serving strategy's current
    // fingerprint. tactic-stale is stale and gets excluded from its normal
    // phase skill and re-emitted as an align-tactics re-evaluation candidate.
    // tactic-sibling was never stamped (execution: null) and is not in the
    // `stale` list, so it is not frozen — it keeps emitting its normal `qa`
    // candidate. strategy-s ALSO emits its own fresh round here because its
    // frozen children carry no `validates` edge — they are off the signal
    // path, so the fresh-round child gate does not block the strategy.
    // Order: rank 0 across the board, then progression ordinal desc over each
    // node's REAL phase (tactic-sibling qa=4 > tactic-stale implement=2 >
    // strategy-s align=1) — progressionIndex ranks by each node's real phase
    // regardless of freeze status, so the candidate order is unchanged by
    // the fix.
    expect(sel.candidates.map((c) => c.id)).toEqual([
      "tactic-sibling",
      "tactic-stale",
      "strategy-s",
    ]);
    const stale = sel.candidates.find((c) => c.id === "tactic-stale");
    const sibling = sel.candidates.find((c) => c.id === "tactic-sibling");
    expect(stale).toMatchObject({ kind: "tactic", phase: "align-tactics", reevaluation: true });
    expect(sibling).toMatchObject({ kind: "tactic", phase: "qa", reevaluation: false });
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "freeze", strategy: "strategy-s" }),
    ]);
  });

  it("a fresh- or null-stamped sibling is not frozen or re-surfaced by a stale sibling's freeze", () => {
    const s = strategy({ id: "strategy-s" });
    const nodes: IntentionNode[] = [
      s,
      tactic({
        id: "tactic-stale",
        serves: ["strategy-s"],
        phase: "implement",
        execution: exec({ strategy_fingerprint: "stale-fingerprint" }),
      }),
      tactic({
        id: "tactic-fresh",
        serves: ["strategy-s"],
        phase: "qa",
        execution: exec({ strategy_fingerprint: strategyFingerprint(s) }),
      }),
      tactic({ id: "tactic-null-stamp", serves: ["strategy-s"], phase: "review" }),
    ];
    const sel = selectGraphTargets(nodes);
    expect(sel.candidates.find((c) => c.id === "tactic-fresh")).toMatchObject({
      phase: "qa",
      reevaluation: false,
    });
    expect(sel.candidates.find((c) => c.id === "tactic-null-stamp")).toMatchObject({
      phase: "review",
      reevaluation: false,
    });
    const frozenCandidates = sel.candidates.filter(
      (c) => c.kind === "tactic" && c.phase === "align-tactics",
    );
    expect(frozenCandidates.map((c) => c.id)).toEqual(["tactic-stale"]);
    const freezeEvent = sel.events.find((e) => e.event === "freeze");
    expect(freezeEvent?.detail).toContain("tactic-stale");
    expect(freezeEvent?.detail).not.toContain("tactic-fresh");
    expect(freezeEvent?.detail).not.toContain("tactic-null-stamp");
  });

  it("a frozen tactic's normal phase-skill candidate is suppressed (only align-tactics remains)", () => {
    const sel = selectGraphTargets(frozenGraph("stale-fingerprint"));
    // tactic-stale is at phase `implement` and is stale, so it is excluded
    // from its normal phase skill and only its align-tactics re-eval
    // candidate remains. tactic-sibling was never stamped, is not frozen, and
    // still emits its normal `qa` phase-skill candidate.
    const staleCands = sel.candidates.filter((c) => c.id === "tactic-stale");
    expect(staleCands).toHaveLength(1);
    expect(staleCands[0]).toMatchObject({ phase: "align-tactics" });
    const siblingCands = sel.candidates.filter((c) => c.id === "tactic-sibling");
    expect(siblingCands).toHaveLength(1);
    expect(siblingCands[0]).toMatchObject({ phase: "qa" });
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
    // is gated out. tactic-stale is stale and still emits its align-tactics
    // re-eval candidate. tactic-sibling was never frozen (never stamped), and
    // tactic candidacy never reads the serving strategy's office_hours, so it
    // keeps emitting its normal `qa` candidate regardless of the strategy's
    // park.
    const nodes = frozenGraph("stale-fingerprint").map((n) =>
      n.id === "strategy-s"
        ? { ...n, office_hours: { reason: "parked", since: "2026-07-01", recommendation: null, session_type: "other" as const } }
        : n,
    );
    const sel = selectGraphTargets(nodes);
    expect(sel.candidates.map((c) => c.id)).toEqual(["tactic-sibling", "tactic-stale"]);
    const sibling = sel.candidates.find((c) => c.id === "tactic-sibling");
    const stale = sel.candidates.find((c) => c.id === "tactic-stale");
    expect(sibling).toMatchObject({ phase: "qa", reevaluation: false });
    expect(stale).toMatchObject({ phase: "align-tactics", reevaluation: true });
    expect(sel.events).toEqual([
      expect.objectContaining({ event: "freeze", strategy: "strategy-s" }),
    ]);
  });

  it("parking a frozen tactic drops its own re-eval candidate", () => {
    // office_hours gating applies to the frozen-tactic emission too.
    const nodes = frozenGraph("stale-fingerprint").map((n) =>
      n.id === "tactic-stale"
        ? { ...n, office_hours: { reason: "parked", since: "2026-07-01", recommendation: null, session_type: "other" as const } }
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

  it("an object-form {hash, sha} map entry fresh against its .hash produces no freeze", () => {
    const { nodes, sA, sB } = multiServes(null);
    const stamped = {
      "strategy-a": { hash: strategyFingerprint(sA), sha: "some-sha-a" },
      "strategy-b": { hash: strategyFingerprint(sB), sha: "some-sha-b" },
    };
    const withStamp = nodes.map((n) =>
      n.id === "tactic-multi" ? { ...n, execution: exec({ strategy_fingerprint: stamped }) } : n,
    );
    const sel = selectGraphTargets(withStamp);
    expect(sel.events.filter((e) => e.event === "freeze")).toEqual([]);
    expect(sel.candidates.map((c) => c.id)).toContain("tactic-multi");
  });

  it("an object-form {hash, sha} map entry stale against its .hash freezes that strategy", () => {
    const { nodes, sA } = multiServes(null);
    // Fresh against strategy-a, deliberately stale (wrong .hash) against strategy-b.
    const stamped = {
      "strategy-a": { hash: strategyFingerprint(sA), sha: "some-sha-a" },
      "strategy-b": { hash: "stale-b", sha: "some-sha-b" },
    };
    const withStamp = nodes.map((n) =>
      n.id === "tactic-multi" ? { ...n, execution: exec({ strategy_fingerprint: stamped }) } : n,
    );
    const sel = selectGraphTargets(withStamp);
    const frozen = sel.events.filter((e) => e.event === "freeze").map((e) => e.strategy);
    expect(frozen).toEqual(["strategy-b"]);
    expect(frozen).not.toContain("strategy-a");
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

  it("a tactic named as another tactic's parent is not draft-selectable, even though it is phase-null", () => {
    const nodes = [
      tactic({ id: "tactic-parent", phase: null }),
      tactic({ id: "tactic-child", phase: null, parent: "tactic-parent" }),
    ];
    const ids = candidateIds(nodes);
    expect(ids).toContain("tactic-child");
    expect(ids).not.toContain("tactic-parent");
  });

  it("an armed WAIT node (phase-null, canonical id) is not draft-selectable", () => {
    // tactic-wait-calendar-release Unit 4: an armed WAIT node is phase-null
    // and office_hours-null by construction, so without the router's WAIT
    // exclusion it would look exactly like an undecomposed draft.
    const nodes = [
      tactic({
        id: "tactic-wait-source",
        phase: null,
        attributes: { wait_for: "tactic-source", wait_until: "2026-08-07T00:00:00Z" },
      }),
      tactic({ id: "tactic-source", phase: "implement", blocked_by: ["tactic-wait-source"] }),
    ];
    // The WAIT itself emits nothing; its source is blocked by the (not-done)
    // WAIT and also emits nothing.
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("a released WAIT (phase: done) emits no candidate and unblocks its source", () => {
    const nodes = [
      tactic({
        id: "tactic-wait-source",
        phase: "done",
        attributes: { wait_for: "tactic-source", wait_until: "2026-08-07T00:00:00Z" },
      }),
      tactic({ id: "tactic-source", phase: "implement", blocked_by: ["tactic-wait-source"] }),
    ];
    // The done WAIT isn't open (not draft-selectable, not an open tactic), and
    // its source's blocker is now satisfied (blockersComplete: blocker is
    // phase "done"), so the source's real `implement` candidate surfaces.
    expect(candidateIds(nodes)).toEqual(["tactic-source"]);
  });

  it("a wait_for attribute under a NON-canonical id is treated as an ordinary draft", () => {
    // isWaitNode is keyed on the canonical id (waitIdFor(wait_for)), not mere
    // presence of `wait_for` — a decoy id must not be excluded.
    const nodes = [
      tactic({
        id: "tactic-not-the-wait-id",
        phase: null,
        attributes: { wait_for: "tactic-source", wait_until: "2026-08-07T00:00:00Z" },
      }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-not-the-wait-id"]);
  });

  it("a tactic-fleet-alarm-<kind> draft is not draft-selectable (tactic-fleet-alarm-node-park-clobber-loop, ruling (a))", () => {
    // dispatch-fleet-alarm mints these nodes phase-null (draft shape) and
    // resolves them exclusively via --resolve (phase -> done); /align-tactics
    // must never treat one as an undecomposed draft, or a worker spawned on
    // it could only ever freeze (there is nothing for it to decompose).
    const nodes = [
      tactic({ id: "tactic-fleet-alarm-unclaimed-hold", phase: null }),
      tactic({ id: "tactic-fleet-alarm-busy-stall", phase: null }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("a tactic-fleet-alarm-<kind> draft carrying an office_hours park still emits no candidate", () => {
    // The park-survival half of the fix lives in dispatch-fleet-alarm's
    // classify() (shell layer, not this pure selector) — but the selector's
    // own exclusion must hold regardless of office_hours, since the whole
    // point is these nodes are never worked by /align-tactics at all.
    const nodes = [
      tactic({
        id: "tactic-fleet-alarm-unclaimed-hold",
        phase: null,
        office_hours: {
          reason: "worker session froze",
          since: "2026-08-01",
          recommendation: null,
          session_type: "other",
        },
      }),
    ];
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("an id that merely starts with the fleet-alarm prefix, without a kind segment, is treated as an ordinary draft", () => {
    // Boundary check on the anchored regex: `tactic-fleet-alarm` alone (no
    // trailing `-<kind>`) is not a member of the reserved id family.
    const nodes = [tactic({ id: "tactic-fleet-alarm", phase: null })];
    expect(candidateIds(nodes)).toEqual(["tactic-fleet-alarm"]);
  });

  it("an id that continues past the fleet-alarm prefix with a different word is treated as an ordinary draft", () => {
    // `startsWith("tactic-fleet-alarm-")` would wrongly swallow this; the
    // ANCHORED regex only matches the exact reserved shape, mirroring the
    // dispatch-graph-main-red-sync bare-prefix incident dispatch-fleet-alarm's
    // own comments warn against.
    const nodes = [tactic({ id: "tactic-fleet-alarmist-review", phase: null })];
    expect(candidateIds(nodes)).toEqual(["tactic-fleet-alarmist-review"]);
  });

  it("EVERY kind in the closed enum is excluded — the whole family, not a sample", () => {
    // The two cases above happen to name two kinds; this one is exhaustive, so
    // adding a kind to FLEET_ALARM_KINDS without wiring it into the exclusion
    // regex fails here rather than silently leaving that alarm node selectable.
    const nodes = FLEET_ALARM_KINDS.map((k) => tactic({ id: `tactic-fleet-alarm-${k}`, phase: null }));
    expect(candidateIds(nodes)).toEqual([]);
  });

  it("a hand-authored tactic-fleet-alarm-* draft whose slug is NOT an alarm kind is still emitted", () => {
    // The regression this pins: the exclusion regex used to anchor the SHAPE
    // (`^tactic-fleet-alarm-[a-z0-9]+(?:-[a-z0-9]+)*$`) rather than the closed
    // MEMBERSHIP, so it swallowed every hand-authored node whose id happened to
    // start with the reserved prefix. These four are the real ones in the live
    // store at the time of the fix — genuine undecomposed work nodes (kind:
    // tactic, status: raw, phase: null) — and shape-anchoring made all four
    // PERMANENTLY unselectable, including the very node this unit exists to
    // close. Anchoring the shape is not anchoring the membership.
    const ids = [
      "tactic-fleet-alarm-daemon-casualty-list",
      "tactic-fleet-alarm-mint-rollback-corruption",
      "tactic-fleet-alarm-node-park-clobber-loop",
      "tactic-fleet-alarm-resolve-rollback-latch",
    ];
    const nodes = ids.map((id) => tactic({ id, phase: null }));
    expect(candidateIds(nodes).sort()).toEqual([...ids].sort());
  });

  it("a parked draft tactic emits no candidate", () => {
    const nodes = [
      tactic({
        id: "tactic-draft",
        phase: "draft",
        office_hours: { reason: "needs a human", since: "2026-07-01", recommendation: null, session_type: "other" },
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
        attention: { boosts: { "1": 5 }, rationale: "hot" },
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
    // Both are drafts with band 0 and score 0, so `depth` — the innermost key
    // component — decides: tactic-leaf's lineage is {tactic-root, strategy-s}
    // (depth 2) against tactic-root's {strategy-s} (depth 1), and a deeper
    // child outranks its parent. (id ascending would pick the same node here.)
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
        office_hours: { reason: "parked", since: "2026-07-01", recommendation: null, session_type: "other" },
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
        attention: { boosts: { "1": 1 }, rationale: "low" },
      }),
      tactic({
        id: "tactic-high",
        phase: "implement",
        attention: { boosts: { "1": 5 }, rationale: "high" },
      }),
    ];
    // Higher rank wins even though review is closer to done than implement.
    expect(candidateIds(nodes)).toEqual(["tactic-high", "tactic-low"]);
  });

  it("within one rank level, the progression ordinal orders closest-to-done first", () => {
    const nodes = [
      strategy({ id: "strategy-s", reading: "validated" }),
      tactic({ id: "tactic-implement", phase: "implement" }),
      tactic({ id: "tactic-review", phase: "review" }),
      tactic({ id: "tactic-qa", phase: "qa" }),
    ];
    expect(candidateIds(nodes)).toEqual([
      "tactic-review",
      "tactic-qa",
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

  it("tier is the OUTER axis: a tier-2 node at rank 0 beats a heavily boosted tier-1 node", () => {
    const nodes = [
      ...kinds(),
      tactic({
        id: "tactic-hot-tier1",
        phase: "implement",
        attention: { boosts: { "1": 99 }, rationale: "very hot" },
      }),
      tactic({ id: "tactic-bug", phase: "implement", attributes: { bug_fix: true } }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-bug", "tactic-hot-tier1"]);
    const sel = selectGraphTargets(nodes);
    // tactic-bug: tier 2 (bug_fix), no parents (band 0, depth 0), and no
    // tier-2 boost anywhere in its lineage (score 0). It still wins on tier.
    expect(sel.candidates[0]).toMatchObject({
      id: "tactic-bug",
      key: { tier: 2, band: 0, score: 0, depth: 0 },
    });
  });

  it("tier 3 sorts ahead of tier 2", () => {
    const nodes = [
      ...kinds(),
      tactic({ id: "tactic-t2", phase: "implement", attributes: { bug_fix: true } }),
      tactic({ id: "tactic-t3", phase: "implement", attributes: { tier: 3 } }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-t3", "tactic-t2"]);
  });

  it("within one tier, boost still orders normally", () => {
    const nodes = [
      ...kinds(),
      tactic({
        id: "tactic-t2-low",
        phase: "implement",
        attributes: { bug_fix: true },
        attention: { boosts: { "2": 1 }, rationale: "low" },
      }),
      tactic({
        id: "tactic-t2-high",
        phase: "implement",
        attributes: { bug_fix: true },
        attention: { boosts: { "2": 5 }, rationale: "high" },
      }),
    ];
    expect(candidateIds(nodes)).toEqual(["tactic-t2-high", "tactic-t2-low"]);
  });

  it("a blocker inherits the blocked node's tier structurally — no separate lift", () => {
    // Under the unified relation a node's BLOCKEES are among its parents, so
    // the tier-3 urgency of what waits on tactic-blocker reaches it through the
    // resolver's ordinary tier fixpoint. There is no second reported/lifted
    // pair: the candidate carries one key, and its tier IS 3.
    const nodes = [
      ...kinds(),
      tactic({
        id: "tactic-blocker",
        phase: "implement",
        blocked_by: [],
      }),
      // Tier-3 and blocked: itself ineligible, so its urgency reaches selection
      // only as tactic-blocker's inherited tier.
      tactic({
        id: "tactic-blocked",
        phase: "implement",
        attributes: { tier: 3 },
        blocked_by: ["tactic-blocker"],
      }),
      // A tier-2 node that would otherwise sort first.
      tactic({ id: "tactic-other", phase: "implement", attributes: { bug_fix: true } }),
    ];
    const sel = selectGraphTargets(nodes);
    expect(sel.candidates.map((c) => c.id)).toEqual(["tactic-blocker", "tactic-other"]);
    const blocker = sel.candidates.find((c) => c.id === "tactic-blocker");
    // tier 3 inherited from its one parent (tactic-blocked); band 0 because
    // that parent carries no tier-3 score; score 0 (no boosts anywhere);
    // depth 1 (lineage = {tactic-blocked}).
    expect(blocker?.key).toEqual({ tier: 3, band: 0, score: 0, depth: 1 });
  });

  it("tier inheritance is transitive: a blocker of a blocker of a tier-3 node resolves tier 3", () => {
    const nodes = [
      ...kinds(),
      tactic({ id: "tactic-root-blocker", phase: "implement" }),
      tactic({ id: "tactic-mid", phase: "implement", blocked_by: ["tactic-root-blocker"] }),
      tactic({
        id: "tactic-top",
        phase: "implement",
        attributes: { tier: 3 },
        blocked_by: ["tactic-mid"],
      }),
    ];
    const sel = selectGraphTargets(nodes);
    expect(sel.candidates.map((c) => c.id)).toEqual(["tactic-root-blocker"]);
    // lineage = {tactic-mid, tactic-top} → depth 2; no boosts, so band/score 0.
    expect(sel.candidates[0]?.key).toEqual({ tier: 3, band: 0, score: 0, depth: 2 });
  });

  it("blocking TWO tier-3 nodes: tier and band take the MAX, score sums the deduped lineage", () => {
    const nodes = [
      ...kinds(),
      tactic({ id: "tactic-blocker", phase: "implement" }),
      tactic({
        id: "tactic-t3-a",
        phase: "implement",
        attributes: { tier: 3 },
        attention: { boosts: { "3": 4 }, rationale: "a" },
        blocked_by: ["tactic-blocker"],
      }),
      tactic({
        id: "tactic-t3-b",
        phase: "implement",
        attributes: { tier: 3 },
        attention: { boosts: { "3": 6 }, rationale: "b" },
        blocked_by: ["tactic-blocker"],
      }),
    ];
    const sel = selectGraphTargets(nodes);
    const blocker = sel.candidates.find((c) => c.id === "tactic-blocker");
    // Both blockees are parents of tactic-blocker.
    //  - tier: max(1, 3, 3) = 3 — never 6; tier is a namespace, not a magnitude.
    //  - band: max over parents of their tier-3 score = max(4, 6) = 6.
    //  - score: the node's own contribution (0) plus its deduped lineage's
    //    ({tactic-t3-a, tactic-t3-b}) = 4 + 6 = 10. Score IS additive over
    //    lineage under the unified relation — that is the axis that grows when
    //    a node holds up more work; band is what stays max-based.
    //  - depth: |lineage| = 2.
    expect(blocker?.key).toEqual({ tier: 3, band: 6, score: 10, depth: 2 });
  });

  it("a blocked_by cycle neither throws nor loops, and costs unrelated nodes nothing", () => {
    const nodes = [
      ...kinds(),
      tactic({ id: "tactic-a", phase: "implement", blocked_by: ["tactic-b"] }),
      tactic({ id: "tactic-b", phase: "implement", blocked_by: ["tactic-a"] }),
      // An unrelated healthy node: the cycle must not cost it its candidacy.
      tactic({ id: "tactic-healthy", phase: "implement" }),
    ];
    // The resolver converges a mixed cycle silently (the set-union fixpoint is
    // bounded), so selection logs NO event for it — rejecting such a cycle on
    // the write path belongs to tactic-attention-unified-relation-cycle-rule.
    const sel = selectGraphTargets(nodes);
    // Both cycle members are gated out by blockersComplete (as any blocked node
    // is), but the rest of the store still selects.
    expect(sel.candidates.map((c) => c.id)).toEqual(["tactic-healthy"]);
    expect(sel.events).toEqual([]);
    // Unrelated node: untouched by the cycle, at the neutral baseline.
    expect(sel.candidates[0]?.key).toEqual({ tier: 1, band: 0, score: 0, depth: 0 });
  });

  it("a cycle member's tier still reaches an out-of-cycle blocker, and resolution terminates", () => {
    const nodes = [
      ...kinds(),
      // tactic-a and tactic-b block each other (the cycle); tactic-outside also
      // blocks tactic-a, so tactic-a is among tactic-outside's parents.
      tactic({ id: "tactic-a", phase: "implement", blocked_by: ["tactic-b", "tactic-outside"] }),
      tactic({
        id: "tactic-b",
        phase: "implement",
        attributes: { tier: 3 },
        blocked_by: ["tactic-a"],
      }),
      tactic({ id: "tactic-outside", phase: "implement" }),
    ];
    const sel = selectGraphTargets(nodes);
    // Only tactic-outside is unblocked.
    expect(sel.candidates.map((c) => c.id)).toEqual(["tactic-outside"]);
    // tactic-b's tier 3 propagates b -> a (a's parent) -> outside (a is
    // outside's parent). lineage(outside) = {tactic-a} ∪ lineage(tactic-a) =
    // {tactic-a, tactic-b} → depth 2. No boosts anywhere, so band/score 0.
    expect(sel.candidates[0]?.key).toEqual({ tier: 3, band: 0, score: 0, depth: 2 });
  });

  it("the progression ordinal runs over the full PHASES order", () => {
    expect(PHASES).toEqual([
      "draft",
      "align-tactics",
      "implement",
      "qa",
      "review",
      "main-qa",
      "done",
    ]);
  });
});

describe("strategyFingerprint", () => {
  it("state writes (reading/rounds/office_hours/attention) never change it — `gap` is derived on read, not a stored field to fingerprint", () => {
    const base = strategy({ id: "strategy-s" });
    const fp = strategyFingerprint(base);
    expect(strategyFingerprint({ ...base, reading: "new reading" })).toBe(fp);
    expect(
      strategyFingerprint({
        ...base,
        rounds: { count: 1, last_completed: "2026-07-01", last_aligned: null },
      }),
    ).toBe(fp);
    expect(
      strategyFingerprint({ ...base, office_hours: { reason: "r", since: "2026-07-01", recommendation: null, session_type: "other" } }),
    ).toBe(fp);
    expect(
      strategyFingerprint({ ...base, attention: { boosts: { "1": 3 }, rationale: "r" } }),
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

  /**
   * `attributes.measured_impact` must stay OUT of the substance set: a ledger
   * entry is re-measured routinely, and if a re-measurement moved the
   * fingerprint every open child of the measured node would soft-freeze.
   *
   * The exemption is by construction — the substance object is an explicit
   * allowlist of six fields, with no denylist to add `measured_impact` to — so
   * this test is the guard: it goes red the moment someone widens the allowlist
   * to include it. `attributes.conditions` is the control, confirming the test
   * would notice a substance field that IS hashed.
   */
  it("attributes.measured_impact never changes it (re-measuring must not freeze open children)", () => {
    const base = strategy({ id: "strategy-s", attributes: { conditions: ["c"] } });
    const fp = strategyFingerprint(base);
    const measured = strategyFingerprint({
      ...base,
      attributes: {
        ...base.attributes,
        measured_impact: [
          {
            metric: "recurrence_count",
            value: 4,
            unit: "occurrences",
            window: "7d",
            sensor: "token-economy-sensor",
            measured: "2026-08-12",
          },
        ],
      },
    });
    expect(measured).toBe(fp);
    // Control: a substance field inside the same `attributes` record does move it.
    expect(
      strategyFingerprint({ ...base, attributes: { ...base.attributes, conditions: ["c2"] } }),
    ).not.toBe(fp);
  });
});

describe("tacticScopeFingerprint", () => {
  /**
   * The scope stamp hashes `(statement, body)` and NO frontmatter, so
   * `attributes.measured_impact` cannot reach it even in principle. Asserted
   * through the public signature — the function takes no node — so this stays
   * true no matter what the frontmatter carries.
   */
  it("is a function of statement and body alone, so no attributes key can move it", () => {
    const statement = "Ledger the finding.";
    const body = "# Ledger the finding.\n";
    const fp = tacticScopeFingerprint(statement, body);
    expect(tacticScopeFingerprint(statement, body)).toBe(fp);
    expect(tacticScopeFingerprint(statement, `${body}\nResidue appended.\n`)).not.toBe(fp);
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
        office_hours: { reason: "parked", since: "2026-07-01", recommendation: null, session_type: "other" },
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

describe("FLEET_ALARM_KINDS drift guard", () => {
  // The alarm-kind enum exists in two places by necessity: this TS list (which
  // builds the router's candidate-exclusion regex) and the bash `KINDS=(...)`
  // array in dispatch-fleet-alarm (which needs it in bash ARRAY context for its
  // --kind membership check and its own anchored ID_RE). Neither language can
  // import the other's literal, so the coupling is enforced here instead: parse
  // the bash array out of the script and require it to equal the TS list
  // exactly. Extending the enum in one file only fails this test.
  const scriptPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm",
  );

  /** The kinds listed in the script's `KINDS=(...)` array, in source order. */
  function bashKinds(): string[] {
    const src = readFileSync(scriptPath, "utf8");
    const match = /^KINDS=\(([^)]*)\)$/m.exec(src);
    if (match === null) {
      throw new Error(`no \`KINDS=(...)\` array found in ${scriptPath}`);
    }
    return match[1].trim().split(/\s+/);
  }

  it("the bash KINDS array is exactly the TS FLEET_ALARM_KINDS list", () => {
    expect(bashKinds()).toEqual([...FLEET_ALARM_KINDS]);
  });

  it("the parse itself is non-vacuous: a real, non-empty array was read", () => {
    // Without this, a regex that silently matched an empty capture would make
    // the equality assertion above pass against a mistake rather than a match.
    const kinds = bashKinds();
    expect(kinds.length).toBeGreaterThan(0);
    expect(kinds).toContain("tick-stale");
  });
});
