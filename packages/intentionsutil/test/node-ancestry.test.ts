import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";
import {
  buildAncestryProjection,
  renderAncestryProjection,
  MAX_ANCESTORS,
  MAX_CLARIFICATION_TITLES,
  MAX_PROJECTION_BYTES,
} from "../scripts/node-ancestry.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "node-ancestry-"));
}

/** Minimal full IntentionNode fixture (mirrors check-node-selection.test.ts). */
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

function seed(dir: string, node: IntentionNode): void {
  writeNode(dir, node);
}

describe("buildAncestryProjection", () => {
  it("projects a tactic→strategy→virtue chain nearest-first with every field populated", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "virtue-v", kind: "virtue", statement: "Be temperate." }));
    seed(
      dir,
      anode({
        id: "strategy-s",
        kind: "strategy",
        statement: "Bound the queue.",
        serves: ["virtue-v"],
        rationale: "An unbounded queue starves review.",
        attributes: { conditions: ["queue > 0", "no active freeze"] },
        success_signal: {
          observable: "queue depth",
          sensor: "dispatch metrics",
          threshold: "< 20",
          is_proxy: false,
        },
        attention: { boost: 3, override: null, rationale: "Focus this cycle." },
        clarifications: [
          { question: "What counts as the queue?", answer: "Open tactics (2026-07-01)." },
        ],
      }),
    );
    seed(dir, anode({ id: "tactic-t", kind: "tactic", serves: ["strategy-s"] }));

    const p = buildAncestryProjection(dir, "tactic-t");
    expect(p.root).toBe("tactic-t");
    expect(p.truncated).toBe(false);
    expect(p.ancestors.map((a) => a.id)).toEqual(["strategy-s", "virtue-v"]);

    const s = p.ancestors[0];
    expect(s.kind).toBe("strategy");
    expect(s.statement).toBe("Bound the queue.");
    expect(s.rationale).toBe("An unbounded queue starves review.");
    expect(s.conditions).toEqual(["queue > 0", "no active freeze"]);
    expect(s.success_signal?.observable).toBe("queue depth");
    expect(s.attention_rationale).toBe("Focus this cycle.");
    expect(s.clarification_titles).toEqual(["What counts as the queue?"]);
    expect(s.clarifications_omitted).toBe(0);
  });

  it("terminates the walk at a virtue root (no further hops)", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "virtue-v", kind: "virtue" }));
    seed(dir, anode({ id: "strategy-s", kind: "strategy", serves: ["virtue-v"] }));

    const p = buildAncestryProjection(dir, "strategy-s");
    expect(p.ancestors.map((a) => a.id)).toEqual(["virtue-v"]);
    expect(p.truncated).toBe(false);
    // The virtue itself carries no parent/serves, so nothing beyond it is emitted.
    expect(readNode(dir, "virtue-v").serves).toEqual([]);
  });

  it("skips a dangling parent/serves id with a notes entry and never throws", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-d", kind: "tactic", serves: ["strategy-missing"] }));

    const p = buildAncestryProjection(dir, "tactic-d");
    expect(p.ancestors).toEqual([]);
    expect(p.notes.some((n) => n.includes("strategy-missing"))).toBe(true);
  });

  it("terminates an injected cycle via the visited set and sets truncated at the hop cap", () => {
    const dir = tempDir();
    // A ring of RING nodes over `parent` edges: node-i.parent = node-(i+1),
    // node-(RING-1).parent = node-0. Without the visited set this loops forever;
    // with it the walk visits each distinct node once and trips MAX_ANCESTORS.
    const RING = MAX_ANCESTORS + 2;
    for (let i = 0; i < RING; i++) {
      seed(dir, anode({ id: `node-${i}`, kind: "tactic", parent: `node-${(i + 1) % RING}` }));
    }

    const p = buildAncestryProjection(dir, "node-0");
    expect(p.truncated).toBe(true);
    expect(p.ancestors.length).toBe(MAX_ANCESTORS);
    expect(p.notes.some((n) => n.includes(`${MAX_ANCESTORS}-node cap`))).toBe(true);
  });

  it("caps clarification titles at MAX_CLARIFICATION_TITLES with an accurate omitted count", () => {
    const dir = tempDir();
    const total = MAX_CLARIFICATION_TITLES + 5;
    const clarifications = Array.from({ length: total }, (_unused, i) => ({
      question: `Question ${i}?`,
      answer: `Answer ${i} (2026-07-01).`,
    }));
    seed(dir, anode({ id: "strategy-c", kind: "strategy", clarifications }));
    seed(dir, anode({ id: "tactic-c", kind: "tactic", serves: ["strategy-c"] }));

    const p = buildAncestryProjection(dir, "tactic-c");
    const a = p.ancestors[0];
    expect(a.clarification_titles.length).toBe(MAX_CLARIFICATION_TITLES);
    expect(a.clarifications_omitted).toBe(5);

    const md = renderAncestryProjection(p);
    expect(md).toContain("…and 5 more");
  });

  it("trips MAX_PROJECTION_BYTES, drops trailing blocks, and sets truncated", () => {
    const dir = tempDir();
    // A parent chain of tactics with large statements: rendered well over 24 KB.
    const bigStatement = "x".repeat(4000);
    const N = 10;
    for (let i = 0; i < N; i++) {
      seed(
        dir,
        anode({
          id: `chain-${i}`,
          kind: "tactic",
          statement: bigStatement,
          parent: i + 1 < N ? `chain-${i + 1}` : null,
        }),
      );
    }

    const p = buildAncestryProjection(dir, "chain-0");
    expect(p.truncated).toBe(true);
    // Some trailing blocks were dropped — fewer than the N-1 reachable ancestors.
    expect(p.ancestors.length).toBeLessThan(N - 1);
    expect(Buffer.byteLength(renderAncestryProjection(p), "utf8")).toBeLessThanOrEqual(
      MAX_PROJECTION_BYTES,
    );
    expect(p.notes.some((n) => n.includes("byte projection cap"))).toBe(true);
  });
});

describe("renderAncestryProjection", () => {
  it("emits the read-only header and the fixed field order", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "virtue-v", kind: "virtue" }));
    seed(dir, anode({ id: "tactic-t", kind: "tactic", serves: ["virtue-v"] }));

    const md = renderAncestryProjection(buildAncestryProjection(dir, "tactic-t"));

    // Read-only header naming the root.
    expect(md.split("\n")[0]).toMatch(/read-only ancestry context for `tactic-t`/i);

    // Fixed per-block field order.
    const iStatement = md.indexOf("- statement:");
    const iRationale = md.indexOf("- rationale:");
    const iConditions = md.indexOf("- conditions:");
    const iSignal = md.indexOf("- success_signal:");
    const iAttention = md.indexOf("- attention:");
    const iClar = md.indexOf("- clarifications (titles only");
    expect(iStatement).toBeGreaterThan(-1);
    expect(iStatement).toBeLessThan(iRationale);
    expect(iRationale).toBeLessThan(iConditions);
    expect(iConditions).toBeLessThan(iSignal);
    expect(iSignal).toBeLessThan(iAttention);
    expect(iAttention).toBeLessThan(iClar);
  });
});
