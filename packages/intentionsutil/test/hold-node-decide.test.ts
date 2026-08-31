import { describe, expect, it } from "vitest";
import { validateNode, type IntentionNode } from "../src/schema.js";
import {
  decideHold,
  holdIdFor,
  RESOLUTION_SENTENCE,
  type HoldInput,
} from "../scripts/hold-node-decide.js";
import { KIND_SLUGS, RESERVED_KIND_SLUGS } from "../src/holds.js";

// tactic-mechanical-park-producers Unit 1 — the network-free hold-node decision.
// `decideHold` / `holdIdFor` are pure over an in-memory node array, so these
// exercise them directly (no store, no subprocess), mirroring
// graph-census-debt.test.ts.

const STRATEGY = "strategy-graph-native-dispatch";
const STRATEGY_B = "strategy-main-health";
const SOURCE = "tactic-some-work";
const NOW = "2026-07-25";

function source(extra: Record<string, unknown> = {}): IntentionNode {
  return validateNode({
    id: SOURCE,
    kind: "tactic",
    statement: "some work",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    phase: "implement",
    ...extra,
  });
}

function hold(id: string, extra: Record<string, unknown> = {}): IntentionNode {
  return validateNode({
    id,
    kind: "tactic",
    statement: "hold",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    office_hours: { reason: "old reason", since: "2026-07-01", recommendation: null },
    attributes: { hold_for: SOURCE, hold_kind: "provision-conflict" },
    ...extra,
  });
}

function input(overrides: Partial<HoldInput> = {}): HoldInput {
  return {
    sourceId: SOURCE,
    kind: "provision-conflict",
    reason: "merge conflict against a moving main\nsecond line",
    recommendation: "rebase the branch and re-run the merge",
    diagnosis: null,
    now: NOW,
    ...overrides,
  };
}

describe("holdIdFor", () => {
  it("derives the conflict slug id for provision-conflict", () => {
    expect(holdIdFor("provision-conflict", "tactic-some-work")).toBe(
      "tactic-hold-conflict-some-work",
    );
  });

  it("derives the fix-cap slug id for fix-attempt-cap", () => {
    expect(holdIdFor("fix-attempt-cap", "tactic-some-work")).toBe(
      "tactic-hold-fix-cap-some-work",
    );
  });

  it("derives the residue slug id for worktree-residue", () => {
    expect(holdIdFor("worktree-residue", "tactic-some-work")).toBe(
      "tactic-hold-residue-some-work",
    );
  });

  it("derives the ci-stalled slug id for ci-pending-stalled", () => {
    expect(holdIdFor("ci-pending-stalled", "tactic-some-work")).toBe(
      "tactic-hold-ci-stalled-some-work",
    );
  });

  it("strips only a leading tactic- prefix", () => {
    expect(holdIdFor("provision-conflict", "strategy-thing")).toBe(
      "tactic-hold-conflict-strategy-thing",
    );
  });

  it("fails loud on a pathological source id that breaks the node-id slug shape", () => {
    expect(() => holdIdFor("provision-conflict", "tactic-Bad_Id")).toThrow(
      /does not match the node-id slug shape/,
    );
    expect(() => holdIdFor("provision-conflict", "tactic-trailing-")).toThrow(
      /does not match the node-id slug shape/,
    );
  });
});

describe("decideHold dispositions", () => {
  it("returns NONE with a constructed node and body when no hold exists", () => {
    const d = decideHold([source()], input());
    expect(d.disposition).toBe("NONE");
    expect(d.hold_id).toBe("tactic-hold-conflict-some-work");
    expect(d.node).toBeDefined();
    expect(typeof d.node_body).toBe("string");
    expect(d.node_body_append).toBeUndefined();
    expect(d.node?.phase).toBeUndefined(); // born-parked: no phase
    expect(d.node?.office_hours).toEqual({
      reason: input().reason,
      since: NOW,
      recommendation: input().recommendation,
    });
    expect(d.node?.attributes).toEqual({
      hold_for: SOURCE,
      hold_kind: "provision-conflict",
    });
  });

  it("returns EXISTING with only an occurrence stanza when an open hold exists", () => {
    const existing = hold("tactic-hold-conflict-some-work", { phase: "implement" });
    const d = decideHold([source(), existing], input());
    expect(d.disposition).toBe("EXISTING");
    expect(d.node).toBeUndefined();
    expect(d.node_body).toBeUndefined();
    expect(d.node_body_append).toContain(`## Occurrence ${NOW}`);
  });

  it("does not refresh office_hours.since or touch phase on EXISTING", () => {
    const existing = hold("tactic-hold-conflict-some-work", { phase: "implement" });
    const d = decideHold([source(), existing], input());
    // Nothing but the body append is emitted — no node object at all, so
    // neither since nor phase can be rewritten by the landing half.
    expect(Object.keys(d)).not.toContain("node");
    expect(existing.office_hours?.since).toBe("2026-07-01");
    expect(existing.phase).toBe("implement");
  });

  it("returns REOPENED with a fresh office_hours, phase null, and a stanza when the hold is done", () => {
    const done = hold("tactic-hold-conflict-some-work", { phase: "done" });
    const d = decideHold([source(), done], input());
    expect(d.disposition).toBe("REOPENED");
    expect(d.node).toBeDefined();
    expect(d.node?.phase).toBeNull();
    expect(d.node?.office_hours).toEqual({
      reason: input().reason,
      since: NOW,
      recommendation: input().recommendation,
    });
    expect(d.node_body_append).toContain(`## Occurrence ${NOW}`);
    expect(d.node_body).toBeUndefined();
  });

  it("uses the fix-cap hold id when the kind is fix-attempt-cap", () => {
    const d = decideHold([source()], input({ kind: "fix-attempt-cap" }));
    expect(d.hold_id).toBe("tactic-hold-fix-cap-some-work");
    expect(d.node?.attributes).toEqual({
      hold_for: SOURCE,
      hold_kind: "fix-attempt-cap",
    });
  });

  it("uses the residue hold id when the kind is worktree-residue", () => {
    const d = decideHold([source()], input({ kind: "worktree-residue" }));
    expect(d.hold_id).toBe("tactic-hold-residue-some-work");
    expect(d.node?.attributes).toEqual({
      hold_for: SOURCE,
      hold_kind: "worktree-residue",
    });
  });

  it("uses the ci-stalled hold id when the kind is ci-pending-stalled", () => {
    const d = decideHold([source()], input({ kind: "ci-pending-stalled" }));
    expect(d.disposition).toBe("NONE");
    expect(d.hold_id).toBe("tactic-hold-ci-stalled-some-work");
    expect(d.node?.attributes).toEqual({
      hold_for: SOURCE,
      hold_kind: "ci-pending-stalled",
    });
    expect(d.source_edge_needed).toBe(true);
    expect(d.node_body).toContain(RESOLUTION_SENTENCE);
  });

  it("throws when the source node is not in the store", () => {
    expect(() => decideHold([], input())).toThrow(/is not in the store/);
  });
});

describe("the reserved no-progress slug", () => {
  // Pins the ruling that the CI-stall bound minted its own `ci-stalled` slug
  // rather than claiming the reserved general-fuse name. Without this, a later
  // kind could quietly take `no-progress` and leave the general fuse unnameable.
  it("stays reserved and is claimed by no implemented kind", () => {
    expect(RESERVED_KIND_SLUGS).toContain("no-progress");
    expect(Object.values(KIND_SLUGS)).not.toContain("no-progress");
  });
});

describe("decideHold serves copying", () => {
  it("copies serves verbatim from the source", () => {
    const d = decideHold([source()], input());
    expect(d.node?.serves).toEqual([STRATEGY]);
  });

  it("copies a multi-entry serves array verbatim, in order", () => {
    const d = decideHold([source({ serves: [STRATEGY, STRATEGY_B] })], input());
    expect(d.node?.serves).toEqual([STRATEGY, STRATEGY_B]);
  });

  it("never forces a strategy onto a source that serves nothing", () => {
    const d = decideHold([source({ serves: [] })], input());
    expect(d.node?.serves).toEqual([]);
  });
});

describe("decideHold source edge", () => {
  it("appends the hold id when the edge is absent", () => {
    const d = decideHold([source({ blocked_by: ["tactic-other"] })], input());
    expect(d.source_edge_needed).toBe(true);
    expect(d.source_blocked_by).toEqual([
      "tactic-other",
      "tactic-hold-conflict-some-work",
    ]);
  });

  it("is idempotent when the edge is already present", () => {
    const existing = hold("tactic-hold-conflict-some-work", { phase: "implement" });
    const src = source({
      blocked_by: ["tactic-other", "tactic-hold-conflict-some-work"],
    });
    const d = decideHold([src, existing], input());
    expect(d.source_edge_needed).toBe(false);
    expect(d.source_blocked_by).toEqual([
      "tactic-other",
      "tactic-hold-conflict-some-work",
    ]);
  });

  it("never emits an office_hours write for the source node", () => {
    const d = decideHold([source()], input());
    // The only source-facing output is the blocked_by edge - no office_hours,
    // no phase, no other source field for the landing half to write.
    expect(Object.keys(d).filter((k) => k.startsWith("source_")).sort()).toEqual([
      "source_blocked_by",
      "source_edge_needed",
    ]);
    // The only office_hours in the payload belongs to the hold node itself.
    expect(d.node?.id).toBe("tactic-hold-conflict-some-work");
  });
});

describe("constructed hold node", () => {
  it("passes validateNode for the NONE disposition", () => {
    const d = decideHold([source()], input());
    const validated = validateNode(d.node);
    expect(validated.id).toBe("tactic-hold-conflict-some-work");
    expect(validated.kind).toBe("tactic");
    expect(validated.owner).toBe("ai");
    expect(validated.status).toBe("codified");
    expect(validated.parent).toBeNull();
    expect(validated.phase).toBeNull();
    expect(validated.execution).toBeNull();
    expect(validated.validates).toEqual([]);
    expect(validated.blocked_by).toEqual([]);
    expect(validated.office_hours?.since).toBe(NOW);
  });

  it("passes validateNode for the REOPENED disposition", () => {
    const done = hold("tactic-hold-conflict-some-work", { phase: "done" });
    const d = decideHold([source(), done], input());
    const validated = validateNode(d.node);
    expect(validated.phase).toBeNull();
    expect(validated.office_hours?.reason).toBe(input().reason);
  });
});

describe("generated body", () => {
  it("contains the exact mandatory resolution sentence", () => {
    const d = decideHold([source()], input());
    expect(d.node_body).toContain(
      "resolve the hold tactic to `phase: done` (then prune) — clearing " +
        "`office_hours` alone does not unblock the source.",
    );
    expect(d.node_body).toContain(RESOLUTION_SENTENCE);
  });

  it("states the source id and the kind", () => {
    const d = decideHold([source()], input());
    expect(d.node_body).toContain(SOURCE);
    expect(d.node_body).toContain("provision-conflict");
    expect(d.node_body).toContain("## How to resolve");
  });

  it("includes a Diagnosis section only when a body file was supplied", () => {
    const without = decideHold([source()], input());
    expect(without.node_body).not.toContain("## Diagnosis");

    const with_ = decideHold(
      [source()],
      input({ diagnosis: "conflicted files:\n- a.ts\n- b.ts" }),
    );
    expect(with_.node_body).toContain("## Diagnosis");
    expect(with_.node_body).toContain("conflicted files:");
  });
});
