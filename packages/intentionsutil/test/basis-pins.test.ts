import { describe, expect, it } from "vitest";
import {
  BASIS_PINS_KEY,
  DISPOSITION_SELECTORS,
  deriveStaleIntent,
  dispositionHash,
  formatDispositionRef,
  parseBasisPins,
  parseDispositionRef,
  validateBasisPin,
  validateBasisPinList,
} from "../src/basis-pins.js";
import { IntentionSchemaError } from "../src/errors.js";
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
    attributes: partial.attributes ?? {},
  };
}

const QUESTION = "What is the intent-layer reconciliation criterion?";
const ANSWER = "An amendment to ratified content derives a stale-intent frontier. Ruled 2026-09-01.";

/** The cited node: a strategy carrying one clarification, a rationale and one criterion. */
function citedStrategy(overrides: Partial<IntentionNode> = {}): IntentionNode {
  return node({
    id: "strategy-graph-integrity",
    kind: "strategy",
    statement: "Keep the intention graph internally consistent",
    rationale: "A stale graph is worse than none.",
    clarifications: [{ question: QUESTION, answer: ANSWER }],
    attributes: {
      conditions: ["the graph is actually read by the delegatee's harness"],
      criteria: [
        {
          id: "fn-citation-integrity",
          statement: "Every intra-graph citation names a live disposition.",
          class: "functional",
          authority: "ratified",
          recorded: DATE,
        },
      ],
    },
    ...overrides,
  });
}

/** A pin object as it rides in `attributes` — a plain record, like the store hands it over. */
function pin(cites: string, hash: string, overrides: Record<string, unknown> = {}) {
  return { cites, hash, pinned_at: DATE, ...overrides };
}

/** A kind node declaring the status vocabulary rule 16 needs; used by the parity block. */
function kindNode(id: string): IntentionNode {
  return node({
    id,
    kind: "kind",
    status: "codified",
    attributes: { status_vocabulary: { raw: "Not yet started.", codified: "Complete." } },
  });
}

/** The citing node, carrying `pins` under `attributes.basis_pins`. */
function citingNode(pins: unknown[]): IntentionNode {
  return node({
    id: "strategy-explicit-intent",
    kind: "strategy",
    attributes: { [BASIS_PINS_KEY]: pins },
  });
}

/** A syntactically valid sha256 digest that is not the hash of anything here. */
const A_HASH = "a1b2c3d4".repeat(8);

// --- The reference grammar --------------------------------------------------

describe("parseDispositionRef", () => {
  it("parses every bare selector", () => {
    for (const selector of ["statement", "rationale", "conditions", "node"]) {
      expect(parseDispositionRef(`strategy-a#${selector}`)).toEqual({
        node: "strategy-a",
        selector,
        key: null,
      });
    }
  });

  it("parses the two keyed selectors, keeping the key verbatim", () => {
    expect(parseDispositionRef(`strategy-a#clarification:${QUESTION}`)).toEqual({
      node: "strategy-a",
      selector: "clarification",
      key: QUESTION,
    });
    expect(parseDispositionRef("strategy-a#criterion:fn-1")).toEqual({
      node: "strategy-a",
      selector: "criterion",
      key: "fn-1",
    });
  });

  it("splits at the FIRST # and the FIRST :, so a question may contain both", () => {
    const question = "Is #tagged prose a disposition: yes or no?";
    const ref = parseDispositionRef(`strategy-a#clarification:${question}`);
    expect(ref.node).toBe("strategy-a");
    expect(ref.key).toBe(question);
    // And the spelling round-trips exactly, which is what makes the reference
    // usable as a stable entry id.
    expect(formatDispositionRef(ref)).toBe(`strategy-a#clarification:${question}`);
  });

  it("declares exactly six selectors", () => {
    expect([...DISPOSITION_SELECTORS]).toEqual([
      "clarification",
      "criterion",
      "statement",
      "rationale",
      "conditions",
      "node",
    ]);
  });

  it("rejects a malformed reference rather than treating it as dangling", () => {
    // A reference that does not PARSE is a misconfigured pin — nothing could
    // ever satisfy it — and must stay distinguishable from one that parses but
    // does not resolve, which is a real frontier item.
    expect(() => parseDispositionRef("strategy-a")).toThrow(/expected <node-id>#<selector>/);
    expect(() => parseDispositionRef("#statement")).toThrow(/expected <node-id>#<selector>/);
    expect(() => parseDispositionRef("strategy-a#")).toThrow(/expected <node-id>#<selector>/);
    expect(() => parseDispositionRef("strategy-a#body")).toThrow(
      /Unknown disposition selector "body"/,
    );
    expect(() => parseDispositionRef("strategy-a#clarification:")).toThrow(/requires a key/);
    expect(() => parseDispositionRef("strategy-a#statement:x")).toThrow(/takes no key/);
  });
});

// --- Pin shape --------------------------------------------------------------

describe("validateBasisPin", () => {
  it("accepts a well-formed pin and normalizes its field order", () => {
    expect(validateBasisPin({ pinned_at: DATE, hash: A_HASH, cites: "strategy-a#statement" })).toEqual(
      { cites: "strategy-a#statement", hash: A_HASH, pinned_at: DATE },
    );
  });

  it("rejects an unknown key rather than ignoring it", () => {
    expect(() =>
      validateBasisPin({ ...pin("strategy-a#statement", A_HASH), waived: true }),
    ).toThrow(/Unknown key basis_pin.waived/);
  });

  it("rejects a hash that is not a lowercase sha256 hex digest", () => {
    expect(() => validateBasisPin(pin("strategy-a#statement", A_HASH.toUpperCase()))).toThrow(
      /lowercase sha256 hex digest/,
    );
    expect(() => validateBasisPin(pin("strategy-a#statement", "abc123"))).toThrow(
      /lowercase sha256 hex digest/,
    );
  });

  it("rejects a malformed date and a malformed reference", () => {
    expect(() =>
      validateBasisPin(pin("strategy-a#statement", A_HASH, { pinned_at: "2026-9-1" })),
    ).toThrow(/YYYY-MM-DD/);
    expect(() => validateBasisPin(pin("strategy-a", A_HASH))).toThrow(
      /Malformed disposition reference/,
    );
  });

  it("rejects two pins on the same citation", () => {
    expect(() =>
      validateBasisPinList(
        [pin("strategy-a#statement", A_HASH), pin("strategy-a#statement", "1".repeat(64))],
        "attributes.basis_pins",
      ),
    ).toThrow(/Duplicate basis pin for "strategy-a#statement"/);
  });

  it("reads an absent key as no pins, but refuses a malformed value", () => {
    expect(parseBasisPins(node({ id: "strategy-a", kind: "strategy" }))).toEqual([]);
    expect(parseBasisPins(citingNode([]))).toEqual([]);
    expect(() =>
      parseBasisPins(node({ id: "s", kind: "strategy", attributes: { basis_pins: "x" } })),
    ).toThrow(IntentionSchemaError);
  });
});

// --- The hash ---------------------------------------------------------------

describe("dispositionHash", () => {
  const cited = citedStrategy();

  it("is stable across calls and 64 hex characters wide", () => {
    const first = dispositionHash(cited, "strategy-graph-integrity#statement");
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(dispositionHash(cited, "strategy-graph-integrity#statement")).toBe(first);
  });

  it("resolves all six selectors on a real-shaped node", () => {
    for (const ref of [
      "strategy-graph-integrity#statement",
      "strategy-graph-integrity#rationale",
      "strategy-graph-integrity#conditions",
      "strategy-graph-integrity#node",
      `strategy-graph-integrity#clarification:${QUESTION}`,
      "strategy-graph-integrity#criterion:fn-citation-integrity",
    ]) {
      expect(dispositionHash(cited, ref)).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("gives each selector its own hash, so two identical texts never alias", () => {
    // `statement` and `rationale` set to the same text still hash differently:
    // the reference is hashed alongside the substance.
    const twin = citedStrategy({ statement: "same text", rationale: "same text" });
    expect(dispositionHash(twin, "strategy-graph-integrity#statement")).not.toBe(
      dispositionHash(twin, "strategy-graph-integrity#rationale"),
    );
  });

  it("does NOT move when only state fields are written — the allowlist property", () => {
    const before = dispositionHash(cited, "strategy-graph-integrity#node");
    const afterTransition = citedStrategy({
      phase: "implement",
      status: "codified",
      reading: "measured 2026-09-01: 3 items",
      pace_exempt: true,
      office_hours: {
        reason: "needs the author",
        since: DATE,
        recommendation: null,
        session_type: "other",
      },
      rounds: { count: 2, last_completed: DATE, last_aligned: DATE },
      execution: {
        branch: "tactic-x",
        pr: 1234,
        attempts: { implement: 2 },
        markers: ["dispatch:reviewed"],
        strategy_fingerprint: "deadbeef",
      },
    });
    expect(dispositionHash(afterTransition, "strategy-graph-integrity#node")).toBe(before);
    // Same for the per-disposition selectors.
    expect(dispositionHash(afterTransition, `strategy-graph-integrity#clarification:${QUESTION}`)).toBe(
      dispositionHash(cited, `strategy-graph-integrity#clarification:${QUESTION}`),
    );
  });

  it("DOES move when intent content is amended", () => {
    const amended = citedStrategy({
      clarifications: [{ question: QUESTION, answer: `${ANSWER} Amended 2026-09-02.` }],
    });
    expect(dispositionHash(amended, `strategy-graph-integrity#clarification:${QUESTION}`)).not.toBe(
      dispositionHash(cited, `strategy-graph-integrity#clarification:${QUESTION}`),
    );
    // And the whole-node selector sees the same amendment.
    expect(dispositionHash(amended, "strategy-graph-integrity#node")).not.toBe(
      dispositionHash(cited, "strategy-graph-integrity#node"),
    );
  });

  it("ignores key order in a criterion's source YAML", () => {
    const reordered = citedStrategy({
      attributes: {
        conditions: ["the graph is actually read by the delegatee's harness"],
        criteria: [
          {
            recorded: DATE,
            authority: "ratified",
            class: "functional",
            statement: "Every intra-graph citation names a live disposition.",
            id: "fn-citation-integrity",
          },
        ],
      },
    });
    expect(dispositionHash(reordered, "strategy-graph-integrity#criterion:fn-citation-integrity")).toBe(
      dispositionHash(cited, "strategy-graph-integrity#criterion:fn-citation-integrity"),
    );
  });

  it("hashes a criterion authored in the standing set on its home node", () => {
    const home = node({
      id: "kind-strategy",
      kind: "kind",
      attributes: {
        standing_criteria: [
          {
            id: "nf-test-integrity",
            statement: "A failing test is fixed in the code or escalated.",
            class: "non-functional",
            authority: "ratified",
            recorded: DATE,
          },
        ],
      },
    });
    expect(dispositionHash(home, "kind-strategy#criterion:nf-test-integrity")).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  it("refuses to hash against the wrong node, or a disposition that is not there", () => {
    expect(() => dispositionHash(cited, "strategy-other#statement")).toThrow(
      /names node "strategy-other", but it was passed node "strategy-graph-integrity"/,
    );
    expect(() => dispositionHash(cited, "strategy-graph-integrity#criterion:missing")).toThrow(
      /does not resolve/,
    );
    const noRationale = citedStrategy({ rationale: null });
    expect(() => dispositionHash(noRationale, "strategy-graph-integrity#rationale")).toThrow(
      /does not resolve/,
    );
  });
});

// --- The arm ----------------------------------------------------------------

describe("deriveStaleIntent", () => {
  const cited = citedStrategy();
  const CLARIFICATION_REF = `strategy-graph-integrity#clarification:${QUESTION}`;

  it("reports nothing when the recorded hash still matches", () => {
    const nodes = [cited, citingNode([pin(CLARIFICATION_REF, dispositionHash(cited, CLARIFICATION_REF))])];
    expect(deriveStaleIntent(nodes)).toEqual([]);
  });

  it("reports nothing on a graph with no pins at all — an empty corpus is an empty arm", () => {
    expect(deriveStaleIntent([cited, node({ id: "strategy-a", kind: "strategy" })])).toEqual([]);
  });

  it("reports an entry when the cited text is amended, naming both hashes", () => {
    const pinned = dispositionHash(cited, CLARIFICATION_REF);
    const amended = citedStrategy({
      clarifications: [{ question: QUESTION, answer: `${ANSWER} Amended 2026-09-02.` }],
    });
    const entries = deriveStaleIntent([amended, citingNode([pin(CLARIFICATION_REF, pinned)])]);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("stale-intent");
    expect(entries[0].id).toBe(`stale-intent:strategy-explicit-intent:${CLARIFICATION_REF}`);
    // The CITING node is the subject — it holds the disposition that may no
    // longer be supported, and it is what a reader has to act on.
    expect(entries[0].subject).toBe("strategy-explicit-intent");
    expect(entries[0].detail).toContain(`cites ${CLARIFICATION_REF}`);
    expect(entries[0].detail).toContain(`pinned ${pinned}`);
    expect(entries[0].detail).toContain(dispositionHash(amended, CLARIFICATION_REF));
    expect(entries[0].criterion).toBeNull();
    expect(entries[0].authority).toBeNull();
  });

  it("reports NOTHING when the cited node takes a state-only write — the allowlist property", () => {
    // This is the deciding property of the whole arm: a phase transition, a
    // park, a marker or a sensor reading must never invalidate an intent
    // citation. A hash that moved here would report the graph stale every tick.
    const pinned = dispositionHash(cited, CLARIFICATION_REF);
    const transitioned = citedStrategy({
      phase: "review",
      status: "codified",
      reading: "measured 2026-09-02",
      pace_exempt: true,
      office_hours: {
        reason: "parked mid-drain",
        since: DATE,
        recommendation: "ratify the criterion",
        session_type: "other",
      },
      execution: {
        branch: "tactic-y",
        pr: 42,
        attempts: { review: 1 },
        markers: ["dispatch:reviewed", "dispatch:qa-done"],
        strategy_fingerprint: { "strategy-a": { hash: "abc", sha: "deadbeef" } },
      },
    });
    expect(deriveStaleIntent([transitioned, citingNode([pin(CLARIFICATION_REF, pinned)])])).toEqual(
      [],
    );
  });

  it("reports a dangling citation whose node is not in the store", () => {
    const entries = deriveStaleIntent([citingNode([pin("strategy-deleted#statement", A_HASH)])]);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("stale-intent");
    expect(entries[0].detail).toContain('no node "strategy-deleted" is in the store');
  });

  it("reports a dangling citation whose disposition was folded, renamed or cleared", () => {
    const folded = citedStrategy({ clarifications: [] });
    const entries = deriveStaleIntent([folded, citingNode([pin(CLARIFICATION_REF, A_HASH)])]);
    expect(entries).toHaveLength(1);
    expect(entries[0].detail).toContain("carries no clarification");
    expect(entries[0].detail).toContain("folded, renamed or removed");

    const renamed = citedStrategy({
      attributes: {
        criteria: [
          {
            id: "fn-renamed",
            statement: "Every intra-graph citation names a live disposition.",
            class: "functional",
            authority: "ratified",
            recorded: DATE,
          },
        ],
      },
    });
    const criterionRef = "strategy-graph-integrity#criterion:fn-citation-integrity";
    const byCriterion = deriveStaleIntent([renamed, citingNode([pin(criterionRef, A_HASH)])]);
    expect(byCriterion).toHaveLength(1);
    expect(byCriterion[0].detail).toContain("carries no criterion");
  });

  it("reports an ambiguous clarification rather than guessing which entry was cited", () => {
    const ambiguous = citedStrategy({
      clarifications: [
        { question: QUESTION, answer: ANSWER },
        { question: QUESTION, answer: "A second answer under the same question." },
      ],
    });
    const entries = deriveStaleIntent([ambiguous, citingNode([pin(CLARIFICATION_REF, A_HASH)])]);
    expect(entries).toHaveLength(1);
    expect(entries[0].detail).toContain("carries no clarification");
  });

  it("joins a criterion citation to its criterion and authority when it still resolves", () => {
    const criterionRef = "strategy-graph-integrity#criterion:fn-citation-integrity";
    const amended = citedStrategy({
      attributes: {
        criteria: [
          {
            id: "fn-citation-integrity",
            statement: "Every intra-graph citation names a live, RATIFIED disposition.",
            class: "functional",
            authority: "ratified",
            recorded: DATE,
          },
        ],
      },
    });
    const entries = deriveStaleIntent([
      amended,
      citingNode([pin(criterionRef, dispositionHash(cited, criterionRef))]),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].criterion).toBe("fn-citation-integrity");
    expect(entries[0].authority).toBe("ratified");
  });

  it("is deterministic under a permutation of the node list", () => {
    const other = node({
      id: "strategy-a",
      kind: "strategy",
      attributes: { basis_pins: [pin("strategy-gone#statement", A_HASH)] },
    });
    const citing = citingNode([
      pin("strategy-also-gone#node", A_HASH),
      pin("strategy-graph-integrity#statement", A_HASH),
    ]);
    const forward = deriveStaleIntent([cited, other, citing]).map((e) => e.id);
    const reversed = deriveStaleIntent([citing, other, cited]).map((e) => e.id);
    expect(forward).toEqual(reversed);
    expect(forward).toHaveLength(3);
  });

  it("never writes a pin — the cited and citing nodes come back untouched", () => {
    // The read-only contract, mirroring `grounding.ts`'s "never WRITES marks".
    const pins = [pin(CLARIFICATION_REF, A_HASH)];
    const citing = citingNode(pins);
    const before = JSON.stringify([cited, citing]);
    deriveStaleIntent([cited, citing]);
    expect(JSON.stringify([cited, citing])).toBe(before);
    expect(pins[0].hash).toBe(A_HASH);
  });

  it("refuses a malformed pin list rather than dropping its citations", () => {
    expect(() =>
      deriveStaleIntent([node({ id: "s", kind: "strategy", attributes: { basis_pins: [{}] } })]),
    ).toThrow(IntentionSchemaError);
  });
});

// --- Rule 28 parity ---------------------------------------------------------

/**
 * `validateGraph`'s rule 28 restates this module's pin shape rather than
 * calling it, because `schema.ts` is reachable from the browser-safe `graph.ts`
 * barrel and this module imports `node:crypto` (see `checkBasisPinsShape`'s
 * comment and `graph.test.ts`'s no-`node:` guard). This block is what keeps the
 * two from drifting: every case below must be judged the same way by both.
 */
describe("rule 28 agrees with the basis-pins.ts validators", () => {
  const cases: { name: string; value: unknown; valid: boolean }[] = [
    { name: "a well-formed pin", value: [pin("strategy-a#statement", A_HASH)], valid: true },
    { name: "a keyed clarification reference", value: [pin(`strategy-a#clarification:${QUESTION}`, A_HASH)], valid: true },
    { name: "a keyed criterion reference", value: [pin("strategy-a#criterion:fn-1", A_HASH)], valid: true },
    { name: "an empty list", value: [], valid: true },
    { name: "a non-array", value: "strategy-a#statement", valid: false },
    { name: "a non-object entry", value: ["strategy-a#statement"], valid: false },
    { name: "an unknown key", value: [pin("strategy-a#statement", A_HASH, { waived: true })], valid: false },
    { name: "a missing cites", value: [{ hash: A_HASH, pinned_at: DATE }], valid: false },
    { name: "a reference with no #", value: [pin("strategy-a", A_HASH)], valid: false },
    { name: "an unknown selector", value: [pin("strategy-a#body", A_HASH)], valid: false },
    { name: "a keyed selector with no key", value: [pin("strategy-a#criterion:", A_HASH)], valid: false },
    { name: "a bare selector carrying a key", value: [pin("strategy-a#node:x", A_HASH)], valid: false },
    { name: "an uppercase hash", value: [pin("strategy-a#statement", A_HASH.toUpperCase())], valid: false },
    { name: "a short hash", value: [pin("strategy-a#statement", "abc")], valid: false },
    { name: "a malformed date", value: [pin("strategy-a#statement", A_HASH, { pinned_at: "2026-9-1" })], valid: false },
    {
      name: "a duplicate citation",
      value: [pin("strategy-a#statement", A_HASH), pin("strategy-a#statement", "1".repeat(64))],
      valid: false,
    },
  ];

  for (const { name, value, valid } of cases) {
    it(`${valid ? "accepts" : "rejects"} ${name} on both paths`, () => {
      const viaPins = () => validateBasisPinList(value, "attributes.basis_pins");
      const viaGraph = () =>
        validateGraph([
          kindNode("kind-strategy"),
          kindNode("kind-kind"),
          node({ id: "strategy-x", kind: "strategy", attributes: { basis_pins: value } }),
        ]);
      if (valid) {
        expect(viaPins).not.toThrow();
        expect(viaGraph).not.toThrow();
      } else {
        expect(viaPins).toThrow(IntentionSchemaError);
        expect(viaGraph).toThrow(IntentionSchemaError);
      }
    });
  }

  it("is inert on a node carrying no pins — it cannot retroactively break main", () => {
    expect(() =>
      validateGraph([kindNode("kind-strategy"), kindNode("kind-kind"), node({ id: "strategy-x", kind: "strategy" })]),
    ).not.toThrow();
  });

  it("reports every defect in one run rather than stopping at the first", () => {
    try {
      validateGraph([
        kindNode("kind-strategy"),
        kindNode("kind-kind"),
        node({
          id: "strategy-x",
          kind: "strategy",
          attributes: { basis_pins: [pin("strategy-a#body", "abc", { pinned_at: "yesterday" })] },
        }),
      ]);
      expect.unreachable("expected validateGraph to throw");
    } catch (error) {
      const message = (error as Error).message; // type-safety-ok: catch binds unknown; the assertions below are the narrowing
      expect(message).toMatch(/unknown disposition selector "body"/);
      expect(message).toMatch(/\.hash must be a lowercase sha256 hex digest/);
      expect(message).toMatch(/\.pinned_at must be a YYYY-MM-DD date/);
    }
  });
});
