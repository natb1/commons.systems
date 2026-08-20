import { describe, expect, it } from "vitest";
import { hotLineage, ZERO_NOTE } from "../src/hot-lineage.js";
import { buildRows } from "../src/rows.js";
import { progressIndex, delegationIndex } from "../src/build-payload.js";
import type { PlanRow, Velocity } from "../src/model.js";
import { boost, kindNodes, node, strategy, tactic } from "./fixtures.js";

const VELOCITY: Velocity = { perDay: 2, windowDays: 28, closures: 56, created: 60 };
const TODAY = new Date("2026-08-13T00:00:00Z");

function row(id: string, extra: Partial<PlanRow> = {}): PlanRow {
  return {
    id,
    statement: id,
    tier: 1,
    rank: 0,
    phase: null,
    phaseIndex: -1,
    spine: [],
    lanes: [],
    sources: [],
    labels: [],
    position: 1,
    eta: "2026-08-14",
    reason: null,
    draft: true,
    ...extra,
  };
}

describe("hotLineage", () => {
  it("partitions the window total EXACTLY", () => {
    // Share is a decomposition of the ranking, not a proxy for it: the parts
    // must sum to the whole, or the panel is describing something else.
    const rows = [
      row("t1", { sources: [{ id: "s1", amount: 10 }, { id: "s2", amount: 3 }] }),
      row("t2", { sources: [{ id: "s1", amount: 10 }], draft: false }),
    ];
    const { entries, total } = hotLineage(rows, {}, {});
    expect(total).toBe(23);
    expect(entries.reduce((sum, e) => sum + e.share, 0)).toBeCloseTo(1, 10);
    expect(entries.find((e) => e.id === "s1")?.share).toBeCloseTo(20 / 23, 10);
  });

  it("splits undecomposed from in-flight by phase", () => {
    const rows = [
      row("draft-row", { sources: [{ id: "s1", amount: 4 }], draft: true }),
      row("live-row", { sources: [{ id: "s1", amount: 4 }], draft: false }),
    ];
    const entry = hotLineage(rows, {}, {}).entries[0];
    expect(entry.undecomposed).toBe(4);
    expect(entry.inFlight).toBe(4);
  });

  it("reports a lineage with only drafts as zero in-flight", () => {
    const rows = [row("draft-row", { sources: [{ id: "s1", amount: 4 }], draft: true })];
    const entry = hotLineage(rows, {}, {}).entries[0];
    expect(entry.undecomposed).toBeGreaterThan(0);
    expect(entry.inFlight).toBe(0);
  });

  it("NAMES a delegation ancestor at zero rather than omitting it", () => {
    // A delegation feeds the separate capture term and never appears as a named
    // source, so its decomposed share is structurally unavailable — not cold.
    // Dropping the lane would read as "no capture here".
    const rows = [row("t1", { sources: [{ id: "s1", amount: 5 }] })];
    const { entries } = hotLineage(rows, {}, { t1: ["delegation-x"] });
    const delegation = entries.find((e) => e.id === "delegation-x");
    expect(delegation).toBeDefined();
    expect(delegation?.delegation).toBe(true);
    expect((delegation?.undecomposed ?? 0) + (delegation?.inFlight ?? 0)).toBe(0);
    expect(ZERO_NOTE).toContain("delegation-scoring");
  });

  it("recomputes over the rows it is handed — the filter follows", () => {
    const rows = [
      row("t1", { sources: [{ id: "s1", amount: 10 }] }),
      row("t2", { sources: [{ id: "s2", amount: 90 }] }),
    ];
    const all = hotLineage(rows, {}, {});
    const filtered = hotLineage([rows[0]], {}, {});
    expect(all.entries.find((e) => e.id === "s1")?.share).toBeCloseTo(0.1, 10);
    expect(filtered.entries.find((e) => e.id === "s1")?.share).toBeCloseTo(1, 10);
  });

  it("folds the tail into ONE others row rather than generating hues", () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      row(`t${i}`, { sources: [{ id: `s${i}`, amount: 12 - i }] }),
    );
    const { entries, others } = hotLineage(rows, {}, {});
    expect(entries).toHaveLength(8);
    expect(others?.id).toBe("+ 4 others");
  });
});

describe("heat and progress move together", () => {
  const graph = (donePhase: string | null) => [
    ...kindNodes(),
    strategy("strategy-hot", { attention: boost(10) }),
    tactic("tactic-a", { serves: ["strategy-hot"] }),
    tactic("tactic-b", { serves: ["strategy-hot"], phase: donePhase }),
  ];

  it("marking a descendant done DECREASES heat and INCREASES progress", () => {
    // The greenfield rule that a done node contributes nothing to any axis is
    // what makes heat and progress two readings of the same motion.
    const before = graph("implement");
    const after = graph("done");

    const heatOf = (nodes: ReturnType<typeof graph>) => {
      const rows = buildRows({ nodes, velocity: VELOCITY, today: TODAY });
      const { entries } = hotLineage(rows, progressIndex(nodes), delegationIndex(nodes));
      const entry = entries.find((e) => e.id === "strategy-hot");
      return { heat: (entry?.undecomposed ?? 0) + (entry?.inFlight ?? 0), rows };
    };
    const progressOf = (nodes: ReturnType<typeof graph>) =>
      progressIndex(nodes)["strategy-hot"] ?? { done: 0, total: 0 };

    expect(heatOf(after).heat).toBeLessThan(heatOf(before).heat);
    expect(progressOf(after).done).toBeGreaterThan(progressOf(before).done);
  });
});

describe("progressIndex", () => {
  it("counts done and open descendants against their ancestors", () => {
    const nodes = [
      ...kindNodes(),
      strategy("strategy-x", { attention: boost(5) }),
      tactic("t-open", { serves: ["strategy-x"] }),
      tactic("t-done", { serves: ["strategy-x"], phase: "done" }),
    ];
    expect(progressIndex(nodes)["strategy-x"]).toEqual({ done: 1, total: 2 });
  });
});

describe("delegationIndex", () => {
  it("reaches a delegation through the serving strategy", () => {
    const nodes = [
      ...kindNodes(),
      node({ id: "delegation-x", kind: "delegation", statement: "d" }),
      strategy("strategy-x", { recovers: ["delegation-x"] }),
      tactic("t-open", { serves: ["strategy-x"] }),
    ];
    expect(delegationIndex(nodes)["t-open"]).toEqual(["delegation-x"]);
  });
});
