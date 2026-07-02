import { describe, expect, it } from "vitest";
import type { IntentionNode, Owner } from "../src/schema.js";
import {
  activeFrontier,
  projectGoals,
  realizationForOwner,
  renderFrontier,
} from "../src/goals.js";

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
    gap: partial.gap ?? null,
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attributes: partial.attributes ?? {},
  };
}

describe("activeFrontier", () => {
  it("excludes a codified childless root, excludes a non-leaf epic, includes a raw leaf", () => {
    const root = node({ id: "principle", status: "codified", parent: null });
    const epic = node({ id: "epic", status: "raw", parent: "principle" });
    const leaf = node({ id: "leaf", status: "raw", parent: "epic" });

    const frontier = activeFrontier([root, epic, leaf]);
    expect(frontier.map((n) => n.id)).toEqual(["leaf"]);
  });

  it("includes delegated and refining leaves (all non-codified leaves survive)", () => {
    const delegated = node({ id: "delegated", status: "delegated" });
    const refining = node({ id: "refining", status: "refining" });

    const frontier = activeFrontier([delegated, refining]);
    expect(frontier.map((n) => n.id)).toEqual(["delegated", "refining"]);
  });

  it("preserves input order among surviving nodes", () => {
    const a = node({ id: "a", status: "raw" });
    const b = node({ id: "b", status: "raw" });
    const frontier = activeFrontier([b, a]);
    expect(frontier.map((n) => n.id)).toEqual(["b", "a"]);
  });
});

describe("realizationForOwner", () => {
  it("maps all three owners correctly", () => {
    const cases: [Owner, string][] = [
      ["human", "issue-or-pr"],
      ["ai", "issue-or-pr"],
      ["procedure", "script-and-tests"],
    ];
    for (const [owner, expected] of cases) {
      expect(realizationForOwner(owner)).toBe(expected);
    }
  });
});

describe("projectGoals", () => {
  it("produces a total, fully id-sorted order on the all-null-gap shape", () => {
    const nodes = [
      node({ id: "c", status: "raw" }),
      node({ id: "a", status: "raw" }),
      node({ id: "b", status: "raw" }),
    ];
    const goals = projectGoals(nodes);
    expect(goals.map((g) => g.node.id)).toEqual(["a", "b", "c"]);
  });

  it("floats a non-null-gap node ahead of null-gap nodes regardless of input order", () => {
    const withGap = node({ id: "z", status: "raw", gap: "missing tooling" });
    const noGapA = node({ id: "a", status: "raw" });
    const noGapB = node({ id: "b", status: "raw" });

    // Scrambled input order; gap node has the highest id so a naive id sort
    // would place it last.
    const goals = projectGoals([noGapB, withGap, noGapA]);
    expect(goals.map((g) => g.node.id)).toEqual(["z", "a", "b"]);
  });

  it("orders success_signal-present ahead of absent within the same gap class", () => {
    const sig = node({
      id: "y",
      status: "raw",
      success_signal: { observable: "o", sensor: "s", threshold: "t", is_proxy: false },
    });
    const noSig = node({ id: "a", status: "raw" });
    const goals = projectGoals([noSig, sig]);
    expect(goals.map((g) => g.node.id)).toEqual(["y", "a"]);
  });

  it("does not mutate the input array", () => {
    const nodes = [
      node({ id: "c", status: "raw" }),
      node({ id: "a", status: "raw" }),
    ];
    const snapshot = nodes.map((n) => n.id);
    projectGoals(nodes);
    expect(nodes.map((n) => n.id)).toEqual(snapshot);
  });

  it("attaches the correct realization", () => {
    const goals = projectGoals([
      node({ id: "p", owner: "procedure", status: "raw" }),
      node({ id: "h", owner: "human", status: "raw" }),
    ]);
    const byId = Object.fromEntries(goals.map((g) => [g.node.id, g.realization]));
    expect(byId.p).toBe("script-and-tests");
    expect(byId.h).toBe("issue-or-pr");
  });
});

describe("renderFrontier", () => {
  it("is byte-identical across two calls with the same input", () => {
    const goals = projectGoals([
      node({ id: "z", status: "raw", gap: "missing tooling" }),
      node({ id: "a", status: "raw" }),
      node({ id: "p", owner: "procedure", status: "raw" }),
    ]);
    expect(renderFrontier(goals)).toBe(renderFrontier(goals));
  });

  it("contains no date-shaped substring (determinism guard)", () => {
    const goals = projectGoals([
      node({ id: "z", status: "raw", gap: "missing tooling" }),
      node({ id: "a", status: "raw" }),
    ]);
    const out = renderFrontier(goals);
    expect(out).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("ends with a trailing newline and renders a gap when present", () => {
    const goals = projectGoals([node({ id: "z", status: "raw", gap: "missing tooling" })]);
    const out = renderFrontier(goals);
    expect(out.endsWith("\n")).toBe(true);
    expect(out).toContain("gap: missing tooling");
  });

  it("renders the stable placeholder for an empty frontier", () => {
    expect(renderFrontier([])).toBe("_No active frontier goals._\n");
  });
});
