import { describe, expect, it } from "vitest";
import { isWaitNode, parseWaitUntil, waitIdFor } from "../src/waits.js";
import type { IntentionNode } from "../src/schema.js";

// tactic-wait-calendar-release Unit 1 — the WAIT node vocabulary: id
// derivation, `wait_until` instant parsing, and canonical-id classification.

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

describe("waitIdFor", () => {
  it("derives the wait id from a source id carrying the tactic- prefix", () => {
    expect(waitIdFor("tactic-x")).toBe("tactic-wait-x");
  });

  it("derives the wait id from a source id with no tactic- prefix", () => {
    expect(waitIdFor("x")).toBe("tactic-wait-x");
  });

  it("throws when the derived id does not fit the node-id slug shape", () => {
    expect(() => waitIdFor("tactic-Bad_Id!")).toThrow(); // type-safety-ok: "!" is inside a string literal test fixture, not a non-null assertion
  });
});

describe("parseWaitUntil", () => {
  it("parses a valid ISO instant to its epoch ms", () => {
    expect(parseWaitUntil("2026-08-06T00:00:00Z")).toBe(Date.parse("2026-08-06T00:00:00Z"));
  });

  it("returns null for a non-string value", () => {
    expect(parseWaitUntil(12345)).toBeNull();
    expect(parseWaitUntil(null)).toBeNull();
    expect(parseWaitUntil(undefined)).toBeNull();
  });

  it("returns null for a string that fails the regex (date-only)", () => {
    expect(parseWaitUntil("2026-08-06")).toBeNull();
  });

  it("returns null for a regex-passing string Date.parse cannot resolve", () => {
    // Passes WAIT_UNTIL_RE's shape check (4-2-2T2:2:2Z) but is not a real
    // calendar instant (month 13, day 45, hour/min/sec 99) — Date.parse
    // yields NaN for this one, unlike out-of-range-but-normalizable values
    // (e.g. 2026-02-30, which V8 rolls forward rather than rejecting).
    expect(parseWaitUntil("2026-13-45T99:99:99Z")).toBeNull();
  });
});

describe("isWaitNode", () => {
  it("is true for a canonically-identified WAIT node", () => {
    const node = anode({
      id: "tactic-wait-x",
      kind: "tactic",
      attributes: { wait_for: "tactic-x" },
    });
    expect(isWaitNode(node)).toBe(true);
  });

  it("is false for a non-tactic kind", () => {
    const node = anode({
      id: "tactic-wait-x",
      kind: "strategy",
      attributes: { wait_for: "tactic-x" },
    });
    expect(isWaitNode(node)).toBe(false);
  });

  it("is false when wait_for is missing", () => {
    const node = anode({ id: "tactic-wait-x", kind: "tactic", attributes: {} });
    expect(isWaitNode(node)).toBe(false);
  });

  it("is false when wait_for is an empty string", () => {
    const node = anode({
      id: "tactic-wait-x",
      kind: "tactic",
      attributes: { wait_for: "" },
    });
    expect(isWaitNode(node)).toBe(false);
  });

  it("is false for a decoy node whose id does not match the canonical derivation", () => {
    // Carries wait_for pointing at tactic-x (canonical id tactic-wait-x) but is
    // itself named something else — must not classify as a real WAIT node.
    const decoy = anode({
      id: "tactic-not-the-real-wait",
      kind: "tactic",
      attributes: { wait_for: "tactic-x" },
    });
    expect(isWaitNode(decoy)).toBe(false);
  });
});
