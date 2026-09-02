import { describe, expect, it } from "vitest";
import {
  MOUNT_KINDS,
  consolidationVerdict,
  parseStampGrammar,
  renderStamp,
} from "../src/consolidation.js";
import type { DispositionRecord, DispositionSource, DispositionState } from "../src/consolidation.js";
import { IntentionSchemaError } from "../src/errors.js";

/**
 * The verdict matrix, one `it` per row. Deliberately NOT table-driven: the
 * three non-`ratified` rows are the sanction gate, and grouping them into one
 * loop is how a regression on rule (4) — the row that decides whether an AI
 * override stays in the author's review queue — would hide behind a passing
 * neighbour. Each row also asserts the rule number in `reason`, so a branch
 * cannot be re-pointed at a different rule without failing.
 */
describe("consolidationVerdict — the authority gate", () => {
  it("refuses ratified-only content under rule (1)", () => {
    const verdict = consolidationVerdict(["ratified"]);
    expect(verdict.permitted).toBe(false);
    expect(verdict.resultState).toBeNull();
    expect(verdict.reason).toContain("rule (1)");
    expect(verdict.reason).toContain("interview");
  });

  it("refuses ratified + deferred under rule (1) — one ratified stamp is enough", () => {
    const verdict = consolidationVerdict(["deferred", "ratified"]);
    expect(verdict.permitted).toBe(false);
    expect(verdict.resultState).toBeNull();
    expect(verdict.reason).toContain("rule (1)");
  });

  it("refuses ratified + delegated under rule (1)", () => {
    const verdict = consolidationVerdict(["delegated", "ratified"]);
    expect(verdict.permitted).toBe(false);
    expect(verdict.resultState).toBeNull();
    expect(verdict.reason).toContain("rule (1)");
  });

  it("permits deferred-only content, inheriting the deferred stamp (rule 3)", () => {
    const verdict = consolidationVerdict(["deferred", "deferred"]);
    expect(verdict.permitted).toBe(true);
    expect(verdict.resultState).toBe("deferred");
    expect(verdict.reason).toContain("rule (3)");
    expect(verdict.reason).toContain("inherits");
  });

  it("permits delegated-only content, BECOMING deferred (rule 4, not staying delegated)", () => {
    const verdict = consolidationVerdict(["delegated"]);
    expect(verdict.permitted).toBe(true);
    // The row that must not be written backwards: a fold left stamped
    // `delegated` would drop out of the author review queue.
    expect(verdict.resultState).toBe("deferred");
    expect(verdict.resultState).not.toBe("delegated");
    expect(verdict.reason).toContain("rule (4)");
    expect(verdict.reason).toContain("author review queue");
  });

  it("permits deferred + delegated under rule (4), resolving to deferred", () => {
    const verdict = consolidationVerdict(["deferred", "delegated"]);
    expect(verdict.permitted).toBe(true);
    expect(verdict.resultState).toBe("deferred");
    expect(verdict.reason).toContain("rule (4)");
  });

  it("refuses empty input — unknown provenance is treated as binding", () => {
    const verdict = consolidationVerdict([]);
    expect(verdict.permitted).toBe(false);
    expect(verdict.resultState).toBeNull();
    expect(verdict.reason).toBe(
      "no disposition stamps found — authority is unknown, treat as binding",
    );
  });

  it("throws on a state token outside the three-state vocabulary", () => {
    // The boundary guard: states reach this gate from a parser that may be
    // swapped for `review.ts`'s, so the gate validates rather than trusting.
    const smuggled = ["rescinded"] as unknown as readonly DispositionState[]; // type-safety-ok: exercising the runtime boundary guard with a value the type forbids
    expect(() => consolidationVerdict(smuggled)).toThrow(IntentionSchemaError);
    expect(() => consolidationVerdict(smuggled)).toThrow(/rescinded/);
  });
});

describe("parseStampGrammar — the interim tag grammar", () => {
  it("accepts every spelling in the normalization table", () => {
    const text = [
      "Ratified in the round (decision: author-ratified, 2026-08-31).",
      "Bare ratified spelling (decision: ratified, 2026-08-31).",
      "Held on trust (decision: delegated-pending-review, delegation-anthropic-claude, 2026-08-30).",
      "Bare deferred spelling (decision: deferred, delegation-anthropic-claude, 2026-08-30).",
      "Claude-owned (decision: delegated-review-declined, delegation-anthropic-claude, 2026-08-30).",
      "Bare delegated spelling (decision: delegated, delegation-anthropic-claude, 2026-08-30).",
    ].join("\n");

    const records = parseStampGrammar("strategy-explicit-intent", "strategy", text);

    expect(records.map((r) => r.state)).toEqual([
      "ratified",
      "ratified",
      "deferred",
      "deferred",
      "delegated",
      "delegated",
    ]);
    expect(records.map((r) => r.delegatee)).toEqual([
      null,
      null,
      "delegation-anthropic-claude",
      "delegation-anthropic-claude",
      "delegation-anthropic-claude",
      "delegation-anthropic-claude",
    ]);
    expect(records.every((r) => r.date.startsWith("2026-08-"))).toBe(true);
    expect(records.every((r) => r.nodeId === "strategy-explicit-intent")).toBe(true);
  });

  it("normalizes case, tolerating the ALL-CAPS prose spelling of a state", () => {
    const records = parseStampGrammar(
      "strategy-explicit-intent",
      "strategy",
      "(decision: DELEGATED-PENDING-REVIEW, delegation-anthropic-claude, 2026-08-30)",
    );
    expect(records).toHaveLength(1);
    expect(records[0]?.state).toBe("deferred");
  });

  it("bounds the excerpt and flattens it to one line", () => {
    const text = `${"context ".repeat(80)}(decision: deferred, delegation-anthropic-claude, 2026-08-30)\n\tmore\ttext ${"tail ".repeat(80)}`;
    const records = parseStampGrammar("strategy-explicit-intent", "strategy", text);
    const excerpt = records[0]?.excerpt ?? "";
    expect(excerpt.length).toBeGreaterThan(0);
    expect(excerpt.length).toBeLessThanOrEqual(200);
    expect(excerpt).not.toContain("\n");
    expect(excerpt).not.toContain("\t");
  });

  it("returns an empty list for text carrying no stamp", () => {
    expect(parseStampGrammar("tactic-x", "tactic", "No dispositions here at all.")).toEqual([]);
  });

  it("throws on an unrecognized state token, naming the node", () => {
    const text = "Some prose (decision: rescinded, delegation-anthropic-claude, 2026-08-30) more.";
    expect(() => parseStampGrammar("strategy-explicit-intent", "strategy", text)).toThrow(
      IntentionSchemaError,
    );
    expect(() => parseStampGrammar("strategy-explicit-intent", "strategy", text)).toThrow(
      /strategy-explicit-intent/,
    );
    // The excerpt rides along so a reader can find the stamp without grepping.
    expect(() => parseStampGrammar("strategy-explicit-intent", "strategy", text)).toThrow(
      /rescinded/,
    );
  });

  it("throws rather than skipping a wrong-arity stamp", () => {
    expect(() =>
      parseStampGrammar("tactic-x", "tactic", "(decision: author-issued 2026-09-01)"),
    ).toThrow(/expected 2 or 3 comma-separated elements/);
  });

  it("throws on a deferred stamp missing its delegatee (grammar note H11)", () => {
    expect(() => parseStampGrammar("tactic-x", "tactic", "(decision: deferred, 2026-08-30)")).toThrow(
      /must name its delegatee mount id/,
    );
  });

  it("throws on a malformed date", () => {
    expect(() =>
      parseStampGrammar("tactic-x", "tactic", "(decision: author-ratified, YYYY-MM-DD)"),
    ).toThrow(/expected a YYYY-MM-DD date/);
  });

  it("refuses an empty node id or kind", () => {
    expect(() => parseStampGrammar("", "tactic", "")).toThrow(/non-empty node id/);
    expect(() => parseStampGrammar("tactic-x", "", "")).toThrow(/non-empty node kind/);
  });

  it("keeps `key` ordinals stable across two parses of the same text", () => {
    const text = [
      "First (decision: deferred, delegation-anthropic-claude, 2026-08-30).",
      "Second (decision: author-ratified, 2026-08-31).",
      "Third (decision: delegated, delegation-anthropic-claude, 2026-09-01).",
    ].join("\n\n");

    const first = parseStampGrammar("strategy-explicit-intent", "strategy", text);
    const second = parseStampGrammar("strategy-explicit-intent", "strategy", text);

    expect(first.map((r) => r.key)).toEqual([
      "strategy-explicit-intent#1",
      "strategy-explicit-intent#2",
      "strategy-explicit-intent#3",
    ]);
    // Byte-identical across re-parses: the global regex must not carry
    // `lastIndex` from the previous call, and the ordinal must be positional.
    expect(second).toEqual(first);
  });
});

describe("MOUNT_KINDS — a stamp on a mount record is a defect", () => {
  /**
   * The routing a consumer performs, written here as the seam's contract:
   * `parseStampGrammar` is kind-independent, and `MOUNT_KINDS` is the predicate
   * data by which Unit 2's `deferredQueue` sends a mount record's dispositions
   * to `defects` instead of `items`. Mount points are never doctrine.
   */
  function route(
    source: DispositionSource,
    nodeId: string,
    kind: string,
    text: string,
  ): { items: DispositionRecord[]; defects: DispositionRecord[] } {
    const records = source.dispositions(nodeId, kind, text);
    const isMount = MOUNT_KINDS.some((k) => k === kind);
    return { items: isMount ? [] : records, defects: isMount ? records : [] };
  }

  // `parseStampGrammar` satisfies the seam structurally; this binding is the
  // compile-time proof, and it is what `review.ts`'s adapter will replace.
  const source: DispositionSource = { dispositions: parseStampGrammar };
  const text = "Adopted here (decision: deferred, delegation-anthropic-claude, 2026-08-30).";

  it("lists both mount kinds", () => {
    expect([...MOUNT_KINDS]).toEqual(["tradition", "delegation"]);
  });

  it("routes a tradition node's disposition to defects, never to the queue", () => {
    const routed = route(source, "tradition-hacker-culture", "tradition", text);
    expect(routed.items).toEqual([]);
    expect(routed.defects).toHaveLength(1);
    expect(routed.defects[0]?.key).toBe("tradition-hacker-culture#1");
  });

  it("routes a strategy node's identical disposition to the queue", () => {
    const routed = route(source, "strategy-explicit-intent", "strategy", text);
    expect(routed.defects).toEqual([]);
    expect(routed.items).toHaveLength(1);
    expect(routed.items[0]?.state).toBe("deferred");
  });
});

describe("renderStamp — one canonical spelling per state", () => {
  it("emits the two-element form for a ratified stamp", () => {
    expect(renderStamp("ratified", null, "2026-08-31")).toBe(
      "(decision: author-ratified, 2026-08-31)",
    );
  });

  it("emits the three-element form for deferred and delegated stamps", () => {
    expect(renderStamp("deferred", "delegation-anthropic-claude", "2026-08-30")).toBe(
      "(decision: deferred, delegation-anthropic-claude, 2026-08-30)",
    );
    expect(renderStamp("delegated", "delegation-anthropic-claude", "2026-08-30")).toBe(
      "(decision: delegated, delegation-anthropic-claude, 2026-08-30)",
    );
  });

  it("round-trips through the parser for every state", () => {
    const cases: { state: DispositionState; delegatee: string | null }[] = [
      { state: "ratified", delegatee: null },
      { state: "deferred", delegatee: "delegation-anthropic-claude" },
      { state: "delegated", delegatee: "delegation-anthropic-claude" },
    ];
    for (const c of cases) {
      const stamp = renderStamp(c.state, c.delegatee, "2026-09-02");
      const parsed = parseStampGrammar("tactic-consolidation-operation", "tactic", stamp);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]?.state).toBe(c.state);
      expect(parsed[0]?.delegatee).toBe(c.delegatee);
      expect(parsed[0]?.date).toBe("2026-09-02");
    }
  });

  it("refuses a ratified stamp carrying a delegatee", () => {
    expect(() => renderStamp("ratified", "delegation-anthropic-claude", "2026-08-31")).toThrow(
      /takes no delegatee/,
    );
  });

  it("refuses a deferred or delegated stamp with no delegatee", () => {
    expect(() => renderStamp("deferred", null, "2026-08-30")).toThrow(
      /must name its delegatee mount id/,
    );
    expect(() => renderStamp("delegated", "   ", "2026-08-30")).toThrow(
      /must name its delegatee mount id/,
    );
  });

  it("refuses a date that is not YYYY-MM-DD", () => {
    expect(() => renderStamp("ratified", null, "31-08-2026")).toThrow(/expected a YYYY-MM-DD date/);
  });
});
