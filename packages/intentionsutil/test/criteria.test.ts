import { describe, expect, it } from "vitest";
import {
  criteriaFingerprint,
  effectiveCriteria,
  parseCriteria,
  standingCriteria,
  validateCriteriaList,
  validateCriterion,
  validateStandingCriteriaList,
} from "../src/criteria.js";
import type { Criterion } from "../src/criteria.js";
import { IntentionSchemaError } from "../src/errors.js";
import type { IntentionNode } from "../src/schema.js";
import { validateGraph } from "../src/schema.js";

/** A full node fixture; `attributes` is what every test here actually varies. */
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

/**
 * Fixtures are plain objects, not typed `Criterion`s: the validators take
 * `unknown` by contract, and the negative cases feed them shapes the type
 * forbids. Typing the fixtures would force a cast at every such call site
 * (same reasoning as `operational-records.test.ts`).
 */
function criterion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "nf-test-integrity",
    statement: "A failing test is fixed in the code or escalated.",
    class: "non-functional",
    authority: "deferred",
    recorded: "2026-09-01",
    ...overrides,
  };
}

/** The `kind-strategy` node, carrying `standing` as its standing set. */
function standingHome(standing: unknown): IntentionNode {
  return node({
    id: "kind-strategy",
    kind: "kind",
    status: "codified",
    attributes: {
      status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
      ...(standing === undefined ? {} : { standing_criteria: standing }),
    },
  });
}

describe("validateCriterion", () => {
  it("accepts a well-formed criterion and normalizes field order", () => {
    const parsed = validateCriterion(
      // Keys deliberately out of canonical order.
      { recorded: "2026-09-01", class: "functional", id: "c1", authority: "ratified", statement: "s" },
    );
    expect(parsed).toEqual({
      id: "c1",
      statement: "s",
      class: "functional",
      authority: "ratified",
      recorded: "2026-09-01",
    });
    expect(Object.keys(parsed)).toEqual(["id", "statement", "class", "authority", "recorded"]);
  });

  it("REJECTS an unknown key rather than ignoring it, naming the offender", () => {
    expect(() => validateCriterion(criterion({ tier: "gating" }), "c")).toThrow(
      /Unknown key c\.tier/,
    );
    expect(() => validateCriterion(criterion({ tier: "gating" }), "c")).toThrow(
      IntentionSchemaError,
    );
  });

  it("throws on a missing or empty statement", () => {
    expect(() => validateCriterion(criterion({ statement: "  " }), "c")).toThrow(
      /non-empty string for c\.statement/,
    );
    expect(() => validateCriterion(criterion({ statement: undefined }), "c")).toThrow(
      /Expected string for c\.statement/,
    );
  });

  it("accepts an assumption-class criterion — a world-premise, assessed and never bitten", () => {
    const parsed = validateCriterion(
      criterion({ id: "a-open-weights", class: "assumption", statement: "Open weights stay viable." }),
      "c",
    );
    expect(parsed.class).toBe("assumption");
  });

  it("throws on an unknown class or authority", () => {
    expect(() => validateCriterion(criterion({ class: "nonfunctional" }), "c")).toThrow(
      /Invalid c\.class: "nonfunctional" \(expected one of functional, non-functional, assumption\)/,
    );
    expect(() => validateCriterion(criterion({ authority: "approved" }), "c")).toThrow(
      /Invalid c\.authority: "approved" \(expected one of ratified, delegated, deferred\)/,
    );
  });

  it("throws on a recorded date that is not YYYY-MM-DD", () => {
    expect(() => validateCriterion(criterion({ recorded: "Sept 1 2026" }), "c")).toThrow(
      /YYYY-MM-DD date string for c\.recorded/,
    );
  });

  it("throws on a non-object entry", () => {
    expect(() => validateCriterion(["id"], "c")).toThrow(/for c, got an array/);
    expect(() => validateCriterion(null, "c")).toThrow(/for c, got null/);
  });
});

describe("validateCriteriaList", () => {
  it("throws on a duplicate id within one list", () => {
    expect(() =>
      validateCriteriaList([criterion(), criterion({ statement: "another" })], "list"),
    ).toThrow(/Duplicate criterion id "nf-test-integrity" in list/);
  });

  it("throws when the value is not an array", () => {
    expect(() => validateCriteriaList({ "0": criterion() }, "list")).toThrow(
      /Expected an array of criteria for list, got object/,
    );
  });
});

describe("parseCriteria", () => {
  it("reads attributes.criteria in authored order", () => {
    const strategy = node({
      id: "strategy-x",
      kind: "strategy",
      attributes: {
        criteria: [
          criterion({ id: "f-b", class: "functional" }),
          criterion({ id: "f-a", class: "functional" }),
        ],
      },
    });
    expect(parseCriteria(strategy).map((c) => c.id)).toEqual(["f-b", "f-a"]);
  });

  it("yields [] when the key is absent — a node predating the migration is not a defect", () => {
    expect(parseCriteria(node({ id: "strategy-x", kind: "strategy" }))).toEqual([]);
  });

  it("THROWS on a malformed value rather than degrading to []", () => {
    // A silent [] would disarm every check bound to the list.
    const strategy = node({
      id: "strategy-x",
      kind: "strategy",
      attributes: { criteria: "nf-security" },
    });
    expect(() => parseCriteria(strategy)).toThrow(
      /strategy-x: attributes\.criteria, got string/,
    );
  });
});

describe("standingCriteria", () => {
  it("reads the standing set off kind-strategy", () => {
    const nodes = [standingHome([criterion()]), node({ id: "strategy-x", kind: "strategy" })];
    expect(standingCriteria(nodes).map((c) => c.id)).toEqual(["nf-test-integrity"]);
  });

  it("THROWS when kind-strategy is absent from the passed list", () => {
    // The whole point: an empty standing set read from a truncated list would
    // silently disarm every non-functional check.
    expect(() => standingCriteria([node({ id: "strategy-x", kind: "strategy" })])).toThrow(
      /kind-strategy is not in the passed node list \(1 node\(s\)\)/,
    );
    expect(() => standingCriteria([])).toThrow(IntentionSchemaError);
  });

  it("yields [] when kind-strategy is present but carries no standing set", () => {
    expect(standingCriteria([standingHome(undefined)])).toEqual([]);
  });

  it("THROWS on a functional entry in the standing home", () => {
    const nodes = [standingHome([criterion({ id: "f-1", class: "functional" })])];
    expect(() => standingCriteria(nodes)).toThrow(
      /\("f-1"\) is class "functional", but the standing set is NON-FUNCTIONAL ONLY/,
    );
  });

  it("THROWS on an assumption entry in the standing home, exactly like a functional one", () => {
    // An assumption is one strategy's world-premise; standing here would bind
    // every strategy to a claim made about one.
    const nodes = [standingHome([criterion({ id: "a-1", class: "assumption" })])];
    expect(() => standingCriteria(nodes)).toThrow(
      /\("a-1"\) is class "assumption", but the standing set is NON-FUNCTIONAL ONLY/,
    );
  });

  it("validateStandingCriteriaList accepts an all-non-functional list", () => {
    expect(validateStandingCriteriaList([criterion()], "s").map((c) => c.class)).toEqual([
      "non-functional",
    ]);
  });
});

describe("effectiveCriteria", () => {
  it("unions the strategy's own criteria with the standing set, id-sorted", () => {
    const strategy = node({
      id: "strategy-x",
      kind: "strategy",
      attributes: {
        criteria: [
          criterion({ id: "f-zebra", class: "functional" }),
          criterion({ id: "f-alpha", class: "functional" }),
        ],
      },
    });
    const home = standingHome([
      criterion({ id: "nf-security" }),
      criterion({ id: "nf-style" }),
    ]);
    expect(effectiveCriteria(strategy, [home, strategy]).map((c) => c.id)).toEqual([
      "f-alpha",
      "f-zebra",
      "nf-security",
      "nf-style",
    ]);
  });

  it("is the projection, not a copy: the standing set reaches a strategy carrying no criteria", () => {
    const strategy = node({ id: "strategy-x", kind: "strategy" });
    const home = standingHome([criterion({ id: "nf-security" })]);
    expect(effectiveCriteria(strategy, [home, strategy]).map((c) => c.id)).toEqual(["nf-security"]);
  });

  it("THROWS on a duplicate id across the two sources rather than shadowing", () => {
    const strategy = node({
      id: "strategy-x",
      kind: "strategy",
      attributes: { criteria: [criterion({ id: "nf-security", statement: "a weaker rule" })] },
    });
    const home = standingHome([criterion({ id: "nf-security" })]);
    expect(() => effectiveCriteria(strategy, [home, strategy])).toThrow(
      /strategy-x: attributes\.criteria redefines criterion id "nf-security"/,
    );
  });

  it("propagates the missing-kind-strategy throw", () => {
    const strategy = node({ id: "strategy-x", kind: "strategy" });
    expect(() => effectiveCriteria(strategy, [strategy])).toThrow(/kind-strategy is not in/);
  });
});

describe("criteriaFingerprint", () => {
  const a: Criterion = {
    id: "nf-security",
    statement: "No change introduces a security defect.",
    class: "non-functional",
    authority: "deferred",
    recorded: "2026-09-01",
  };
  const b: Criterion = {
    id: "nf-style",
    statement: "Clear errors over defensive fallbacks.",
    class: "non-functional",
    authority: "deferred",
    recorded: "2026-09-01",
  };

  it("is a 64-char lowercase hex sha256, like strategyFingerprint", () => {
    expect(criteriaFingerprint([a, b])).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable under input ORDER — the set is id-sorted first", () => {
    expect(criteriaFingerprint([b, a])).toBe(criteriaFingerprint([a, b]));
  });

  it("is stable under KEY reordering within a criterion", () => {
    const reordered = {
      recorded: a.recorded,
      authority: a.authority,
      class: a.class,
      statement: a.statement,
      id: a.id,
    } as Criterion; // type-safety-ok: the point of the test is a DIFFERENT key order, which the structural type erases
    expect(criteriaFingerprint([reordered])).toBe(criteriaFingerprint([a]));
  });

  it("changes when any substance field changes", () => {
    expect(criteriaFingerprint([{ ...a, authority: "ratified" }])).not.toBe(
      criteriaFingerprint([a]),
    );
    expect(criteriaFingerprint([{ ...a, statement: `${a.statement} ` }])).not.toBe(
      criteriaFingerprint([a]),
    );
    expect(criteriaFingerprint([a])).not.toBe(criteriaFingerprint([a, b]));
  });

  it("is empty-set stable", () => {
    expect(criteriaFingerprint([])).toBe(criteriaFingerprint([]));
    expect(criteriaFingerprint([])).not.toBe(criteriaFingerprint([a]));
  });
});

/**
 * `schema.ts`'s rule 28 restates this module's shape check, because `schema.ts`
 * is reachable from the browser-safe `graph.ts` barrel and this module imports
 * `node:crypto` (see `checkCriteriaShape`'s comment and `graph.test.ts`'s
 * no-`node:` guard). This block is what keeps the two from drifting: every case
 * below must be judged the same way by both.
 */
describe("rule 28 agrees with the criteria.ts validators", () => {
  const cases: { name: string; value: unknown; valid: boolean }[] = [
    { name: "a well-formed list", value: [criterion()], valid: true },
    { name: "an assumption-class entry", value: [criterion({ class: "assumption" })], valid: true },
    { name: "an empty list", value: [], valid: true },
    { name: "a non-array", value: "nf-security", valid: false },
    { name: "a non-object entry", value: ["nf-security"], valid: false },
    { name: "an unknown key", value: [criterion({ tier: "gating" })], valid: false },
    { name: "an empty statement", value: [criterion({ statement: " " })], valid: false },
    { name: "a missing id", value: [criterion({ id: undefined })], valid: false },
    { name: "an unknown class", value: [criterion({ class: "perf" })], valid: false },
    { name: "an unknown authority", value: [criterion({ authority: "ok" })], valid: false },
    { name: "a malformed date", value: [criterion({ recorded: "2026-9-1" })], valid: false },
    {
      name: "a duplicate id",
      value: [criterion(), criterion({ statement: "other" })],
      valid: false,
    },
  ];

  for (const { name, value, valid } of cases) {
    it(`${valid ? "accepts" : "rejects"} ${name} on both paths`, () => {
      const viaCriteria = () => validateCriteriaList(value, "attributes.criteria");
      const strategy = node({
        id: "strategy-x",
        kind: "strategy",
        attributes: { criteria: value },
      });
      const viaGraph = () =>
        validateGraph([
          node({ id: "kind-strategy", kind: "kind", status: "codified" }),
          node({ id: "kind-kind", kind: "kind", status: "codified" }),
          strategy,
        ]);
      if (valid) {
        expect(viaCriteria).not.toThrow();
        expect(viaGraph).not.toThrow();
      } else {
        expect(viaCriteria).toThrow(IntentionSchemaError);
        expect(viaGraph).toThrow(IntentionSchemaError);
      }
    });
  }
});
