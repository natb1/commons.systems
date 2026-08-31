import { describe, expect, it } from "vitest";
import type { IntentionNode } from "../src/schema.js";
import { detectRung } from "../src/rungs.js";

/** Build an IntentionNode fixture, filling required/default fields. */
function node(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind ?? "tactic",
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

describe("detectRung", () => {
  it("empty graph → rung-0", () => {
    expect(detectRung([])).toBe("rung-0");
  });

  it("roots-only, no leaf goals → refine-workflow", () => {
    // A single virtue root with no children: activeFrontier drops it
    // (it is codified), so the frontier is empty → refine-workflow.
    const root = node({
      id: "virtue-show-not-tell",
      kind: "virtue",
      status: "codified",
      parent: null,
    });
    expect(detectRung([root])).toBe("refine-workflow");
  });

  it("raw virtue root, no children → rung-0", () => {
    // Regression guard: a single raw (uncodified) virtue root with no
    // children. The hasVirtueRoot guard counts only *codified* virtue
    // roots, so a raw root means the charter is not yet codified → rung-0.
    // Without the status guard this misclassified as rung-5 (the raw leaf was
    // a frontier goal). Contrast the codified-root test above (→ refine-
    // workflow): the codified-vs-raw distinction is intentional — do not
    // "align" these two expectations.
    const root = node({ id: "virtue-raw", kind: "virtue", status: "raw", parent: null });
    expect(detectRung([root])).toBe("rung-0");
  });

  it("non-virtue codified root, no children → rung-0 (kind gates root detection)", () => {
    // A codified parentless node of a non-virtue kind is not a virtue root:
    // detection keys on kind === "virtue", not on the id prefix.
    const root = node({ id: "virtue-lookalike", kind: "strategy", status: "codified", parent: null });
    expect(detectRung([root])).toBe("rung-0");
  });

  it("roots + leaf goals → rung-5", () => {
    const root = node({
      id: "virtue-show-not-tell",
      kind: "virtue",
      status: "codified",
      parent: null,
    });
    const leaf = node({
      id: "tactic-1",
      kind: "tactic",
      status: "raw",
      parent: "virtue-show-not-tell",
    });
    expect(detectRung([root, leaf])).toBe("rung-5");
  });

  it("this-repo shape: codified roots + raw human leaves, no procedure/ai → rung-5", () => {
    // Regression guard for the design error (a 4th automate rung). A graph
    // that matches the actual commons.systems intention tree — several
    // codified virtue roots plus many raw human-owned leaf nodes, zero
    // procedure/ai-owned nodes anywhere — must resolve to rung-5, not a
    // hypothetical "automate" rung.
    const roots = [
      node({ id: "virtue-show-not-tell", kind: "virtue", status: "codified", parent: null }),
      node({ id: "virtue-commons-sustain", kind: "virtue", status: "codified", parent: null }),
      node({ id: "virtue-practitioner-first", kind: "virtue", status: "codified", parent: null }),
    ];
    const leaves = [
      node({ id: "tactic-10", kind: "tactic", status: "raw", owner: "human", parent: "virtue-show-not-tell" }),
      node({ id: "tactic-11", kind: "tactic", status: "raw", owner: "human", parent: "virtue-show-not-tell" }),
      node({ id: "tactic-20", kind: "tactic", status: "raw", owner: "human", parent: "virtue-commons-sustain" }),
      node({ id: "tactic-21", kind: "tactic", status: "raw", owner: "human", parent: "virtue-commons-sustain" }),
      node({ id: "tactic-30", kind: "tactic", status: "raw", owner: "human", parent: "virtue-practitioner-first" }),
    ];
    // Confirm there are no procedure or ai nodes in this graph.
    const allNodes = [...roots, ...leaves];
    expect(allNodes.every((n) => n.owner === "human")).toBe(true);
    expect(detectRung(allNodes)).toBe("rung-5");
  });
});
