import { describe, expect, it } from "vitest";
import { listUnclaimedHoldAlerts } from "../src/hold-alerts.js";
import { holdIdFor, type HoldKind } from "../src/holds.js";
import type { IntentionNode, OfficeHours } from "../src/schema.js";

/** Minimal full IntentionNode fixture (mirrors hold-sweep.test.ts's `anode`). */
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

/** A parking record dated `since` (the age clock this module reads). */
function parked(since: string): OfficeHours {
  return {
    reason: "merge conflict against a moving main",
    since,
    recommendation: null,
    session_type: "other",
  };
}

const PARKED: OfficeHours = parked("2026-07-30");

/**
 * The kind nodes eligibility is data on: kind-tactic carries `goal_layer: true`,
 * so tactics get a resolved-attention entry (mirrors attention.test.ts).
 */
function kinds(): IntentionNode[] {
  return [
    anode({ id: "kind-kind", kind: "kind" }),
    anode({ id: "kind-tactic", kind: "kind", attributes: { goal_layer: true } }),
  ];
}

/**
 * A hold node of `kind` holding `sourceId`, at its CANONICAL derived id — the
 * binding `listHoldCandidates` enforces.
 */
function hold(
  sourceId: string,
  kind: HoldKind,
  partial: Partial<IntentionNode> = {},
): IntentionNode {
  return anode({
    id: holdIdFor(kind, sourceId),
    kind: "tactic",
    phase: "implement",
    office_hours: PARKED,
    attributes: { hold_kind: kind, hold_for: sourceId },
    ...partial,
  });
}

/**
 * The source node a hold blocks, boosted to `boost` in the tier it resolves in
 * (tier 1 unless `tier` says otherwise) and optionally tiered. The boost is
 * authored on the RESOLVED tier because boosts are per-tier namespaced: a
 * tier-1 boost on a tier-3 node contributes nothing to that node's tier-3 score.
 */
function source(
  id: string,
  blockedBy: string[],
  boost: number,
  tier?: 2 | 3,
): IntentionNode {
  return anode({
    id,
    kind: "tactic",
    phase: "implement",
    blocked_by: blockedBy,
    attention: { boosts: { [String(tier ?? 1)]: boost }, rationale: "because" },
    attributes: tier === undefined ? {} : { tier },
  });
}

/** 2026-08-04T00:00:00Z; a hold parked 2026-07-30 is 5 days (432000s) old. */
const NOW = new Date("2026-08-04T00:00:00Z");
const FIVE_DAYS = 5 * 24 * 3600;

describe("listUnclaimedHoldAlerts", () => {
  it("emits a manual hold over the age bound blocking a top-K source", () => {
    const h = hold("tactic-a", "provision-conflict");
    const nodes = [...kinds(), h, source("tactic-a", [h.id], 5)];
    expect(listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 3600, topK: 5 })).toEqual([
      {
        holdId: "tactic-hold-conflict-a",
        sourceId: "tactic-a",
        kind: "provision-conflict",
        ageSeconds: FIVE_DAYS,
        sourceTier: 1,
        sourceBand: 0,
        sourceScore: 5,
      },
    ]);
  });

  it("does not emit the same hold under the age bound", () => {
    const h = hold("tactic-a", "provision-conflict");
    const nodes = [...kinds(), h, source("tactic-a", [h.id], 5)];
    expect(
      listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: FIVE_DAYS + 1, topK: 5 }),
    ).toEqual([]);
  });

  it("emits at exactly the age bound (inclusive)", () => {
    const h = hold("tactic-a", "provision-conflict");
    const nodes = [...kinds(), h, source("tactic-a", [h.id], 5)];
    const result = listUnclaimedHoldAlerts(nodes, {
      now: NOW,
      minAgeSeconds: FIVE_DAYS,
      topK: 5,
    });
    expect(result.map((a) => a.holdId)).toEqual(["tactic-hold-conflict-a"]);
  });

  it("does not emit a hold blocking a source outside the top K", () => {
    const low = hold("tactic-low", "provision-conflict");
    const nodes = [
      ...kinds(),
      low,
      source("tactic-low", [low.id], 1),
      source("tactic-hot", [], 9),
    ];
    // topK: 1 ⇒ cutoff is tactic-hot's rank; tactic-low is below it.
    expect(listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 1 })).toEqual([]);
    // Widening K to 2 admits it.
    const wider = listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 2 });
    expect(wider.map((a) => a.holdId)).toEqual(["tactic-hold-conflict-low"]);
  });

  it("never emits an auto-policy (worktree-residue) hold", () => {
    const h = hold("tactic-a", "worktree-residue");
    const nodes = [...kinds(), h, source("tactic-a", [h.id], 5)];
    expect(listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 5 })).toEqual([]);
  });

  it("emits a fix-attempt-cap hold — the other manual-policy kind", () => {
    const h = hold("tactic-a", "fix-attempt-cap");
    const nodes = [...kinds(), h, source("tactic-a", [h.id], 5)];
    const result = listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 5 });
    expect(result.map((a) => [a.holdId, a.kind])).toEqual([
      ["tactic-hold-fix-cap-a", "fix-attempt-cap"],
    ]);
  });

  it("does not emit a hold whose source's blocked_by edge already cleared", () => {
    // Inherited from listHoldCandidates: no edge, nothing is being held.
    const h = hold("tactic-a", "provision-conflict");
    const nodes = [...kinds(), h, source("tactic-a", [], 5)];
    expect(listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 5 })).toEqual([]);
  });

  it("does not emit a manual hold with office_hours === null", () => {
    // Structurally possible (terminal requires phase done AND office_hours
    // null), but it is not sitting in the queue — and its missing `since` is
    // never coerced to age 0.
    const h = hold("tactic-a", "provision-conflict", { office_hours: null });
    const nodes = [...kinds(), h, source("tactic-a", [h.id], 5)];
    expect(listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 5 })).toEqual([]);
  });

  it("orders by the source's rank key descending", () => {
    const a = hold("tactic-a", "provision-conflict");
    const b = hold("tactic-b", "provision-conflict");
    const nodes = [
      ...kinds(),
      a,
      source("tactic-a", [a.id], 2),
      b,
      source("tactic-b", [b.id], 8),
    ];
    const result = listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 5 });
    expect(result.map((r) => r.sourceId)).toEqual(["tactic-b", "tactic-a"]);
  });

  it("breaks rank-key ties by holdId ascending", () => {
    const a = hold("tactic-a", "provision-conflict");
    const b = hold("tactic-b", "provision-conflict");
    const nodes = [
      ...kinds(),
      b,
      source("tactic-b", [b.id], 5),
      a,
      source("tactic-a", [a.id], 5),
    ];
    const result = listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 5 });
    expect(result.map((r) => r.holdId)).toEqual([
      "tactic-hold-conflict-a",
      "tactic-hold-conflict-b",
    ]);
  });

  it("lets tier dominate score in both ordering and the top-K cutoff", () => {
    const lowTierHot = hold("tactic-a", "provision-conflict");
    const highTierCold = hold("tactic-b", "provision-conflict");
    const nodes = [
      ...kinds(),
      lowTierHot,
      source("tactic-a", [lowTierHot.id], 9), // tier 1, score 9
      highTierCold,
      source("tactic-b", [highTierCold.id], 0, 3), // tier 3, score 0
    ];
    const result = listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 5 });
    expect(result.map((r) => [r.sourceId, r.sourceTier, r.sourceBand, r.sourceScore])).toEqual([
      ["tactic-b", 3, 0, 0],
      ["tactic-a", 1, 0, 9],
    ]);
    // And with K narrowed to 1, the tier-3 source is the only one at/above cutoff.
    const narrow = listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 1 });
    expect(narrow.map((r) => r.sourceId)).toEqual(["tactic-b"]);
  });

  it("applies no cutoff when fewer than K live unparked eligible nodes exist", () => {
    const h = hold("tactic-a", "provision-conflict");
    const nodes = [...kinds(), h, source("tactic-a", [h.id], 0)];
    const result = listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 100 });
    expect(result.map((r) => r.holdId)).toEqual(["tactic-hold-conflict-a"]);
  });

  it("measures age from office_hours.since, not from any repeat occurrence", () => {
    const older = hold("tactic-a", "provision-conflict", { office_hours: parked("2026-07-04") });
    const nodes = [...kinds(), older, source("tactic-a", [older.id], 5)];
    const result = listUnclaimedHoldAlerts(nodes, { now: NOW, minAgeSeconds: 0, topK: 5 });
    expect(result[0].ageSeconds).toBe(31 * 24 * 3600);
  });
});
