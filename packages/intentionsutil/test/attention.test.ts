import { describe, expect, it } from "vitest";
import type { Attention, IntentionNode } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";
import { resolveAttention } from "../src/attention.js";

/** Build a full IntentionNode fixture, filling required/default fields. */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "raw",
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
    attributes: partial.attributes ?? {},
  };
}

/** Shorthand for a well-formed attention injection with the given weight. */
function attn(weight: number, extra: Partial<Attention> = {}): Attention {
  return {
    weight,
    rationale: extra.rationale ?? "because",
    subordinate_to: extra.subordinate_to ?? [],
    review_trigger: extra.review_trigger ?? (weight === 0 ? "when unblocked" : null),
  };
}

/**
 * The kind nodes every fixture needs. Eligibility is data: kind-strategy and
 * kind-tactic set `goal_layer: true`, kind-virtue and kind-kind do not. So
 * strategies and tactics are eligible for a flow entry; virtues and kind nodes
 * never are.
 */
function kinds(): IntentionNode[] {
  return [
    anode({ id: "kind-kind", kind: "kind", status: "codified" }),
    anode({
      id: "kind-strategy",
      kind: "kind",
      status: "codified",
      attributes: { goal_layer: true },
    }),
    anode({
      id: "kind-tactic",
      kind: "kind",
      status: "codified",
      attributes: { goal_layer: true },
    }),
    anode({ id: "kind-virtue", kind: "kind", status: "codified" }),
  ];
}

describe("resolveAttention eligibility", () => {
  it("gives an injected node value > 0 with itself in sources, and no entry to ineligible nodes", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({
        id: "strategy-1",
        kind: "strategy",
        serves: ["virtue-root"],
        attention: attn(5),
      }),
    ];

    const result = resolveAttention(nodes);

    // Only the eligible, injected strategy gets an entry.
    expect(result.size).toBe(1);
    const s = result.get("strategy-1");
    expect(s).toBeDefined();
    expect(s?.value).toBe(5);
    expect(s?.sources).toEqual(["strategy-1"]);

    // Virtues and kind nodes are ineligible — no entry at all.
    expect(result.has("virtue-root")).toBe(false);
    expect(result.has("kind-kind")).toBe(false);
    expect(result.has("kind-strategy")).toBe(false);
    expect(result.has("kind-tactic")).toBe(false);
    expect(result.has("kind-virtue")).toBe(false);
  });
});

describe("resolveAttention flow", () => {
  it("splits a strategy's flow evenly among its children while retaining its own rank", () => {
    // strategy-parent (weight 6, serves a virtue → provenance 1) has 3 children:
    // two sub-strategies via `parent` and one tactic via `serves`. Each child
    // receives 6 / 3 = 2, while the strategy itself retains value 6.
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({
        id: "strategy-parent",
        kind: "strategy",
        serves: ["virtue-root"],
        attention: attn(6),
      }),
      anode({ id: "sub-1", kind: "strategy", parent: "strategy-parent" }),
      anode({ id: "sub-2", kind: "strategy", parent: "strategy-parent" }),
      anode({ id: "tactic-1", kind: "tactic", serves: ["strategy-parent"] }),
    ];

    const result = resolveAttention(nodes);

    expect(result.get("strategy-parent")?.value).toBe(6);
    expect(result.get("sub-1")?.value).toBe(2);
    expect(result.get("sub-2")?.value).toBe(2);
    expect(result.get("tactic-1")?.value).toBe(2);
    // A child's inherited share carries the parent's source.
    expect(result.get("sub-1")?.sources).toEqual(["strategy-parent"]);
  });

  it("discounts an injection whose chain reaches no virtue by PROVENANCE_DISCOUNT (0.5)", () => {
    const nodes = [
      ...kinds(),
      // No serves/parent chain to any virtue → provenance 0.5.
      anode({ id: "strategy-orphan", kind: "strategy", attention: attn(10) }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("strategy-orphan")?.value).toBe(5); // 10 * 0.5
  });

  it("damps an injection with a non-empty subordinate_to by SUBORDINATION_DAMP (0.25), stacking with the provenance discount", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      // Reaches a virtue (provenance 1) but is subordinate → 8 * 1 * 0.25 = 2.
      anode({
        id: "strategy-sub",
        kind: "strategy",
        serves: ["virtue-root"],
        attention: attn(8, { subordinate_to: ["virtue-root"] }),
      }),
      // Reaches no virtue AND subordinate → 8 * 0.5 * 0.25 = 1.
      anode({
        id: "strategy-both",
        kind: "strategy",
        attention: attn(8, { subordinate_to: ["virtue-root"] }),
      }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("strategy-sub")?.value).toBe(2);
    expect(result.get("strategy-both")?.value).toBe(1);
  });
});

describe("resolveAttention banding", () => {
  it("bands a weight-0 (explicitly deferred) node as bottom when another node carries a positive injection", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({
        id: "strategy-active",
        kind: "strategy",
        serves: ["virtue-root"],
        attention: attn(5),
      }),
      anode({
        id: "strategy-deferred",
        kind: "strategy",
        serves: ["virtue-root"],
        attention: attn(0),
      }),
    ];

    const result = resolveAttention(nodes);
    const deferred = result.get("strategy-deferred");
    expect(deferred?.value).toBe(0);
    expect(deferred?.band).toBe("bottom");
  });

  it("bands every eligible node middle with value 0 when there are no injections anywhere", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "strategy-a", kind: "strategy" }),
      anode({ id: "strategy-b", kind: "strategy" }),
    ];

    const result = resolveAttention(nodes);
    for (const id of ["strategy-a", "strategy-b"]) {
      expect(result.get(id)?.value).toBe(0);
      expect(result.get(id)?.band).toBe("middle");
    }
  });

  it("assigns top / middle / bottom by the mean-of-nonzero-flows thresholds", () => {
    // Five independent strategies serving the same virtue (each retains its own
    // injection; the virtue carries zero flow). Flows {20, 2, 1, 1, 1} have
    // mean 5, so BAND_HIGH*mean = 20 and BAND_LOW*mean = 1.25:
    //   20 >= 20        → top
    //   1.25 < 2 < 20   → middle
    //   1 <= 1.25       → bottom
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({ id: "s-top", kind: "strategy", serves: ["virtue-root"], attention: attn(20) }),
      anode({ id: "s-mid", kind: "strategy", serves: ["virtue-root"], attention: attn(2) }),
      anode({ id: "s-bot-1", kind: "strategy", serves: ["virtue-root"], attention: attn(1) }),
      anode({ id: "s-bot-2", kind: "strategy", serves: ["virtue-root"], attention: attn(1) }),
      anode({ id: "s-bot-3", kind: "strategy", serves: ["virtue-root"], attention: attn(1) }),
    ];

    const result = resolveAttention(nodes);
    expect(result.get("s-top")?.value).toBe(20);
    expect(result.get("s-top")?.band).toBe("top");
    expect(result.get("s-mid")?.value).toBe(2);
    expect(result.get("s-mid")?.band).toBe("middle");
    expect(result.get("s-bot-1")?.value).toBe(1);
    expect(result.get("s-bot-1")?.band).toBe("bottom");
  });
});

describe("resolveAttention cycle guard", () => {
  it("throws IntentionSchemaError on a parent-edge cycle", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "cyc-a", kind: "strategy", parent: "cyc-b" }),
      anode({ id: "cyc-b", kind: "strategy", parent: "cyc-a" }),
    ];

    expect(() => resolveAttention(nodes)).toThrow(IntentionSchemaError);
    expect(() => resolveAttention(nodes)).toThrow(/attention flow cycle/);
  });
});

describe("resolveAttention determinism", () => {
  it("returns deep-equal maps for the same input and a shuffled copy", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      anode({
        id: "strategy-parent",
        kind: "strategy",
        serves: ["virtue-root"],
        attention: attn(6),
      }),
      anode({ id: "sub-1", kind: "strategy", parent: "strategy-parent" }),
      anode({ id: "sub-2", kind: "strategy", parent: "strategy-parent" }),
      anode({ id: "tactic-1", kind: "tactic", serves: ["strategy-parent"] }),
    ];
    const shuffled = [...nodes].reverse();

    const a = Object.fromEntries(resolveAttention(nodes));
    const b = Object.fromEntries(resolveAttention([...nodes]));
    const c = Object.fromEntries(resolveAttention(shuffled));

    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });
});
