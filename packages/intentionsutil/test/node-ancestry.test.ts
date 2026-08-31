import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";
import {
  allocateBudgets,
  blockBytes,
  buildAncestryProjection,
  renderAncestryProjection,
  renderBlock,
  shedBlockToFit,
  MAX_ANCESTORS,
  MAX_CLARIFICATION_TITLES,
  MAX_PROJECTION_BYTES,
  MAX_RENDERED_ANCESTORS,
  MIN_RATIONALE_BYTES,
} from "../scripts/node-ancestry.js";
import type { AncestorEntry } from "../scripts/node-ancestry.js";

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

function seed(dir: string, node: IntentionNode): void {
  writeNode(dir, node);
}

/** Minimal AncestorEntry fixture, for exercising the pure shed/render helpers. */
function aentry(partial: Partial<AncestorEntry> & { id: string }): AncestorEntry {
  return {
    id: partial.id,
    kind: partial.kind ?? "strategy",
    statement: partial.statement ?? `Statement for ${partial.id}`,
    rationale: partial.rationale ?? null,
    conditions: partial.conditions ?? [],
    success_signal: partial.success_signal ?? null,
    attention_rationale: partial.attention_rationale ?? null,
    clarification_titles: partial.clarification_titles ?? [],
    clarifications_omitted: partial.clarifications_omitted ?? 0,
    conditions_omitted: partial.conditions_omitted ?? 0,
    rationale_truncated: partial.rationale_truncated ?? false,
  };
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
        attention: { boosts: { "1": 3 }, rationale: "Focus this cycle." },
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
    // The WALK stops at MAX_ANCESTORS (the note records it); the render backstop
    // then trims the walked set down to MAX_RENDERED_ANCESTORS.
    expect(p.notes.some((n) => n.includes(`${MAX_ANCESTORS}-node cap`))).toBe(true);
    expect(p.ancestors.length).toBe(MAX_RENDERED_ANCESTORS);
    expect(p.notes.some((n) => n.includes(`${MAX_RENDERED_ANCESTORS}-ancestor render cap`))).toBe(
      true,
    );
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

  it("fits MAX_PROJECTION_BYTES by shedding inside blocks — never by dropping an ancestor", () => {
    const dir = tempDir();
    // A parent chain of tactics with large rationales: naturally well over 24 KB.
    const bigRationale = "x".repeat(4000);
    const N = 10;
    for (let i = 0; i < N; i++) {
      seed(
        dir,
        anode({
          id: `chain-${i}`,
          kind: "tactic",
          rationale: bigRationale,
          parent: i + 1 < N ? `chain-${i + 1}` : null,
        }),
      );
    }

    const p = buildAncestryProjection(dir, "chain-0");
    expect(p.truncated).toBe(true);
    // Every reachable ancestor survives — the budget is spent by fair share.
    expect(p.ancestors.length).toBe(N - 1);
    expect(p.ancestors.every((a) => a.rationale_truncated)).toBe(true);
    expect(Buffer.byteLength(renderAncestryProjection(p), "utf8")).toBeLessThanOrEqual(
      MAX_PROJECTION_BYTES,
    );
  });

  it("keeps every ancestor when one nearest block alone exceeds the whole byte cap", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "virtue-v", kind: "virtue", statement: "Be temperate." }));
    seed(dir, anode({ id: "strategy-s", kind: "strategy", serves: ["virtue-v"] }));
    seed(dir, anode({ id: "strategy-s2", kind: "strategy" }));
    // One ancestor whose own natural block is larger than the entire projection cap.
    seed(
      dir,
      anode({
        id: "tactic-huge",
        kind: "tactic",
        rationale: "y".repeat(MAX_PROJECTION_BYTES * 2),
      }),
    );
    seed(
      dir,
      anode({
        id: "tactic-t",
        kind: "tactic",
        parent: "tactic-huge",
        serves: ["strategy-s", "strategy-s2"],
      }),
    );

    const p = buildAncestryProjection(dir, "tactic-t");
    // Before the fair-share allocator this rendered ZERO ancestors.
    expect(p.ancestors.map((a) => a.id).sort()).toEqual([
      "strategy-s",
      "strategy-s2",
      "tactic-huge",
      "virtue-v",
    ]);
    const md = renderAncestryProjection(p);
    expect(Buffer.byteLength(md, "utf8")).toBeLessThanOrEqual(MAX_PROJECTION_BYTES);
    // The virtue root is intact — statement untouched, nothing shed from it.
    expect(md).toContain("## virtue-v  (virtue)");
    expect(md).toContain("- statement: Be temperate.");
    const virtue = p.ancestors.find((a) => a.id === "virtue-v");
    expect(virtue?.rationale_truncated).toBe(false);
  });

  it("keeps the virtue root when the intervening strategy is enormous", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "virtue-v", kind: "virtue", statement: "Be temperate." }));
    seed(
      dir,
      anode({
        id: "strategy-big",
        kind: "strategy",
        serves: ["virtue-v"],
        rationale: "z".repeat(MAX_PROJECTION_BYTES * 3),
      }),
    );
    seed(dir, anode({ id: "tactic-t", kind: "tactic", serves: ["strategy-big"] }));

    const md = renderAncestryProjection(buildAncestryProjection(dir, "tactic-t"));
    expect(md).toContain("## virtue-v  (virtue)");
    expect(md).toContain("- statement: Be temperate.");
    expect(Buffer.byteLength(md, "utf8")).toBeLessThanOrEqual(MAX_PROJECTION_BYTES);
  });

  it("applies the MAX_RENDERED_ANCESTORS backstop, keeping virtues and dropping the middle", () => {
    const dir = tempDir();
    // A parent chain deeper than the render cap, rooted at a virtue.
    const N = MAX_RENDERED_ANCESTORS + 8;
    for (let i = 0; i < N; i++) {
      const last = i + 1 === N;
      seed(
        dir,
        anode({
          id: last ? "virtue-root" : `deep-${i}`,
          kind: last ? "virtue" : "tactic",
          parent: last ? null : i + 2 === N ? "virtue-root" : `deep-${i + 1}`,
        }),
      );
    }

    const p = buildAncestryProjection(dir, "deep-0");
    expect(p.ancestors.length).toBe(MAX_RENDERED_ANCESTORS);
    expect(p.ancestors.some((a) => a.kind === "virtue")).toBe(true);
    // The nearest non-virtue ancestors are kept; the drops come from the middle.
    expect(p.ancestors[0].id).toBe("deep-1");
    expect(p.ancestors[p.ancestors.length - 1].id).toBe("virtue-root");
    expect(p.truncated).toBe(true);
    expect(p.notes.some((n) => n.includes(`${MAX_RENDERED_ANCESTORS}-ancestor render cap`))).toBe(
      true,
    );
  });

  it("pushes no notes entry for within-block shedding (stderr WARNING stays meaningful)", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "virtue-v", kind: "virtue" }));
    seed(dir, anode({ id: "strategy-s", kind: "strategy", serves: ["virtue-v"] }));
    seed(
      dir,
      anode({
        id: "tactic-huge",
        kind: "tactic",
        rationale: "y".repeat(MAX_PROJECTION_BYTES * 2),
      }),
    );
    seed(dir, anode({ id: "tactic-t", kind: "tactic", parent: "tactic-huge", serves: ["strategy-s"] }));

    const p = buildAncestryProjection(dir, "tactic-t");
    expect(p.truncated).toBe(true);
    expect(p.notes).toEqual([]); // shedding is normal — no WARNING
  });
});

describe("allocateBudgets", () => {
  it("returns the natural sizes unchanged when they fit", () => {
    expect(allocateBudgets([100, 200], 1000)).toEqual([100, 200]);
  });

  it("returns [] for no blocks", () => {
    expect(allocateBudgets([], 1000)).toEqual([]);
  });

  it("fits the budget and gives every block a non-zero share when over", () => {
    const result = allocateBudgets([10_000, 20_000, 30_000], 1000);
    expect(result.reduce((s, n) => s + n, 0)).toBeLessThanOrEqual(1000);
    expect(result.every((n) => n > 0)).toBe(true);
  });

  it("leaves small blocks at natural size and hands the remainder to the huge one", () => {
    const result = allocateBudgets([50, 50, 50, 100_000], 1000);
    expect(result.slice(0, 3)).toEqual([50, 50, 50]);
    expect(result[3]).toBe(850);
    expect(result.reduce((s, n) => s + n, 0)).toBeLessThanOrEqual(1000);
  });

  it("splits the budget evenly when every block wants more than its share", () => {
    const result = allocateBudgets([500, 500, 500], 300);
    expect(result).toEqual([100, 100, 100]);
  });
});

describe("shedBlockToFit", () => {
  function shedFixture(): AncestorEntry {
    return aentry({
      id: "strategy-shed",
      statement: "Bound the queue.",
      rationale: "r".repeat(2000),
      conditions: Array.from({ length: 5 }, (_unused, i) => `condition ${i} ${"c".repeat(200)}`),
      clarification_titles: Array.from({ length: 5 }, (_unused, i) => `question ${i} ${"q".repeat(200)}?`),
      success_signal: {
        observable: "queue depth",
        sensor: "dispatch metrics",
        threshold: "< 20",
        is_proxy: false,
      },
    });
  }

  it("sheds clarification titles first", () => {
    const a = shedFixture();
    const natural = blockBytes(a);
    expect(shedBlockToFit(a, natural - 500)).toBe(true);
    expect(a.clarifications_omitted).toBeGreaterThan(0);
    expect(a.clarification_titles.length).toBeGreaterThan(0); // not all of them
    expect(a.conditions_omitted).toBe(0);
    expect(a.rationale_truncated).toBe(false);
  });

  it("sheds conditions only after every clarification title is gone", () => {
    const a = shedFixture();
    const natural = blockBytes(a);
    expect(shedBlockToFit(a, natural - 1500)).toBe(true);
    expect(a.clarification_titles).toEqual([]);
    expect(a.clarifications_omitted).toBe(5);
    expect(a.conditions_omitted).toBeGreaterThan(0);
    expect(a.conditions.length).toBeGreaterThan(0); // conditions not exhausted yet
    expect(a.rationale_truncated).toBe(false);
  });

  it("truncates the rationale last, keeping heading, statement and success_signal", () => {
    const a = shedFixture();
    expect(shedBlockToFit(a, 600)).toBe(true);
    expect(a.clarification_titles).toEqual([]);
    expect(a.conditions).toEqual([]);
    expect(a.conditions_omitted).toBe(5);
    expect(a.rationale_truncated).toBe(true);
    expect(Buffer.byteLength(a.rationale ?? "", "utf8")).toBeGreaterThanOrEqual(
      MIN_RATIONALE_BYTES,
    );

    const md = renderBlock(a);
    expect(md).toContain("## strategy-shed  (strategy)");
    expect(md).toContain("- statement: Bound the queue.");
    expect(md).toContain("- success_signal: queue depth — < 20 (dispatch metrics)");
  });

  it("is a no-op when the block already fits", () => {
    const a = shedFixture();
    expect(shedBlockToFit(a, blockBytes(a))).toBe(false);
    expect(a.clarifications_omitted).toBe(0);
    expect(a.conditions_omitted).toBe(0);
    expect(a.rationale_truncated).toBe(false);
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

  it("names the bounds in effect in the header line", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "virtue-v", kind: "virtue" }));
    seed(dir, anode({ id: "tactic-t", kind: "tactic", serves: ["virtue-v"] }));

    const header = renderAncestryProjection(buildAncestryProjection(dir, "tactic-t")).split("\n")[0];
    expect(header).toContain(`${MAX_PROJECTION_BYTES} bytes`);
    expect(header).toContain(`${MAX_RENDERED_ANCESTORS} ancestors`);
  });

  it("renders the conditions-omitted marker under conditions", () => {
    const md = renderBlock(
      aentry({ id: "strategy-m", conditions: ["queue > 0"], conditions_omitted: 3 }),
    );
    expect(md).toContain("- conditions:");
    expect(md).toContain("  - queue > 0");
    expect(md).toContain("  - …and 3 more");
  });

  it("renders the rationale-truncated suffix", () => {
    const md = renderBlock(
      aentry({ id: "strategy-m", rationale: "cut short", rationale_truncated: true }),
    );
    expect(md).toContain(
      "- rationale: cut short … (truncated — read intentions/strategy-m.md for the full text)",
    );
  });
});
