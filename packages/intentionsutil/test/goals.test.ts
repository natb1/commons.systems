import { describe, expect, it } from "vitest";
import type { IntentionNode, Owner } from "../src/schema.js";
import type { Goal } from "../src/goals.js";
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

describe("projectGoals attention ordering", () => {
  // Goal-layer kind nodes (codified, childless → excluded from the frontier)
  // whose `attributes.goal_layer: true` makes strategy/tactic nodes eligible.
  const kindStrategy = node({
    id: "kind-strategy",
    kind: "kind",
    status: "codified",
    attributes: { goal_layer: true },
  });
  const kindTactic = node({
    id: "kind-tactic",
    kind: "kind",
    status: "codified",
    attributes: { goal_layer: true },
  });
  const kindKind = node({ id: "kind-kind", kind: "kind", status: "codified" });

  it("floats an injected strategy's frontier leaf above gap/id-favored siblings", () => {
    // The injected strategy is a non-leaf (its child names it as parent), so it
    // is not on the frontier itself — its flow inherits down to the leaf tactic.
    const strategy = node({
      id: "strategy-s",
      kind: "strategy",
      status: "raw",
      attention: { boost: 10, override: null, rationale: "urgent" },
    });
    // The frontier leaf that inherits the strategy's flow. Highest id, no gap —
    // so gap/id keys alone would rank it LAST.
    const injected = node({ id: "z-inject-tactic", kind: "tactic", status: "raw", parent: "strategy-s" });
    // Competing frontier leaves the pre-attention keys would rank first.
    const gapA = node({ id: "a-tactic", kind: "tactic", status: "raw", gap: "g" });
    const gapB = node({ id: "b-tactic", kind: "tactic", status: "raw", gap: "g" });

    const goals = projectGoals([gapA, gapB, injected, strategy, kindStrategy, kindTactic, kindKind]);
    expect(goals.map((g) => g.node.id)).toEqual(["z-inject-tactic", "a-tactic", "b-tactic"]);
  });

  it("sets Goal.attention null for non-eligible nodes and populated for eligible ones", () => {
    const kindNote = node({ id: "kind-note", kind: "kind", status: "codified" });
    const eligible = node({
      id: "t-eligible",
      kind: "tactic",
      status: "raw",
      attention: { boost: 10, override: null, rationale: "r" },
    });
    // kind "note" has no goal_layer flag → not eligible → no resolver entry.
    const ineligible = node({ id: "n-note", kind: "note", status: "raw" });

    const goals = projectGoals([kindTactic, kindKind, kindNote, eligible, ineligible]);
    const byId = Object.fromEntries(goals.map((g) => [g.node.id, g.attention]));
    expect(byId["t-eligible"]).not.toBeNull();
    expect(byId["t-eligible"]?.value).toBeGreaterThan(0);
    expect(byId["n-note"]).toBeNull();
  });
});

describe("renderFrontier attention markers", () => {
  it("emits `[rank <value> via <id>]` for value > 0 and no marker for value = 0", () => {
    // Drive renderFrontier from Goal literals directly: it reads only `value`
    // and `sources[0]`, so this decouples the marker assertion from the
    // resolver's additive-rank math.
    const goals: Goal[] = [
      {
        node: node({ id: "hi-goal", status: "raw" }),
        realization: "issue-or-pr",
        attention: { value: 20, sources: ["strategy-x"] },
      },
      {
        node: node({ id: "lo-goal", status: "raw" }),
        realization: "issue-or-pr",
        attention: { value: 0, sources: [] },
      },
    ];
    expect(renderFrontier(goals)).toBe(
      "- **hi-goal** — Statement for hi-goal _(owner: human → issue/PR)_ [rank 20 via strategy-x]\n" +
        "- **lo-goal** — Statement for lo-goal _(owner: human → issue/PR)_\n",
    );
  });

  it("emits a bare `[rank <value>]` marker when sources is empty and value > 0", () => {
    const goals: Goal[] = [
      {
        node: node({ id: "r-goal", status: "raw" }),
        realization: "issue-or-pr",
        attention: { value: 5, sources: [] },
      },
    ];
    expect(renderFrontier(goals)).toBe(
      "- **r-goal** — Statement for r-goal _(owner: human → issue/PR)_ [rank 5]\n",
    );
  });

  it("is byte-identical to the pre-attention format when no node carries an injection", () => {
    // No kind nodes → nothing eligible → every Goal.attention is null → no
    // markers. The exact expected string is the pre-change render.
    const goals = projectGoals([
      node({ id: "z", status: "raw", gap: "missing tooling" }),
      node({ id: "a", status: "raw" }),
    ]);
    expect(renderFrontier(goals)).toBe(
      "- **z** — Statement for z _(owner: human → issue/PR)_ — gap: missing tooling\n" +
        "- **a** — Statement for a _(owner: human → issue/PR)_\n",
    );
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
