import { describe, expect, it } from "vitest";
import {
  SHIM_KEYS,
  SHIMS_KEY,
  deriveShimFrontier,
  governs,
  liveShimCount,
  parseShims,
  validateShim,
  validateShimList,
} from "../src/shims.js";
import { IntentionSchemaError } from "../src/errors.js";
import type { ReconciliationCheckRun } from "../src/frontier-reconciliation.js";
import type { CheckResult, CheckTier } from "../src/checks.js";
import { validateGraph, type IntentionNode } from "../src/schema.js";

const DATE = "2026-09-01";

/** A full node fixture; the tests vary only what each case is about. */
function node(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
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
    attributes: partial.attributes ?? {
      status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
    },
  };
}

/** Fixtures are plain objects, not typed `ShimDeclaration`s — the validators take `unknown`. */
function shim(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "finding-ledger",
    target: "a structured finding-ledger record",
    liquidation: "the finding-ledger deriver goes live",
    liquidated_by: null,
    declared: DATE,
    ...overrides,
  };
}

/** A `ReconciliationCheckRun` fixture — mirrors `frontier-reconciliation.test.ts`'s `run()`. */
function run(partial: {
  id: string;
  criterion: string;
  tier?: CheckTier;
  result?: Partial<CheckResult>;
}): ReconciliationCheckRun {
  return {
    check: {
      id: partial.id,
      criterion: partial.criterion,
      describe: `Describes ${partial.id}`,
      run: () => ({ ok: true, detail: "ok", entries: [] }),
    },
    tier: partial.tier ?? "observe",
    result: {
      ok: partial.result?.ok ?? true,
      detail: partial.result?.detail ?? "ok",
      entries: partial.result?.entries ?? [],
    },
  };
}

describe("validateShim", () => {
  it("accepts a well-formed shim and normalizes field order", () => {
    const parsed = validateShim(shim());
    expect(Object.keys(parsed)).toEqual(["id", "target", "liquidation", "liquidated_by", "declared"]);
    expect(parsed.liquidated_by).toBeNull();
  });

  it("accepts a non-null liquidated_by naming a check or criterion id", () => {
    expect(validateShim(shim({ liquidated_by: "validate-graph" })).liquidated_by).toBe(
      "validate-graph",
    );
  });

  it("rejects an unknown key, naming it", () => {
    expect(() => validateShim(shim({ smuggled: true }))).toThrow(IntentionSchemaError);
    expect(() => validateShim(shim({ smuggled: true }))).toThrow(/smuggled/);
  });

  it("rejects a non-object value", () => {
    expect(() => validateShim("nope")).toThrow(IntentionSchemaError);
    expect(() => validateShim(null)).toThrow(IntentionSchemaError);
    expect(() => validateShim([])).toThrow(IntentionSchemaError);
  });

  for (const field of ["id", "target", "liquidation"]) {
    it(`rejects an empty ${field}`, () => {
      expect(() => validateShim(shim({ [field]: "" }))).toThrow(IntentionSchemaError);
    });
  }

  it("rejects a liquidated_by that is neither a string nor null", () => {
    expect(() => validateShim(shim({ liquidated_by: 42 }))).toThrow(IntentionSchemaError);
  });

  it("rejects a malformed declared date", () => {
    expect(() => validateShim(shim({ declared: "09/01/2026" }))).toThrow(IntentionSchemaError);
  });
});

describe("validateShimList", () => {
  it("rejects a duplicate id within one list", () => {
    expect(() =>
      validateShimList([shim({ id: "review" }), shim({ id: "review" })], "attributes.shims"),
    ).toThrow(/Duplicate shim id/);
  });

  it("rejects a non-array value", () => {
    expect(() => validateShimList({}, "attributes.shims")).toThrow(IntentionSchemaError);
  });
});

describe("parseShims", () => {
  it("returns [] when the node carries no shims key", () => {
    expect(parseShims(node({ id: "strategy-a", kind: "strategy" }))).toEqual([]);
  });

  it("reads a well-formed list off attributes.shims", () => {
    const n = node({
      id: "strategy-a",
      kind: "strategy",
      attributes: { shims: [shim({ id: "review" }), shim({ id: "qa" })] },
    });
    expect(parseShims(n).map((s) => s.id)).toEqual(["review", "qa"]);
  });

  it("throws rather than silently dropping a malformed list", () => {
    const n = node({
      id: "strategy-a",
      kind: "strategy",
      attributes: { shims: [{ id: "review" }] }, // missing required fields
    });
    expect(() => parseShims(n)).toThrow(IntentionSchemaError);
  });
});

describe("liveShimCount", () => {
  it("is 0 across a graph carrying no shims", () => {
    expect(liveShimCount([node({ id: "strategy-a", kind: "strategy" })])).toBe(0);
  });

  it("sums shims across every node in the graph — correctness of the count", () => {
    const nodes = [
      node({
        id: "strategy-graph-native-dispatch",
        kind: "strategy",
        attributes: {
          shims: [
            shim({ id: "review" }),
            shim({ id: "qa" }),
            shim({ id: "main-qa" }),
            shim({ id: "implicit-criteria" }),
            shim({ id: "finding-ledger" }),
            shim({ id: "refinement-annotation" }),
            shim({ id: "transition-note" }),
          ],
        },
      }),
      node({
        id: "tactic-bootstrap-operation",
        kind: "tactic",
        attributes: { shims: [shim({ id: "bootstrap-carrier" })] },
      }),
      node({ id: "strategy-untouched", kind: "strategy" }),
    ];
    expect(liveShimCount(nodes)).toBe(8);
  });

  it("counts a live (liquidated_by: null) shim toward the total", () => {
    const nodes = [
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: null })] },
      }),
    ];
    expect(liveShimCount(nodes)).toBe(1);
  });
});

describe("deriveShimFrontier", () => {
  it("liquidated_by: null is live, not overdue — and still counts toward the live total", () => {
    const nodes = [
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: null })] },
      }),
    ];
    expect(deriveShimFrontier(nodes, [])).toEqual([]);
    expect(liveShimCount(nodes)).toBe(1);
  });

  it("reports nothing overdue when no check runs are supplied", () => {
    const nodes = [
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: "validate-graph" })] },
      }),
    ];
    expect(deriveShimFrontier(nodes, [])).toEqual([]);
  });

  it("is not overdue when the bound check is gating but FAILING", () => {
    const nodes = [
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: "validate-graph" })] },
      }),
    ];
    const checkRuns = [
      run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "gating", result: { ok: false } }),
    ];
    expect(deriveShimFrontier(nodes, checkRuns)).toEqual([]);
  });

  it("is not overdue when the bound check is passing but only OBSERVE tier", () => {
    const nodes = [
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: "validate-graph" })] },
      }),
    ];
    const checkRuns = [
      run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "observe", result: { ok: true } }),
    ];
    expect(deriveShimFrontier(nodes, checkRuns)).toEqual([]);
  });

  it("reports overdue when liquidated_by resolves to a GATING and PASSING check", () => {
    const nodes = [
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: {
          shims: [
            shim({
              id: "x",
              target: "hand-written transition notes",
              liquidation: "validate-graph ratchets to gating",
              liquidated_by: "validate-graph",
            }),
          ],
        },
      }),
    ];
    const checkRuns = [
      run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "gating", result: { ok: true } }),
    ];
    const entries = deriveShimFrontier(nodes, checkRuns);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "overdue-shim",
      id: "overdue-shim:strategy-a:x",
      subject: "strategy-a",
      // `liquidated_by` named the CHECK "validate-graph"; the entry's
      // `criterion` field carries that check's own criterion binding, never
      // the check id — a check id there would render as `[criterion
      // validate-graph]` and name something that is not a criterion.
      criterion: "fn-graph-validate",
      authority: "ratified",
    });
    expect(entries[0].detail).toContain("hand-written transition notes");
    expect(entries[0].detail).toContain("validate-graph ratchets to gating");
  });

  it("reports overdue when liquidated_by resolves to a SATISFIED criterion (bound checks all ok, any tier)", () => {
    const nodes = [
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: "fn-graph-validate" })] },
      }),
    ];
    const checkRuns = [
      run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "observe", result: { ok: true } }),
    ];
    const entries = deriveShimFrontier(nodes, checkRuns);
    expect(entries).toHaveLength(1);
    expect(entries[0].criterion).toBe("fn-graph-validate");
    // Satisfaction here rests on an observe-tier pass, not a ratified/gating
    // check, so authority is genuinely unknown to this module and stays null
    // rather than guessed.
    expect(entries[0].authority).toBeNull();
  });

  it("is not overdue when only SOME of the bound checks for a criterion pass", () => {
    const nodes = [
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: "fn-graph-validate" })] },
      }),
    ];
    const checkRuns = [
      run({ id: "validate-graph", criterion: "fn-graph-validate", result: { ok: true } }),
      run({ id: "validate-graph-2", criterion: "fn-graph-validate", result: { ok: false } }),
    ];
    expect(deriveShimFrontier(nodes, checkRuns)).toEqual([]);
  });

  it("is deterministic under a node permutation and sorts by node id then shim id", () => {
    const checkRuns = [
      run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "gating", result: { ok: true } }),
    ];
    const a = node({
      id: "strategy-a",
      kind: "strategy",
      attributes: { shims: [shim({ id: "x", liquidated_by: "validate-graph" })] },
    });
    const b = node({
      id: "strategy-b",
      kind: "strategy",
      attributes: { shims: [shim({ id: "y", liquidated_by: "validate-graph" })] },
    });
    const forward = deriveShimFrontier([a, b], checkRuns);
    const reversed = deriveShimFrontier([b, a], checkRuns);
    expect(forward).toEqual(reversed);
    expect(forward.map((e) => e.id)).toEqual(["overdue-shim:strategy-a:x", "overdue-shim:strategy-b:y"]);
  });
});

describe("governs", () => {
  it("reads incumbent-governed when no check run exists for the surface", () => {
    expect(governs("validate-graph", [])).toBe("incumbent-governed");
  });

  it("reads incumbent-governed when the check run exists but is only observe tier", () => {
    const checkRuns = [run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "observe" })];
    expect(governs("validate-graph", checkRuns)).toBe("incumbent-governed");
  });

  it("reads target-governed once the check has ratcheted to gating", () => {
    const checkRuns = [run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "gating" })];
    expect(governs("validate-graph", checkRuns)).toBe("target-governed");
  });
});

describe("rule 28 (part four): validateGraph agrees with validateShim on shim shape", () => {
  const STATUS_VOCABULARY = { raw: "Not yet started.", codified: "Complete." };
  const closedGraph = (): IntentionNode[] => [
    node({ id: "kind-kind", kind: "kind", attributes: { status_vocabulary: STATUS_VOCABULARY } }),
    node({
      id: "kind-virtue",
      kind: "kind",
      attributes: { goal_layer: true, status_vocabulary: STATUS_VOCABULARY },
    }),
    node({
      id: "kind-strategy",
      kind: "kind",
      attributes: { goal_layer: true, status_vocabulary: STATUS_VOCABULARY },
    }),
    node({
      id: "kind-tactic",
      kind: "kind",
      attributes: { goal_layer: true, status_vocabulary: STATUS_VOCABULARY },
    }),
    node({ id: "virtue-root", kind: "virtue" }),
  ];

  it("passes validateGraph on a well-formed attributes.shims list", () => {
    const nodes = [
      ...closedGraph(),
      node({
        id: "strategy-a",
        kind: "strategy",
        serves: ["virtue-root"],
        attributes: { shims: [shim({ id: "x" })] },
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("fails validateGraph on the same malformed shims list validateShim rejects", () => {
    const nodes = [
      ...closedGraph(),
      node({
        id: "strategy-a",
        kind: "strategy",
        serves: ["virtue-root"],
        attributes: { shims: [{ id: "x", smuggled: true }] },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/is not a shim field/);
  });

  it("fails validateGraph on a duplicate shim id, same as validateShimList", () => {
    const nodes = [
      ...closedGraph(),
      node({
        id: "strategy-a",
        kind: "strategy",
        serves: ["virtue-root"],
        attributes: { shims: [shim({ id: "x" }), shim({ id: "x" })] },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/shim ids are unique/);
  });
});

describe("exported constants", () => {
  it("SHIM_KEYS and SHIMS_KEY are stable", () => {
    expect(SHIM_KEYS).toEqual(["id", "target", "liquidation", "liquidated_by", "declared"]);
    expect(SHIMS_KEY).toBe("shims");
  });
});
