import { describe, expect, it } from "vitest";
import { planBoost } from "../src/boost.js";
import { IntentionSchemaError } from "../src/errors.js";
import type { Attention, IntentionNode } from "../src/schema.js";

/** Minimal full IntentionNode fixture (mirrors check-node-selection.test.ts's `anode`). */
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

/** The goal-layer declaration: without these, nothing is attention-eligible. */
const KIND_NODES: IntentionNode[] = [
  anode({ id: "kind-strategy", kind: "kind", attributes: { goal_layer: true } }),
  anode({ id: "kind-tactic", kind: "kind", attributes: { goal_layer: true } }),
  anode({ id: "kind-delegation", kind: "kind", attributes: {} }),
];

function att(boost: number): Attention {
  return { boost, override: null, rationale: `boost ${boost}` };
}

/**
 * A strategy whose signal is already validated, so it is NOT itself a selector
 * candidate and contributes no signal term — keeping the rank arithmetic in
 * these fixtures pure authored-flow.
 */
function strategy(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({
    reading: "validated (2026-07-01)",
    ...partial,
    kind: "strategy",
  });
}

/** An in-flight tactic — a first-class selector candidate. */
function tactic(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ phase: "implement", ...partial, kind: "tactic" });
}

// The mis-sizing trap fixture: the target inherits a big claim (18) from the
// hot strategy it serves; the incumbent inherits nothing and carries its whole
// rank as an authored boost (20). Naively copying the incumbent's `boost: 20`
// overshoots by a factor of ~7.
const HOT_BOOST = 18;
const INCUMBENT_BOOST = 20;
const trapFixture = (): IntentionNode[] => [
  ...KIND_NODES,
  strategy({ id: "strategy-hot", attention: att(HOT_BOOST) }),
  strategy({ id: "strategy-cold" }),
  tactic({ id: "tactic-target", serves: ["strategy-hot"] }),
  tactic({ id: "tactic-incumbent", serves: ["strategy-cold"], attention: att(INCUMBENT_BOOST) }),
];

describe("planBoost — the composed-vs-authored mis-sizing trap", () => {
  it("sizes the boost against the incumbent's COMPOSED rank, not its authored boost column", () => {
    const plan = planBoost(trapFixture(), "tactic-target", { kind: "top-candidate" });

    expect(plan.target_is_candidate).toBe(true);
    expect(plan.target_current_rank).toBe(HOT_BOOST);
    expect(plan.incumbent?.id).toBe("tactic-incumbent");
    expect(plan.incumbent?.rank).toBe(INCUMBENT_BOOST);
    expect(plan.incumbent?.own_boost).toBe(INCUMBENT_BOOST);

    // Beats the incumbent's composed rank...
    expect(plan.recommended_boost).toBe(3);
    expect(plan.resulting_rank).toBe(21);
    expect(plan.resulting_rank as number).toBeGreaterThan(INCUMBENT_BOOST);
    // ...and is far below the naive "match the incumbent's boost column" value.
    expect(plan.recommended_boost as number).toBeLessThan(INCUMBENT_BOOST);
    expect(plan.unreachable_reason).toBeNull();
    expect(plan.needs_ack).toBe(false);
  });

  it("recommends the OWN boost, with the inherited claim composing on top", () => {
    const plan = planBoost(trapFixture(), "tactic-target", { kind: "top-candidate" });
    expect(plan.resulting_rank).toBe((plan.recommended_boost as number) + HOT_BOOST);
    expect(plan.recommended_boost).not.toBe(plan.resulting_rank);
  });

  it("returns the full candidate list in selector order", () => {
    const plan = planBoost(trapFixture(), "tactic-target", { kind: "top-candidate" });
    expect(plan.ranking.map((r) => r.id)).toEqual(["tactic-incumbent", "tactic-target"]);
    expect(plan.ranking.every((r) => r.exempt === false)).toBe(true);
  });

  it("reaches a named composed rank in `rank` mode", () => {
    const plan = planBoost(trapFixture(), "tactic-target", { kind: "rank", value: 25 });
    expect(plan.recommended_boost).toBe(7);
    expect(plan.resulting_rank).toBe(25);
  });
});

// Main-health fixture: main-health is itself a candidate (unvalidated signal),
// and `tactic-mh-child` inherits its claim, so both are exempt from the
// top-rank contest.
const MH_BOOST = 40;
const mainHealthFixture = (): IntentionNode[] => [
  ...KIND_NODES,
  // reading null → signal unvalidated → main-health is itself a candidate.
  strategy({ id: "strategy-main-health", reading: null, attention: att(MH_BOOST) }),
  strategy({ id: "strategy-cold" }),
  tactic({ id: "tactic-mh-child", serves: ["strategy-main-health"] }),
  tactic({ id: "tactic-incumbent", serves: ["strategy-cold"], attention: att(5) }),
  tactic({ id: "tactic-target", serves: ["strategy-cold"] }),
];

describe("planBoost — main-health exemption and the rule-18 ceiling", () => {
  it("marks main-health and its subtree exempt, and skips them when picking the incumbent", () => {
    const plan = planBoost(mainHealthFixture(), "tactic-target", { kind: "top-candidate" });
    const byId = new Map(plan.ranking.map((r) => [r.id, r]));

    expect(byId.get("strategy-main-health")?.exempt).toBe(true);
    expect(byId.get("tactic-mh-child")?.exempt).toBe(true);
    expect(byId.get("tactic-incumbent")?.exempt).toBe(false);

    expect(plan.incumbent?.id).toBe("tactic-incumbent");
    expect(plan.recommended_boost).toBe(6);
    expect(plan.needs_ack).toBe(false);
    expect(plan.ceiling).toBe(MH_BOOST);
  });

  it("contests main-health too under includeExempt, which then needs the rule-18 ACK", () => {
    const plan = planBoost(mainHealthFixture(), "tactic-target", { kind: "top-candidate" }, {
      includeExempt: true,
    });
    expect(plan.incumbent?.id).toBe("strategy-main-health");
    // main-health composes to its boost plus the signal term (it is its own
    // unvalidated-signal terminal), so topping it takes one more than that.
    expect(plan.recommended_boost).toBe((plan.incumbent?.rank as number) + 1);
    expect(plan.needs_ack).toBe(true);
    expect(plan.unreachable_reason).toBeNull();
  });

  it("sets needs_ack when topping the incumbent requires reaching the live ceiling", () => {
    const nodes = [
      ...KIND_NODES,
      strategy({ id: "strategy-main-health", attention: att(MH_BOOST) }),
      strategy({ id: "strategy-cold" }),
      tactic({ id: "tactic-incumbent", serves: ["strategy-cold"], attention: att(MH_BOOST - 1) }),
      tactic({ id: "tactic-target", serves: ["strategy-cold"] }),
    ];
    const plan = planBoost(nodes, "tactic-target", { kind: "top-candidate" });
    expect(plan.ceiling).toBe(MH_BOOST);
    expect(plan.recommended_boost).toBe(MH_BOOST);
    expect(plan.needs_ack).toBe(true);
    expect(plan.unreachable_reason).toBeNull();
  });

  it("reports a null ceiling when main-health carries no attention, and searches to maxBoost", () => {
    const nodes = [
      ...KIND_NODES,
      strategy({ id: "strategy-main-health", attention: null }),
      strategy({ id: "strategy-cold" }),
      tactic({ id: "tactic-incumbent", serves: ["strategy-cold"], attention: att(3) }),
      tactic({ id: "tactic-target", serves: ["strategy-cold"] }),
    ];
    const plan = planBoost(nodes, "tactic-target", { kind: "top-candidate" }, { maxBoost: 5 });
    expect(plan.ceiling).toBeNull();
    expect(plan.recommended_boost).toBe(4);
    expect(plan.needs_ack).toBe(false);
  });

  it("reports the bound when maxBoost is too small to top the incumbent", () => {
    const nodes = [
      ...KIND_NODES,
      strategy({ id: "strategy-cold" }),
      tactic({ id: "tactic-incumbent", serves: ["strategy-cold"], attention: att(50) }),
      tactic({ id: "tactic-target", serves: ["strategy-cold"] }),
    ];
    const plan = planBoost(nodes, "tactic-target", { kind: "top-candidate" }, { maxBoost: 5 });
    expect(plan.recommended_boost).toBeNull();
    expect(plan.unreachable_reason).toContain("maxBoost");
    expect(plan.unreachable_reason).toContain("5");
  });
});

describe("planBoost — unreachable and non-candidate targets", () => {
  it("names the peer that rides the target's own claim and stays ahead forever", () => {
    const nodes = [
      ...KIND_NODES,
      strategy({ id: "strategy-cold" }),
      tactic({ id: "tactic-target", serves: ["strategy-cold"] }),
      // A subtree child receives the target's claim through `parent`, so it
      // rises with every boost and keeps its +5 authored margin.
      tactic({ id: "tactic-rider", parent: "tactic-target", attention: att(5) }),
    ];
    const plan = planBoost(nodes, "tactic-target", { kind: "top-candidate" }, { maxBoost: 50 });
    expect(plan.recommended_boost).toBeNull();
    expect(plan.resulting_rank).toBeNull();
    expect(plan.unreachable_reason).toContain("tactic-rider");
    expect(plan.unreachable_reason).toContain("+5");
  });

  it("refuses top-candidate mode for a parked (non-candidate) target but still plans a rank", () => {
    const nodes = trapFixture().map((n) =>
      n.id === "tactic-target"
        ? {
            ...n,
            office_hours: {
              reason: "parked",
              since: "2026-07-01",
              recommendation: null,
              session_type: "other" as const,
            },
          }
        : n,
    );

    const top = planBoost(nodes, "tactic-target", { kind: "top-candidate" });
    expect(top.target_is_candidate).toBe(false);
    expect(top.recommended_boost).toBeNull();
    expect(top.unreachable_reason).toContain("candidate list");
    expect(top.ranking.map((r) => r.id)).toEqual(["tactic-incumbent"]);

    const byRank = planBoost(nodes, "tactic-target", { kind: "rank", value: 25 });
    expect(byRank.target_is_candidate).toBe(false);
    expect(byRank.recommended_boost).toBe(7);
    expect(byRank.resulting_rank).toBe(25);
  });
});

describe("planBoost — input errors", () => {
  it("throws on an unknown id", () => {
    expect(() => planBoost(trapFixture(), "tactic-nope", { kind: "top-candidate" })).toThrow(
      IntentionSchemaError,
    );
  });

  it("throws on a non-goal-layer target (validateGraph rule 5)", () => {
    const nodes = [
      ...trapFixture(),
      anode({ id: "delegation-x", kind: "delegation" }),
    ];
    expect(() => planBoost(nodes, "delegation-x", { kind: "top-candidate" })).toThrow(
      /not a goal-layer kind/,
    );
  });
});
