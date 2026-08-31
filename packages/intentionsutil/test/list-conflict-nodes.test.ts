import { describe, expect, it } from "vitest";
import type { ConflictState, Execution, IntentionNode } from "../src/schema.js";
import { conflictPrNumbers } from "../scripts/list-conflict-nodes.js";

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

/** An in-flight execution record fixture. */
function exec(partial: Partial<Execution> = {}): Execution {
  return {
    branch: partial.branch ?? "some-branch",
    pr: partial.pr ?? null,
    attempts: partial.attempts ?? {},
    markers: partial.markers ?? ["reviewed"],
    strategy_fingerprint: partial.strategy_fingerprint ?? null,
    fix: partial.fix ?? null,
    conflict: partial.conflict ?? null,
  };
}

const CONFLICT: ConflictState = { since: "2026-08-03", attempt: 1 };

/** A tactic awaiting merge, optionally with the conflict interrupt in flight. */
function tactic(
  id: string,
  pr: number | null,
  conflict: ConflictState | null,
): IntentionNode {
  return anode({ id, kind: "tactic", phase: "review", execution: exec({ branch: id, pr, conflict }) });
}

describe("conflictPrNumbers", () => {
  it("includes a node with execution.conflict set and a non-null execution.pr", () => {
    expect(conflictPrNumbers([tactic("tactic-a", 101, CONFLICT)])).toEqual([101]);
  });

  it("excludes a node whose execution.conflict is null", () => {
    expect(conflictPrNumbers([tactic("tactic-a", 101, null)])).toEqual([]);
  });

  it("excludes a node with execution.conflict set but a null execution.pr", () => {
    expect(conflictPrNumbers([tactic("tactic-a", null, CONFLICT)])).toEqual([]);
  });

  it("excludes a node with no execution record at all", () => {
    expect(conflictPrNumbers([anode({ id: "tactic-a", kind: "tactic" })])).toEqual([]);
  });

  it("returns every qualifying node's PR, skipping the non-qualifying ones", () => {
    const nodes = [
      tactic("tactic-a", 101, CONFLICT),
      tactic("tactic-b", 102, null),
      tactic("tactic-c", 103, CONFLICT),
      tactic("tactic-d", null, CONFLICT),
      tactic("tactic-e", 104, CONFLICT),
    ];
    expect(conflictPrNumbers(nodes)).toEqual([101, 103, 104]);
  });

  it("excludes a strategy carrying a conflict-shaped attributes.execution squatter", () => {
    // The guard reads the FIRST-CLASS execution.conflict field only. A
    // non-tactic node with a conflict-shaped `attributes.execution` — the
    // squatter path some other readers tolerate — must not match.
    const squatter = anode({
      id: "strategy-x",
      kind: "strategy",
      attributes: { execution: { pr: 999, conflict: CONFLICT } },
    });
    expect(conflictPrNumbers([squatter])).toEqual([]);
  });
});
