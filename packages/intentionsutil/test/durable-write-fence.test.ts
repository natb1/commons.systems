import { describe, expect, it } from "vitest";
import {
  DURABLE_LAYER_KINDS,
  isDurableLayerKind,
  isDurableWriteRefused,
  refusedDurableFields,
  STATE_FIELDS,
  type IntentionNode,
} from "../src/schema.js";
import {
  changedFields,
  fenceVerdict,
  refusalMessage,
} from "../scripts/check-durable-write-fence.js";

/** A full-node JSON document in the shape `dump-node.ts` writes. */
function doc(partial: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "strategy-example",
    kind: "strategy",
    statement: "Some durable doctrine.",
    owner: "human",
    status: "codified",
    parent: null,
    serves: [],
    recovers: [],
    rationale: "Because the author said so.",
    reading: null,
    clarifications: [],
    tooling_goals: [],
    success_signal: null,
    attention: null,
    phase: null,
    execution: null,
    validates: [],
    blocked_by: [],
    office_hours: { reason: "conflict", since: "2026-08-29", recommendation: null, session_type: "other" },
    pace_exempt: false,
    rounds: null,
    attributes: {},
    ...partial,
  };
}

describe("STATE_FIELDS", () => {
  it("is exactly the router- and sensor-owned set", () => {
    expect([...STATE_FIELDS]).toEqual([
      "phase",
      "execution",
      "office_hours",
      "reading",
      "attention",
      "rounds",
      "status",
      "blocked_by",
    ]);
  });

  it("names only real IntentionNode fields", () => {
    // The compile-time `keyof IntentionNode` typing is the real guard; this
    // asserts the runtime values too, since a stale member would look like a
    // permission that never applies.
    const nodeKeys: (keyof IntentionNode)[] = [
      "id",
      "kind",
      "statement",
      "owner",
      "status",
      "parent",
      "serves",
      "recovers",
      "rationale",
      "reading",
      "clarifications",
      "tooling_goals",
      "success_signal",
      "attention",
      "phase",
      "execution",
      "validates",
      "blocked_by",
      "office_hours",
      "pace_exempt",
      "rounds",
      "attributes",
    ];
    for (const field of STATE_FIELDS) {
      expect(nodeKeys).toContain(field);
    }
  });

  it("carries no durable-layer substance field", () => {
    for (const substance of ["statement", "rationale", "clarifications", "success_signal"]) {
      expect(STATE_FIELDS).not.toContain(substance);
    }
  });
});

describe("DURABLE_LAYER_KINDS", () => {
  it("is the five human-owned kinds", () => {
    expect([...DURABLE_LAYER_KINDS].sort()).toEqual([
      "delegation",
      "kind",
      "strategy",
      "tradition",
      "virtue",
    ]);
  });

  it("includes tradition, which grounding.ts's DURABLE_KINDS deliberately omits", () => {
    // grounding.ts answers a different question (which nodes need a grounding
    // mark) and exempts tradition because tradition records ARE the grounding.
    // Reusing that set here would put every tradition-* node on the permitted
    // side of the write fence.
    expect(isDurableLayerKind("tradition")).toBe(true);
  });

  it("excludes tactic — ai-owned work the lane may fully reconcile", () => {
    expect(isDurableLayerKind("tactic")).toBe(false);
  });
});

describe("isDurableWriteRefused", () => {
  it("refuses rationale on a strategy", () => {
    // THE case the 2026-08-15 correction was made for. `rationale` is the field
    // named first in the doctrine this fence protects, and it is not a
    // strategyFingerprint field — so the positive-allowlist form ruled on
    // 2026-08-14 permitted it. A test using a strategyFingerprint field would
    // pass under that broken design and prove nothing.
    expect(isDurableWriteRefused("strategy", "rationale")).toBe(true);
  });

  it("refuses statement and clarifications on every durable-layer kind", () => {
    for (const kind of DURABLE_LAYER_KINDS) {
      expect(isDurableWriteRefused(kind, "statement")).toBe(true);
      expect(isDurableWriteRefused(kind, "clarifications")).toBe(true);
      expect(isDurableWriteRefused(kind, "rationale")).toBe(true);
    }
  });

  it("refuses a field name nobody anticipated — the negative check's whole point", () => {
    // A positive allowlist falls through on anything it has not heard of. This
    // asserts the opposite default: unknown means refuse.
    for (const novel of ["doctrine", "attributes.tier", "some_field_added_next_year", ""]) {
      expect(isDurableWriteRefused("strategy", novel)).toBe(true);
    }
  });

  it("refuses a kind change on a durable node", () => {
    expect(isDurableWriteRefused("strategy", "kind")).toBe(true);
  });

  it("permits every STATE_FIELDS member on a durable-layer kind", () => {
    for (const kind of DURABLE_LAYER_KINDS) {
      for (const field of STATE_FIELDS) {
        expect(isDurableWriteRefused(kind, field)).toBe(false);
      }
    }
  });

  it("permits anything on a non-durable kind", () => {
    for (const field of ["statement", "rationale", "clarifications", "whatever"]) {
      expect(isDurableWriteRefused("tactic", field)).toBe(false);
    }
  });
});

describe("refusedDurableFields", () => {
  it("returns only the refused subset, in the order given", () => {
    expect(
      refusedDurableFields("strategy", ["office_hours", "rationale", "phase", "statement"]),
    ).toEqual(["rationale", "statement"]);
  });

  it("is empty when a durable write touches state fields only", () => {
    expect(refusedDurableFields("virtue", ["office_hours", "reading"])).toEqual([]);
  });

  it("is empty on a tactic whatever the fields", () => {
    expect(refusedDurableFields("tactic", ["statement", "rationale"])).toEqual([]);
  });
});

describe("changedFields", () => {
  it("reports a rewritten value", () => {
    expect(changedFields(doc(), doc({ rationale: "Rewritten." }))).toEqual(["rationale"]);
  });

  it("reports a deleted key as changed", () => {
    const candidate = doc();
    delete candidate.rationale;
    expect(changedFields(doc(), candidate)).toEqual(["rationale"]);
  });

  it("reports an added key as changed", () => {
    expect(changedFields(doc(), doc({ doctrine: "new" }))).toEqual(["doctrine"]);
  });

  it("reports nothing for an identical pair", () => {
    expect(changedFields(doc(), doc())).toEqual([]);
  });
});

describe("fenceVerdict", () => {
  it("REFUSES a rationale rewrite on a strategy-* node", () => {
    // The manual claim from the plan, exercised mechanically: a `rationale`
    // write to a strategy-* id must refuse.
    const verdict = fenceVerdict(doc(), doc({ rationale: "Synthesized substance." }));
    expect(verdict.kind).toBe("strategy");
    expect(verdict.refused).toEqual(["rationale"]);
  });

  it("REFUSES a statement rewrite bundled with a legitimate park clear", () => {
    const verdict = fenceVerdict(
      doc(),
      doc({ statement: "Reworded doctrine.", office_hours: null }),
    );
    expect(verdict.changed).toEqual(["office_hours", "statement"]);
    expect(verdict.refused).toEqual(["statement"]);
  });

  it("REFUSES a deleted rationale", () => {
    const candidate = doc({ office_hours: null });
    delete candidate.rationale;
    expect(fenceVerdict(doc(), candidate).refused).toEqual(["rationale"]);
  });

  it("REFUSES a kind change, reading the layer from the base document", () => {
    const verdict = fenceVerdict(doc(), doc({ kind: "tactic" }));
    expect(verdict.kind).toBe("strategy");
    expect(verdict.refused).toEqual(["kind"]);
  });

  it("REFUSES a PROMOTION of a tactic into a durable kind, judging the candidate's layer too", () => {
    // The reverse direction of the case above, and the one a base-only read
    // misses entirely: the base is a `tactic`, which is not durable, so a fence
    // that only ever asks about `base.kind` returns "permitted" for a candidate
    // that rewrites `kind` to `strategy` alongside a model-authored `statement`
    // and `rationale`. validateNode gates no kind-specific fields and
    // graph-commit runs no graph validation, so that write would land brand-new
    // durable-layer doctrine on main. The refusal is the UNION over both kinds.
    const base = doc({ id: "tactic-example", kind: "tactic" });
    const candidate = doc({
      id: "tactic-example",
      kind: "strategy",
      statement: "Smuggled doctrine.",
      rationale: "Smuggled rationale.",
      office_hours: null,
    });
    const verdict = fenceVerdict(base, candidate);
    expect(verdict.kind).toBe("tactic");
    expect(verdict.candidateKind).toBe("strategy");
    expect(verdict.refused).toEqual(["kind", "rationale", "statement"]);
  });

  it("names both layers in the refusal text when the write rewrites kind", () => {
    const base = doc({ id: "tactic-example", kind: "tactic" });
    const message = refusalMessage(
      "tactic-example",
      fenceVerdict(base, doc({ id: "tactic-example", kind: "strategy" })),
    );
    expect(message).toContain('"tactic" node this write would rewrite as a "strategy"');
  });

  it("REFUSES a novel field the schema will drop anyway", () => {
    // write-node.ts's validateNode drops unknown keys, so this particular write
    // would be harmless — but the fence must not depend on that. It refuses on
    // the name it does not recognize.
    expect(fenceVerdict(doc(), doc({ doctrine: "smuggled" })).refused).toEqual(["doctrine"]);
  });

  it("PERMITS clearing the park on a strategy", () => {
    const verdict = fenceVerdict(doc(), doc({ office_hours: null }));
    expect(verdict.changed).toEqual(["office_hours"]);
    expect(verdict.refused).toEqual([]);
  });

  it("PERMITS appending to office_hours.recommendation on a strategy", () => {
    const candidate = doc({
      office_hours: {
        reason: "conflict",
        since: "2026-08-29",
        recommendation: "Next step: ask the author.",
        session_type: "other",
      },
    });
    expect(fenceVerdict(doc(), candidate).refused).toEqual([]);
  });

  it("PERMITS a full reconciliation on a tactic", () => {
    const base = doc({ id: "tactic-example", kind: "tactic" });
    const candidate = doc({
      id: "tactic-example",
      kind: "tactic",
      statement: "Rewritten tactic statement.",
      rationale: "Rewritten tactic rationale.",
      office_hours: null,
    });
    const verdict = fenceVerdict(base, candidate);
    expect(verdict.changed).toEqual(["office_hours", "rationale", "statement"]);
    expect(verdict.refused).toEqual([]);
  });

  it("throws on an id mismatch rather than fencing the wrong pair", () => {
    expect(() => fenceVerdict(doc(), doc({ id: "strategy-other" }))).toThrow(/id mismatch/);
  });

  it("throws when the base carries no kind", () => {
    const base = doc();
    delete base.kind;
    expect(() => fenceVerdict(base, doc())).toThrow(/no string `kind`/);
  });

  it("throws when either document is not an object", () => {
    expect(() => fenceVerdict(null, doc())).toThrow(/base is not a JSON object/);
    expect(() => fenceVerdict(doc(), "nope")).toThrow(/candidate is not a JSON object/);
  });
});

describe("refusalMessage", () => {
  it("names the node, the refused fields, and what the caller must do", () => {
    const verdict = fenceVerdict(doc(), doc({ rationale: "Synthesized." }));
    const message = refusalMessage("strategy-example", verdict);
    expect(message).toContain("REFUSED");
    expect(message).toContain("strategy-example");
    expect(message).toContain("rationale");
    expect(message).toContain("Do not land this write");
    expect(message).toContain("parked");
  });
});
