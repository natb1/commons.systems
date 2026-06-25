import { describe, expect, it } from "vitest";
import type { IntentionNode } from "../src/schema.js";
import { detectRung } from "../src/rungs.js";

/** Build an IntentionNode fixture, filling required/default fields. */
function node(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return {
    id: partial.id,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "raw",
    parent: partial.parent ?? null,
    rationale: partial.rationale ?? null,
    reading: partial.reading ?? null,
    gap: partial.gap ?? null,
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
  };
}

describe("detectRung", () => {
  it("empty graph → rung-0", () => {
    expect(detectRung([])).toBe("rung-0");
  });

  it("roots-only, no leaf goals → refine-workflow", () => {
    // A single principle-* root with no children: activeFrontier drops it
    // (it is codified), so the frontier is empty → refine-workflow.
    const root = node({ id: "principle-show-not-tell", status: "codified", parent: null });
    expect(detectRung([root])).toBe("refine-workflow");
  });

  it("roots + leaf goals → rung-5", () => {
    const root = node({ id: "principle-show-not-tell", status: "codified", parent: null });
    const leaf = node({ id: "issue-1", status: "raw", parent: "principle-show-not-tell" });
    expect(detectRung([root, leaf])).toBe("rung-5");
  });

  it("this-repo shape: codified roots + raw human leaves, no procedure/ai → rung-5", () => {
    // Regression guard for the design error (a 4th automate rung). A graph
    // that matches the actual commons.systems intention tree — several
    // codified principle-* roots plus many raw human-owned leaf nodes, zero
    // procedure/ai-owned nodes anywhere — must resolve to rung-5, not a
    // hypothetical "automate" rung.
    const roots = [
      node({ id: "principle-show-not-tell", status: "codified", parent: null }),
      node({ id: "principle-commons-sustain", status: "codified", parent: null }),
      node({ id: "principle-practitioner-first", status: "codified", parent: null }),
    ];
    const leaves = [
      node({ id: "issue-10", status: "raw", owner: "human", parent: "principle-show-not-tell" }),
      node({ id: "issue-11", status: "raw", owner: "human", parent: "principle-show-not-tell" }),
      node({ id: "issue-20", status: "raw", owner: "human", parent: "principle-commons-sustain" }),
      node({ id: "issue-21", status: "raw", owner: "human", parent: "principle-commons-sustain" }),
      node({ id: "issue-30", status: "raw", owner: "human", parent: "principle-practitioner-first" }),
    ];
    // Confirm there are no procedure or ai nodes in this graph.
    const allNodes = [...roots, ...leaves];
    expect(allNodes.every((n) => n.owner === "human")).toBe(true);
    expect(detectRung(allNodes)).toBe("rung-5");
  });
});
