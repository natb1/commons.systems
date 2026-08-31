import { describe, expect, it } from "vitest";
import type { IntentionNode, OfficeHours } from "../src/schema.js";
import { classifyTactic, strategyBacklogBand } from "../src/census.js";

/** A well-formed office_hours record for a parked fixture node. */
function parked(reason: string): OfficeHours {
  return { reason, since: "2026-07-01", recommendation: null, session_type: "other" };
}

/** Build an IntentionNode fixture, filling required/default fields. */
function node(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind ?? "tactic",
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
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

describe("classifyTactic", () => {
  it("phase:done -> done, regardless of office_hours", () => {
    expect(classifyTactic(node({ id: "t", phase: "done" }))).toBe("done");
  });

  it("any other non-null phase -> open", () => {
    expect(classifyTactic(node({ id: "t", phase: "qa" }))).toBe("open");
    expect(classifyTactic(node({ id: "t", phase: "implement" }))).toBe("open");
  });

  it("phase:null + office_hours:null -> draft", () => {
    expect(classifyTactic(node({ id: "t", phase: null, office_hours: null }))).toBe("draft");
  });

  it("phase:null + non-null office_hours -> born-parked", () => {
    expect(
      classifyTactic(node({ id: "t", phase: null, office_hours: parked("waiting") })),
    ).toBe("born-parked");
  });
});

describe("strategyBacklogBand", () => {
  it("counts only kind:tactic nodes whose serves includes the strategy id", () => {
    const nodes = [
      node({ id: "strategy-x", kind: "strategy", serves: ["strategy-x"] }),
      node({ id: "t-other-strategy", kind: "tactic", serves: ["strategy-y"], phase: "qa" }),
      node({ id: "t1", kind: "tactic", serves: ["strategy-x"], phase: "qa" }),
    ];
    const band = strategyBacklogBand(nodes, "strategy-x");
    expect(band.total).toBe(1);
    expect(band.backlog).toBe(1);
  });

  it("backlog = open + born-parked; total also includes draft and done", () => {
    const nodes = [
      node({ id: "t-draft", kind: "tactic", serves: ["strategy-x"], phase: null, office_hours: null }),
      node({
        id: "t-parked",
        kind: "tactic",
        serves: ["strategy-x"],
        phase: null,
        office_hours: parked("r"),
      }),
      node({ id: "t-open", kind: "tactic", serves: ["strategy-x"], phase: "implement" }),
      node({ id: "t-done", kind: "tactic", serves: ["strategy-x"], phase: "done" }),
    ];
    const band = strategyBacklogBand(nodes, "strategy-x");
    expect(band.total).toBe(4);
    expect(band.backlog).toBe(2); // t-parked + t-open
    expect(band.pct).toBe(0.5);
  });

  it("total===0 yields pct:null", () => {
    const band = strategyBacklogBand([], "strategy-x");
    expect(band.total).toBe(0);
    expect(band.backlog).toBe(0);
    expect(band.pct).toBeNull();
  });
});
