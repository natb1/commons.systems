import { describe, expect, it } from "vitest";
import { listHoldCandidates } from "../src/hold-sweep.js";
import type { IntentionNode, OfficeHours } from "../src/schema.js";

/** Minimal full IntentionNode fixture (mirrors scope-sweep.test.ts's `anode`). */
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

const PARKED: OfficeHours = {
  reason: "worktree carries mechanical residue from a dead session",
  since: "2026-07-30",
  recommendation: null,
  session_type: "other",
};

/** A hold node of `kind`, holding `sourceId`. */
function hold(
  id: string,
  sourceId: string,
  kind: string,
  partial: Partial<IntentionNode> = {},
): IntentionNode {
  return anode({
    id,
    kind: "tactic",
    attributes: { hold_kind: kind, hold_for: sourceId },
    ...partial,
  });
}

/** The source node a hold blocks. */
function source(id: string, blockedBy: string[]): IntentionNode {
  return anode({ id, kind: "tactic", phase: "implement", blocked_by: blockedBy });
}

describe("listHoldCandidates", () => {
  it("classifies an open worktree-residue hold with a live edge as predicate", () => {
    const h = hold("tactic-hold-residue-a", "tactic-a", "worktree-residue", {
      phase: "implement",
      office_hours: PARKED,
    });
    const result = listHoldCandidates([h, source("tactic-a", [h.id])]);
    expect(result).toEqual([
      {
        holdId: "tactic-hold-residue-a",
        sourceId: "tactic-a",
        kind: "worktree-residue",
        cls: "predicate",
      },
    ]);
  });

  it("excludes an open hold whose source no longer names it in blocked_by", () => {
    const h = hold("tactic-hold-residue-a", "tactic-a", "worktree-residue", {
      phase: "implement",
      office_hours: PARKED,
    });
    expect(listHoldCandidates([h, source("tactic-a", [])])).toEqual([]);
  });

  it("classifies a done, unparked hold whose edge survives as edge-residue", () => {
    const h = hold("tactic-hold-residue-a", "tactic-a", "worktree-residue", {
      phase: "done",
      office_hours: null,
    });
    const result = listHoldCandidates([h, source("tactic-a", [h.id])]);
    expect(result).toEqual([
      {
        holdId: "tactic-hold-residue-a",
        sourceId: "tactic-a",
        kind: "worktree-residue",
        cls: "edge-residue",
      },
    ]);
  });

  it("excludes a done hold whose edge was already cleared", () => {
    const h = hold("tactic-hold-residue-a", "tactic-a", "worktree-residue", {
      phase: "done",
      office_hours: null,
    });
    expect(listHoldCandidates([h, source("tactic-a", [])])).toEqual([]);
  });

  it("classifies an open provision-conflict hold with a live edge as manual", () => {
    const h = hold("tactic-hold-conflict-a", "tactic-a", "provision-conflict", {
      phase: "implement",
      office_hours: PARKED,
    });
    const result = listHoldCandidates([h, source("tactic-a", [h.id])]);
    expect(result).toEqual([
      {
        holdId: "tactic-hold-conflict-a",
        sourceId: "tactic-a",
        kind: "provision-conflict",
        cls: "manual",
      },
    ]);
  });

  it("classifies a done manual-policy hold as edge-residue regardless of kind", () => {
    const h = hold("tactic-hold-conflict-a", "tactic-a", "provision-conflict", {
      phase: "done",
      office_hours: null,
    });
    const result = listHoldCandidates([h, source("tactic-a", [h.id])]);
    expect(result.map((c) => c.cls)).toEqual(["edge-residue"]);
  });

  it("excludes a hold whose hold_for source is absent from the node list", () => {
    const h = hold("tactic-hold-residue-gone", "tactic-gone", "worktree-residue", {
      phase: "implement",
      office_hours: PARKED,
    });
    expect(listHoldCandidates([h])).toEqual([]);
  });

  it("ignores a plain tactic that carries no hold attributes", () => {
    const plain = anode({ id: "tactic-plain", kind: "tactic", phase: "implement" });
    expect(listHoldCandidates([plain, source("tactic-a", ["tactic-plain"])])).toEqual([]);
  });

  it("treats a done-but-still-parked hold as open, not terminal", () => {
    const h = hold("tactic-hold-residue-a", "tactic-a", "worktree-residue", {
      phase: "done",
      office_hours: PARKED,
    });
    const result = listHoldCandidates([h, source("tactic-a", [h.id])]);
    expect(result.map((c) => c.cls)).toEqual(["predicate"]);
  });

  it("excludes a hold whose own id is not the canonical derivation", () => {
    // The enumeration key is the hold NODE ID; resolve-hold's key is
    // (source, kind). A node carrying hold attributes under any other id would
    // have ITS classification applied to whatever hold the derivation lands on.
    const decoy = hold("tactic-decoy-x", "tactic-victim", "provision-conflict", {
      phase: "done",
      office_hours: null,
    });
    expect(listHoldCandidates([decoy, source("tactic-victim", [decoy.id])])).toEqual([]);
  });

  it("keeps a victim's genuine hold manual when a terminal decoy shares its hold_for", () => {
    // The attack shape: a terminal decoy would classify as `edge-residue`,
    // skipping the manual re-check policy, and force-resolve the genuine hold.
    const decoy = hold("tactic-decoy-x", "tactic-victim", "provision-conflict", {
      phase: "done",
      office_hours: null,
    });
    const genuine = hold("tactic-hold-conflict-victim", "tactic-victim", "provision-conflict", {
      phase: "implement",
      office_hours: PARKED,
    });
    const result = listHoldCandidates([
      decoy,
      genuine,
      source("tactic-victim", [decoy.id, genuine.id]),
    ]);
    expect(result).toEqual([
      {
        holdId: "tactic-hold-conflict-victim",
        sourceId: "tactic-victim",
        kind: "provision-conflict",
        cls: "manual",
      },
    ]);
  });

  it("excludes a hold whose hold_for cannot derive a valid node-id slug", () => {
    // holdIdFor throws on a derivation that fails the slug shape; a throw is a
    // non-match here, never a sweep-wide failure.
    const h = hold("tactic-hold-residue-bad", "Tactic-BAD", "worktree-residue", {
      phase: "implement",
      office_hours: PARKED,
    });
    const src = anode({ id: "Tactic-BAD", kind: "tactic", blocked_by: [h.id] });
    expect(listHoldCandidates([h, src])).toEqual([]);
  });

  it("sorts multiple candidates by hold id ascending", () => {
    const c = hold("tactic-hold-residue-c", "tactic-c", "worktree-residue", {
      phase: "implement",
      office_hours: PARKED,
    });
    const a = hold("tactic-hold-conflict-a", "tactic-a", "provision-conflict", {
      phase: "implement",
      office_hours: PARKED,
    });
    const b = hold("tactic-hold-fix-cap-b", "tactic-b", "fix-attempt-cap", {
      phase: "done",
      office_hours: null,
    });
    const result = listHoldCandidates([
      c,
      source("tactic-c", [c.id]),
      a,
      source("tactic-a", [a.id]),
      b,
      source("tactic-b", [b.id]),
    ]);
    expect(result.map((r) => r.holdId)).toEqual([
      "tactic-hold-conflict-a",
      "tactic-hold-fix-cap-b",
      "tactic-hold-residue-c",
    ]);
  });
});
