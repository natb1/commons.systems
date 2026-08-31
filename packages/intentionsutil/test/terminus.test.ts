import { describe, expect, it } from "vitest";
import type { Completion, Execution, IntentionNode, OfficeHours } from "../src/schema.js";
import { classifyTerminus, findUnstructuredWaits, ladderTerminusCensus } from "../src/terminus.js";

// tactic-ladder-terminus-owns-main-qa — the ladder-terminus predicate. Mirrors
// the fixture shape of census.test.ts and graph-census-debt.test.ts.

/** A well-formed office_hours record for a parked fixture node. */
function parked(reason: string): OfficeHours {
  return { reason, since: "2026-07-01", recommendation: null, session_type: "other" };
}

/** A merged Completion record — the census-population marker. */
function merged(): Completion {
  return { mergedAt: "2026-08-13T23:27:31Z", mergeCommitSha: "abc123", graphCommitSha: null };
}

/** An Execution record carrying a merged completion, optionally a PR number. */
function mergedExecution(pr: number | null = null): Execution {
  return {
    branch: "b",
    pr,
    attempts: {},
    markers: [],
    strategy_fingerprint: null,
    completion: merged(),
  };
}

/** Build an IntentionNode fixture, filling required/default fields. */
function node(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind ?? "tactic",
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

/** A real, present, not-done blocker node — completes `blockersComplete: false`. */
function openBlocker(id: string): IntentionNode {
  return node({ id, phase: "implement" });
}

describe("classifyTerminus", () => {
  it("no execution.completion.mergedAt -> not-merged", () => {
    expect(classifyTerminus(node({ id: "t", phase: "main-qa" }), new Map())).toBe("not-merged");
  });

  it("execution present but completion null -> not-merged", () => {
    const n = node({
      id: "t",
      phase: "main-qa",
      execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    expect(classifyTerminus(n, new Map())).toBe("not-merged");
  });

  it("merged + phase:done -> done", () => {
    expect(
      classifyTerminus(node({ id: "t", phase: "done", execution: mergedExecution() }), new Map()),
    ).toBe("done");
  });

  it("merged + not done + office_hours -> excused-parked", () => {
    const n = node({
      id: "t",
      phase: "main-qa",
      execution: mergedExecution(),
      office_hours: parked("waiting"),
    });
    expect(classifyTerminus(n, new Map())).toBe("excused-parked");
  });

  it("merged + not done + blocked_by on a present, not-done blocker -> excused-blocked", () => {
    const blocker = openBlocker("tactic-other");
    const n = node({
      id: "t",
      phase: "main-qa",
      execution: mergedExecution(),
      blocked_by: ["tactic-other"],
    });
    const byId = new Map([
      [n.id, n],
      [blocker.id, blocker],
    ]);
    expect(classifyTerminus(n, byId)).toBe("excused-blocked");
  });

  it("merged + not done + blocked_by on a DONE blocker -> violation (excuse self-clears)", () => {
    const blocker = node({ id: "tactic-other", phase: "done", execution: mergedExecution() });
    const n = node({
      id: "t",
      phase: "main-qa",
      execution: mergedExecution(),
      blocked_by: ["tactic-other"],
    });
    const byId = new Map([
      [n.id, n],
      [blocker.id, blocker],
    ]);
    expect(classifyTerminus(n, byId)).toBe("violation");
  });

  it("merged + not done + blocked_by on an ABSENT blocker -> violation", () => {
    const n = node({
      id: "t",
      phase: "main-qa",
      execution: mergedExecution(),
      blocked_by: ["tactic-vanished"],
    });
    expect(classifyTerminus(n, new Map([[n.id, n]]))).toBe("violation");
  });

  it("merged + not done + no excuse -> violation", () => {
    const n = node({ id: "t", phase: "main-qa", execution: mergedExecution() });
    expect(classifyTerminus(n, new Map())).toBe("violation");
  });

  it("precedence: both parked AND blocked -> excused-parked", () => {
    const blocker = openBlocker("tactic-other");
    const n = node({
      id: "t",
      phase: "main-qa",
      execution: mergedExecution(),
      office_hours: parked("waiting"),
      blocked_by: ["tactic-other"],
    });
    const byId = new Map([
      [n.id, n],
      [blocker.id, blocker],
    ]);
    expect(classifyTerminus(n, byId)).toBe("excused-parked");
  });

  it("precedence: done node that is also parked -> done, not excused-parked", () => {
    const n = node({
      id: "t",
      phase: "done",
      execution: mergedExecution(),
      office_hours: parked("stale park never cleared"),
    });
    expect(classifyTerminus(n, new Map())).toBe("done");
  });
});

describe("ladderTerminusCensus", () => {
  it("excludes not-merged nodes from rows and counts", () => {
    const nodes = [
      node({ id: "t-unmerged", phase: "implement" }),
      node({ id: "t-merged-open", phase: "main-qa", execution: mergedExecution() }),
    ];
    const census = ladderTerminusCensus(nodes);
    expect(census.rows.map((r) => r.id)).toEqual(["t-merged-open"]);
    expect(census.mergedNotDone).toBe(1);
  });

  it("excludes done nodes from rows and counts — the population is merged AND not done", () => {
    const nodes = [
      node({ id: "t-done", phase: "done", execution: mergedExecution() }),
      node({ id: "t-open", phase: "main-qa", execution: mergedExecution() }),
    ];
    const census = ladderTerminusCensus(nodes);
    expect(census.rows.map((r) => r.id)).toEqual(["t-open"]);
    expect(census.mergedNotDone).toBe(1);
  });

  it("splits merged-not-done into excused and violations, and sorts rows by id", () => {
    const nodes = [
      node({ id: "t-violation-b", phase: "main-qa", execution: mergedExecution() }),
      node({
        id: "t-excused-parked",
        phase: "main-qa",
        execution: mergedExecution(),
        office_hours: parked("r"),
      }),
      node({
        id: "t-excused-blocked",
        phase: "main-qa",
        execution: mergedExecution(),
        blocked_by: ["tactic-other"],
      }),
      openBlocker("tactic-other"),
      node({ id: "t-violation-a", phase: "main-qa", execution: mergedExecution() }),
      node({ id: "t-done", phase: "done", execution: mergedExecution() }),
    ];
    const census = ladderTerminusCensus(nodes);
    expect(census.mergedNotDone).toBe(4);
    expect(census.excused).toBe(2);
    expect(census.violations).toBe(2);
    expect(census.rows.map((r) => r.id)).toEqual([
      "t-excused-blocked",
      "t-excused-parked",
      "t-violation-a",
      "t-violation-b",
    ]);
  });

  it("carries execution.pr onto each row", () => {
    const nodes = [node({ id: "t", phase: "main-qa", execution: mergedExecution(3075) })];
    const census = ladderTerminusCensus(nodes);
    expect(census.rows[0].pr).toBe(3075);
  });
});

describe("findUnstructuredWaits", () => {
  it("finds a main-qa node with a prose 'awaited event:' line and no structural excuse", () => {
    const nodes = [
      node({ id: "tactic-attention-namespaced-rank", phase: "main-qa", execution: mergedExecution() }),
    ];
    const body =
      "- Verifiability: WAIT — awaited event: `tactic-attention-per-tier-boost-migration` lands\n";
    const waits = findUnstructuredWaits(nodes, () => body);
    expect(waits).toEqual([
      {
        id: "tactic-attention-namespaced-rank",
        awaited: "`tactic-attention-per-tier-boost-migration` lands",
      },
    ]);
  });

  it("that same node still classifies as violation — prose is NOT an excuse", () => {
    // The anti-regression for tactic-ladder-terminus-owns-main-qa's explicit
    // ruling: "Do not close this by loosening the census to accept prose."
    // findUnstructuredWaits reports the gap; it must never feed back into
    // classifyTerminus to reclassify it as excused.
    const n = node({
      id: "tactic-attention-namespaced-rank",
      phase: "main-qa",
      execution: mergedExecution(),
    });
    const body = "- Verifiability: WAIT — awaited event: something lands\n";
    expect(findUnstructuredWaits([n], () => body)).toHaveLength(1);
    expect(classifyTerminus(n, new Map([[n.id, n]]))).toBe("violation");
  });

  it("does not report a main-qa node whose wait is carried by blocked_by", () => {
    const nodes = [
      node({
        id: "t",
        phase: "main-qa",
        execution: mergedExecution(),
        blocked_by: ["tactic-other"],
      }),
    ];
    const body = "awaited event: tactic-other lands\n";
    expect(findUnstructuredWaits(nodes, () => body)).toEqual([]);
  });

  it("does not report a main-qa node whose wait is carried by office_hours", () => {
    const nodes = [
      node({
        id: "t",
        phase: "main-qa",
        execution: mergedExecution(),
        office_hours: parked("waiting on X"),
      }),
    ];
    const body = "awaited event: X lands\n";
    expect(findUnstructuredWaits(nodes, () => body)).toEqual([]);
  });

  it("ignores a non-main-qa node with an 'awaited event:' line", () => {
    const nodes = [node({ id: "t", phase: "implement", execution: mergedExecution() })];
    const body = "awaited event: something lands\n";
    expect(findUnstructuredWaits(nodes, () => body)).toEqual([]);
  });

  it("ignores a main-qa node whose body has no 'awaited event:' line", () => {
    const nodes = [node({ id: "t", phase: "main-qa", execution: mergedExecution() })];
    expect(findUnstructuredWaits(nodes, () => "no waits here\n")).toEqual([]);
  });
});
