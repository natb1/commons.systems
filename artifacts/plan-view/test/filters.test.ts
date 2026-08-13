import { describe, expect, it } from "vitest";
import { applyFilter, EMPTY_FILTER, spanRuns, toggle } from "../src/filters.js";
import { assignLaneSlots, laneTrack } from "../src/lane-slots.js";
import type { PlanRow } from "../src/model.js";

function row(id: string, extra: Partial<PlanRow> = {}): PlanRow {
  return {
    id,
    statement: `statement for ${id}`,
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

describe("applyFilter", () => {
  const rows = [
    row("tactic-a", { tier: 2, labels: ["bug"], position: 1, eta: "2026-08-14" }),
    row("tactic-b", { tier: 1, labels: ["parked", "delegated"], position: 2, eta: "2026-08-15" }),
    row("tactic-c", { tier: 1, labels: [], position: 3, eta: "2026-08-16" }),
  ];

  it("changes NO row's ETA under any filter", () => {
    // The whole asymmetry the design rests on: hiding rows must not make the
    // router arrive sooner. Every filter combination is checked, not a sample.
    const combinations = [
      EMPTY_FILTER,
      { ...EMPTY_FILTER, tiers: [2] },
      { ...EMPTY_FILTER, tiers: [1, 2] },
      { ...EMPTY_FILTER, labels: ["bug"] },
      { ...EMPTY_FILTER, labels: ["parked", "bug"] },
      { ...EMPTY_FILTER, query: "tactic-b" },
      { tiers: [1], labels: ["delegated"], query: "statement" },
    ];
    for (const filter of combinations) {
      for (const filtered of applyFilter(rows, filter)) {
        const original = rows.find((r) => r.id === filtered.id);
        expect(filtered.eta).toBe(original?.eta);
        expect(filtered.position).toBe(original?.position);
      }
    }
  });

  it("ORs within a group and ANDs across groups", () => {
    expect(applyFilter(rows, { ...EMPTY_FILTER, tiers: [1] }).map((r) => r.id)).toEqual([
      "tactic-b",
      "tactic-c",
    ]);
    expect(
      applyFilter(rows, { ...EMPTY_FILTER, tiers: [1], labels: ["bug"] }).map((r) => r.id),
    ).toEqual([]);
  });

  it("treats an empty group as inert, not exclusive", () => {
    expect(applyFilter(rows, EMPTY_FILTER)).toHaveLength(3);
  });

  it("matches the query against both id and statement", () => {
    expect(applyFilter(rows, { ...EMPTY_FILTER, query: "TACTIC-A" }).map((r) => r.id)).toEqual([
      "tactic-a",
    ]);
    expect(applyFilter(rows, { ...EMPTY_FILTER, query: "statement for tactic-c" })).toHaveLength(1);
  });
});

describe("toggle", () => {
  it("adds then removes", () => {
    expect(toggle([1], 2)).toEqual([1, 2]);
    expect(toggle([1, 2], 1)).toEqual([2]);
  });
});

describe("spanRuns", () => {
  it("merges only CONTIGUOUS equal values", () => {
    // Contiguity holds on the VALUE, not on the node: equal values separated by
    // a different one fragment into two blocks rather than merging.
    expect(spanRuns(["a", "a", "b", "a"])).toEqual([
      { value: "a", start: 0, length: 2 },
      { value: "b", start: 2, length: 1 },
      { value: "a", start: 3, length: 1 },
    ]);
  });

  it("nests a level-2 spine inside its level-1 block without a ragged break", () => {
    // Spines are PATHS, so a level-1 value is a prefix of the level-2 value.
    // Every level-2 run must therefore sit wholly inside one level-1 run.
    const level1 = ["s1", "s1", "s1", "s2"];
    const level2 = ["s1 ▸ a", "s1 ▸ a", "s1 ▸ b", "s2 ▸ c"];
    const outer = spanRuns(level1);
    for (const run of spanRuns(level2)) {
      const container = outer.find(
        (o) => run.start >= o.start && run.start + run.length <= o.start + o.length,
      );
      expect(container, `run ${run.value} straddles a level-1 boundary`).toBeDefined();
    }
  });

  it("covers every row so the table cannot shear", () => {
    const values = ["a", "b", "b", "c"];
    const covered = spanRuns(values).reduce((sum, run) => sum + run.length, 0);
    expect(covered).toBe(values.length);
  });
});

describe("lane gutter", () => {
  it("lights MORE THAN ONE lane for a multi-parent row", () => {
    const rows = [
      row("tactic-multi", {
        lanes: [
          { id: "strategy-x", kind: "strategy" },
          { id: "delegation-y", kind: "delegation" },
        ],
      }),
      row("tactic-single", { lanes: [{ id: "strategy-x", kind: "strategy" }] }),
    ];
    const slots = assignLaneSlots(rows);
    const track = laneTrack(rows[0].lanes, slots);
    expect(track.filter((k) => k !== null)).toEqual(["strategy", "delegation"]);
    expect(laneTrack(rows[1].lanes, slots).filter((k) => k !== null)).toEqual(["strategy"]);
  });

  it("keeps an ancestor in the SAME slot across rows", () => {
    // A lane must read as a broken vertical band down the table, which only
    // works if the slot is stable per ancestor rather than per row.
    const rows = [
      row("t1", {
        lanes: [
          { id: "a", kind: "strategy" },
          { id: "b", kind: "blocker" },
        ],
      }),
      row("t2", { lanes: [{ id: "b", kind: "blocker" }] }),
    ];
    const slots = assignLaneSlots(rows);
    const slotOfB = slots.get("b")?.slot;
    expect(laneTrack(rows[0].lanes, slots)[slotOfB as number]).toBe("blocker");
    expect(laneTrack(rows[1].lanes, slots)[slotOfB as number]).toBe("blocker");
  });
});
