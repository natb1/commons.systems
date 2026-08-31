import { describe, expect, it } from "vitest";
import type { IntentionNode } from "../src/schema.js";
import { analyzeGrounding } from "../src/grounding.js";

/** Build a full IntentionNode fixture, filling required/default fields. */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
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

/**
 * A fixture graph exercising every ordering guarantee.
 *
 *   - Three delegations of descending divergence: high > moderate > low.
 *   - `strategy-hub` recovers the moderate delegation and serves three
 *     non-delegation nodes, putting each of them two hops from that delegation
 *     over the undirected serves/recovers graph (strategy-hub itself is one
 *     hop). virtue-v, strategy-tie-a, strategy-tie-b thus share one exposure
 *     score, exercising the virtue-over-strategy and id tie-breaks.
 *   - `tactic-*` and `tradition-*` are outside the durable layer.
 *   - `strategy-marked-traditions` and `virtue-marked-grounding` carry marks
 *     and must be excluded.
 */
function fixture(): IntentionNode[] {
  return [
    anode({ id: "delegation-high", kind: "delegation", attributes: { divergence: { level: "high" } } }),
    anode({ id: "delegation-mid", kind: "delegation", attributes: { divergence: { level: "moderate" } } }),
    anode({ id: "delegation-low", kind: "delegation", attributes: { divergence: { level: "low" } } }),
    anode({
      id: "strategy-hub",
      kind: "strategy",
      recovers: ["delegation-mid"],
      serves: ["virtue-v", "strategy-tie-a", "strategy-tie-b"],
    }),
    anode({ id: "virtue-v", kind: "virtue" }),
    anode({ id: "strategy-tie-a", kind: "strategy" }),
    anode({ id: "strategy-tie-b", kind: "strategy" }),
    anode({ id: "tactic-t", kind: "tactic", serves: ["strategy-hub"] }),
    anode({ id: "tradition-x", kind: "tradition" }),
    anode({
      id: "strategy-marked-traditions",
      kind: "strategy",
      attributes: { traditions: ["tradition-x"] },
    }),
    anode({
      id: "virtue-marked-grounding",
      kind: "virtue",
      attributes: { grounding: "none-found: 2026-01-01" },
    }),
  ];
}

const rankedIds = (nodes: IntentionNode[]): string[] =>
  analyzeGrounding(nodes).ranked.map((r) => r.id);

const indexOf = (ids: string[], id: string): number => ids.indexOf(id);

describe("analyzeGrounding", () => {
  it("(a) excludes tactic and tradition kinds from the report", () => {
    const ids = rankedIds(fixture());
    expect(ids).not.toContain("tactic-t");
    expect(ids).not.toContain("tradition-x");
  });

  it("(b) excludes nodes marked by attributes.traditions or attributes.grounding", () => {
    const ids = rankedIds(fixture());
    expect(ids).not.toContain("strategy-marked-traditions");
    expect(ids).not.toContain("virtue-marked-grounding");
  });

  it("(c) ranks a high-divergence delegation above a low-divergence one", () => {
    const ids = rankedIds(fixture());
    expect(indexOf(ids, "delegation-high")).toBeLessThan(indexOf(ids, "delegation-low"));
  });

  it("(c') ranks every delegation above every non-delegation", () => {
    const report = analyzeGrounding(fixture());
    const worstDelegation = Math.max(
      ...report.ranked.filter((r) => r.kind === "delegation").map((r) => r.rank),
    );
    const bestNonDelegation = Math.min(
      ...report.ranked.filter((r) => r.kind !== "delegation").map((r) => r.rank),
    );
    expect(worstDelegation).toBeLessThan(bestNonDelegation);
  });

  it("(d) ranks an unmarked virtue above an unmarked strategy at equal proximity", () => {
    const ids = rankedIds(fixture());
    expect(indexOf(ids, "virtue-v")).toBeLessThan(indexOf(ids, "strategy-tie-a"));
  });

  it("(e) is deterministic: id ascending breaks ties, order independent of input order", () => {
    const ids = rankedIds(fixture());
    // Two same-kind, same-exposure strategies: lower id first.
    expect(indexOf(ids, "strategy-tie-a")).toBeLessThan(indexOf(ids, "strategy-tie-b"));

    // Shuffling the input must not change the ranking.
    const shuffled = [...fixture()].reverse();
    expect(rankedIds(shuffled)).toEqual(ids);
  });

  it("(f) reports counts matching the fixture, and the report is JSON round-trippable", () => {
    const report = analyzeGrounding(fixture());
    // durable = 3 delegation + 4 strategy + 2 virtue = 9; tactic/tradition excluded.
    expect(report.durableTotal).toBe(9);
    expect(report.markedByTraditions).toBe(1);
    expect(report.markedByGrounding).toBe(1);
    expect(report.unmarked).toBe(7);
    expect(report.ranked).toHaveLength(7);

    const roundTripped = JSON.parse(JSON.stringify(report));
    expect(roundTripped.durableTotal).toBe(report.durableTotal);
    expect(roundTripped.unmarked).toBe(report.unmarked);
    expect(roundTripped.ranked.map((r: { id: string }) => r.id)).toEqual(
      report.ranked.map((r) => r.id),
    );
  });
});
