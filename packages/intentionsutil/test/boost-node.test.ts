import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import { MAIN_HEALTH_DOMINANCE_ACK } from "../src/schema.js";
import type { Attention, IntentionNode } from "../src/schema.js";
import { previewBoost, writeBoost } from "../scripts/boost-node.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "boost-node-"));
}

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

const STATUS_VOCABULARY = { raw: "Not yet started.", codified: "Complete." };

/**
 * The goal-layer declaration, WITH a status_vocabulary so validateGraph (rule
 * 16) passes too, and a self-describing `kind-kind` node so validateGraph
 * (rule 1) doesn't complain that `kind-strategy`/`kind-tactic` themselves
 * reference an undeclared "kind" kind.
 */
const KIND_NODES: IntentionNode[] = [
  anode({
    id: "kind-kind",
    kind: "kind",
    attributes: { status_vocabulary: STATUS_VOCABULARY },
  }),
  anode({
    id: "kind-strategy",
    kind: "kind",
    attributes: { goal_layer: true, status_vocabulary: STATUS_VOCABULARY },
  }),
  anode({
    id: "kind-tactic",
    kind: "kind",
    attributes: { goal_layer: true, status_vocabulary: STATUS_VOCABULARY },
  }),
];

function att(boost: number): Attention {
  return { boost, override: null, rationale: `boost ${boost}` };
}

/** A strategy whose signal is already validated, so it is not itself a candidate. */
function strategy(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ reading: "validated (2026-07-01)", ...partial, kind: "strategy" });
}

/** An in-flight tactic — a first-class selector candidate. */
function tactic(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return anode({ phase: "implement", ...partial, kind: "tactic" });
}

function seed(dir: string, node: IntentionNode): void {
  writeNode(dir, node);
}

function seedAll(dir: string, nodes: IntentionNode[]): void {
  for (const node of nodes) seed(dir, node);
}

// Same shape as boost.test.ts's trapFixture: target inherits a claim from a
// hot strategy; a cold-strategy incumbent carries its whole rank as an
// authored boost. Gives a clean, low, always-reachable recommendation.
const HOT_BOOST = 18;
const INCUMBENT_BOOST = 20;
function trapFixture(): IntentionNode[] {
  return [
    ...KIND_NODES,
    strategy({ id: "strategy-hot", attention: att(HOT_BOOST) }),
    strategy({ id: "strategy-cold" }),
    tactic({ id: "tactic-target", serves: ["strategy-hot"] }),
    tactic({ id: "tactic-incumbent", serves: ["strategy-cold"], attention: att(INCUMBENT_BOOST) }),
  ];
}

// A fixture where topping the incumbent requires reaching the live rule-18
// ceiling exactly (mirrors boost.test.ts's "sets needs_ack..." fixture).
const MH_BOOST = 40;
function ceilingFixture(): IntentionNode[] {
  return [
    ...KIND_NODES,
    strategy({ id: "strategy-main-health", attention: att(MH_BOOST) }),
    strategy({ id: "strategy-cold" }),
    tactic({ id: "tactic-incumbent", serves: ["strategy-cold"], attention: att(MH_BOOST - 1) }),
    tactic({ id: "tactic-target", serves: ["strategy-cold"] }),
  ];
}

describe("previewBoost", () => {
  it("computes a plan and writes nothing to disk", () => {
    const dir = tempDir();
    seedAll(dir, trapFixture());
    const before = readFileSync(join(dir, "tactic-target.md"), "utf8");

    const result = previewBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      json: true,
      top: 10,
    });

    expect(result.exitCode).toBe(0);
    expect(result.plan?.recommended_boost).toBe(3);
    const after = readFileSync(join(dir, "tactic-target.md"), "utf8");
    expect(after).toBe(before);
  });

  it("renders a human-readable table by default (non-json)", () => {
    const dir = tempDir();
    seedAll(dir, trapFixture());
    const result = previewBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      json: false,
      top: 10,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("tactic-incumbent");
    expect(result.stdout).toContain("recommended boost: 3");
  });

  it("exits 1 on an unknown node id", () => {
    const dir = tempDir();
    seedAll(dir, trapFixture());
    const result = previewBoost({
      dir,
      nodeId: "tactic-does-not-exist",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      json: true,
      top: 10,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr[0]).toMatch(/no node with id/);
  });
});

describe("writeBoost", () => {
  it("without --rationale (null/blank) exits 2 and writes nothing", () => {
    const dir = tempDir();
    seedAll(dir, trapFixture());
    const before = readFileSync(join(dir, "tactic-target.md"), "utf8");

    const missing = writeBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      rationale: null,
      explicitBoost: null,
      ack: false,
    });
    expect(missing.exitCode).toBe(2);

    const blank = writeBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      rationale: "   ",
      explicitBoost: null,
      ack: false,
    });
    expect(blank.exitCode).toBe(2);

    const after = readFileSync(join(dir, "tactic-target.md"), "utf8");
    expect(after).toBe(before);
  });

  it("a successful write sets exactly attention, leaving every other field identical", () => {
    const dir = tempDir();
    seedAll(dir, trapFixture());
    const before = readNode(dir, "tactic-target");

    const result = writeBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      rationale: "beat the incumbent for the sprint",
      explicitBoost: null,
      ack: false,
    });

    expect(result.exitCode).toBe(0);
    const after = readNode(dir, "tactic-target");
    expect(after.attention).toEqual({
      boost: 3,
      override: null,
      rationale: "beat the incumbent for the sprint",
    });
    const { attention: _beforeAttention, ...beforeRest } = before;
    const { attention: _afterAttention, ...afterRest } = after;
    expect(afterRest).toEqual(beforeRest);
  });

  it("needing ACK (chosen boost >= ceiling) without --ack exits 4 and writes nothing", () => {
    const dir = tempDir();
    seedAll(dir, ceilingFixture());
    const before = readFileSync(join(dir, "tactic-target.md"), "utf8");

    const result = writeBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      rationale: "top the ranking",
      explicitBoost: null,
      ack: false,
    });

    expect(result.exitCode).toBe(4);
    expect(result.stderr[0]).toMatch(/would match or exceed strategy-main-health/);
    const after = readFileSync(join(dir, "tactic-target.md"), "utf8");
    expect(after).toBe(before);
  });

  it("with --ack the rationale carries MAIN_HEALTH_DOMINANCE_ACK and the write lands", () => {
    const dir = tempDir();
    seedAll(dir, ceilingFixture());

    const result = writeBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      rationale: "top the ranking",
      explicitBoost: null,
      ack: true,
    });

    expect(result.exitCode).toBe(0);
    const after = readNode(dir, "tactic-target");
    expect(after.attention?.boost).toBe(MH_BOOST);
    expect(after.attention?.rationale).toContain(MAIN_HEALTH_DOMINANCE_ACK);
    expect(after.attention?.rationale).toContain("top the ranking");
  });

  it("--boost overrides the recommendation, writing the explicit value verbatim", () => {
    const dir = tempDir();
    seedAll(dir, trapFixture());

    const result = writeBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      rationale: "author wants a specific value",
      explicitBoost: 9,
      ack: false,
    });

    expect(result.exitCode).toBe(0);
    const after = readNode(dir, "tactic-target");
    expect(after.attention?.boost).toBe(9);
    // 9 !== the planner's recommendation (3), proving the explicit value won,
    // not plan.recommended_boost.
    expect(after.attention?.boost).not.toBe(3);
  });

  it("unreachable and no explicit --boost given exits 4, writing nothing", () => {
    const dir = tempDir();
    // A tactic the selector never emits (parked) can never top the list.
    seedAll(dir, [
      ...KIND_NODES,
      strategy({ id: "strategy-cold" }),
      tactic({
        id: "tactic-target",
        serves: ["strategy-cold"],
        office_hours: { reason: "parked", since: "2026-07-01", recommendation: null, session_type: "other" },
      }),
    ]);
    const before = readFileSync(join(dir, "tactic-target.md"), "utf8");

    const result = writeBoost({
      dir,
      nodeId: "tactic-target",
      mode: { kind: "top-candidate" },
      includeExempt: false,
      rationale: "try anyway",
      explicitBoost: null,
      ack: false,
    });

    expect(result.exitCode).toBe(4);
    const after = readFileSync(join(dir, "tactic-target.md"), "utf8");
    expect(after).toBe(before);
  });
});
