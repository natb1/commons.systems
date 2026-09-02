import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MOUNT_KINDS,
  consolidationVerdict,
  deferredQueue,
  multiRulingCandidates,
  parseStampGrammar,
  renderStamp,
  splitMultiRuling,
} from "../src/consolidation.js";
import type {
  DeferredQueue,
  DispositionRecord,
  DispositionSource,
  DispositionState,
  MultiRulingCandidate,
  RulingSplit,
} from "../src/consolidation.js";
import { IntentionSchemaError } from "../src/errors.js";
import type { IntentionNode } from "../src/schema.js";
import { listNodes, readNodeBody } from "../src/store.js";

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

// ---------------------------------------------------------------------------
// deferredQueue — Unit 2, the deferred-disposition queue deriver.
// ---------------------------------------------------------------------------

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

const grammarSource: DispositionSource = { dispositions: parseStampGrammar };

describe("deferredQueue — the deferred-disposition queue deriver", () => {
  it("collects deferred dispositions from both clarification answers and the body", () => {
    const strategy = anode({
      id: "strategy-x",
      kind: "strategy",
      clarifications: [
        {
          question: "q1",
          answer: "In interview (decision: deferred, delegation-anthropic-claude, 2026-08-30).",
        },
      ],
    });
    const bodyById = new Map([
      ["strategy-x", "Body prose (decision: delegated, delegation-anthropic-claude, 2026-08-31)."],
    ]);

    const queue = deferredQueue([strategy], bodyById, grammarSource);

    expect(queue.defects).toEqual([]);
    // Both stamps become items: the clarification stamp is bare `deferred`,
    // and the body's `delegated` stamp is NOT filtered here — deferredQueue
    // only routes normalized state "deferred" into items, so verify the
    // delegated one is excluded.
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]?.state).toBe("deferred");
    expect(queue.items[0]?.nodeId).toBe("strategy-x");
  });

  it("routes a mount-kind node's disposition to defects, never to items", () => {
    const tradition = anode({
      id: "tradition-x",
      kind: "tradition",
      clarifications: [
        {
          question: "q1",
          answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-30)",
        },
      ],
    });

    const queue = deferredQueue([tradition], new Map(), grammarSource);

    expect(queue.items).toEqual([]);
    expect(queue.defects).toHaveLength(1);
    expect(queue.defects[0]).toContain("tradition-x");
    expect(queue.defects[0]).toContain("MOUNT_KINDS");
  });

  it("orders items by node id, then by stamp ordinal", () => {
    const nodeB = anode({
      id: "tactic-b",
      kind: "tactic",
      clarifications: [
        { question: "q1", answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-30)" },
        { question: "q2", answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-31)" },
      ],
    });
    const nodeA = anode({
      id: "tactic-a",
      kind: "tactic",
      clarifications: [
        { question: "q1", answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-29)" },
      ],
    });

    // Deliberately passed out of id order — deferredQueue must sort.
    const queue = deferredQueue([nodeB, nodeA], new Map(), grammarSource);

    expect(queue.items.map((i) => i.nodeId)).toEqual(["tactic-a", "tactic-b", "tactic-b"]);
    expect(queue.items.map((i) => i.key)).toEqual([
      "tactic-a#1",
      "tactic-b#1",
      "tactic-b#2",
    ]);
  });

  it(
    "a malformed stamp does not doom a WELL-FORMED stamp sharing the same node's text " +
      "(the per-stamp catch granularity this unit exists to get right)",
    () => {
      const node = anode({
        id: "strategy-mixed",
        kind: "strategy",
        clarifications: [
          {
            question: "q1",
            answer:
              "Good stamp (decision: deferred, delegation-anthropic-claude, 2026-08-30). " +
              "Much later, a malformed one: (decision: author-issued 2026-09-01).",
          },
        ],
      });

      const queue = deferredQueue([node], new Map(), grammarSource);

      // The well-formed stamp survives as an item...
      expect(queue.items).toHaveLength(1);
      expect(queue.items[0]?.nodeId).toBe("strategy-mixed");
      expect(queue.items[0]?.state).toBe("deferred");
      // ...and the malformed one is reported, not silently dropped.
      expect(queue.defects).toHaveLength(1);
      expect(queue.defects[0]).toContain("strategy-mixed");
    },
  );

  it("reports a whole-text failure with no stamp-shaped span as a single defect", () => {
    // A throw from `source.dispositions` that isn't about isolating stamps —
    // exercised with a fake source, since parseStampGrammar itself never
    // throws on stamp-free text.
    const throwingSource: DispositionSource = {
      dispositions: () => {
        throw new IntentionSchemaError("boom: something else entirely");
      },
    };
    const node = anode({ id: "tactic-x", kind: "tactic" });
    const bodyById = new Map([["tactic-x", "No stamps here at all."]]);

    const queue = deferredQueue([node], bodyById, throwingSource);

    expect(queue.items).toEqual([]);
    expect(queue.defects).toHaveLength(1);
    expect(queue.defects[0]).toContain("boom: something else entirely");
  });

  it("treats a node absent from bodyById as having an empty body rather than throwing", () => {
    const node = anode({
      id: "tactic-x",
      kind: "tactic",
      clarifications: [
        { question: "q1", answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-30)" },
      ],
    });

    expect(() => deferredQueue([node], new Map(), grammarSource)).not.toThrow();
    const queue = deferredQueue([node], new Map(), grammarSource);
    expect(queue.items).toHaveLength(1);
  });

  it("produces byte-identical output across two derivations of the same input (determinism)", () => {
    const node = anode({
      id: "tactic-x",
      kind: "tactic",
      clarifications: [
        { question: "q1", answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-30)" },
      ],
    });
    const bodyById = new Map([["tactic-x", "prose"]]);

    const first: DeferredQueue = deferredQueue([node], bodyById, grammarSource);
    const second: DeferredQueue = deferredQueue([node], bodyById, grammarSource);

    expect(second).toEqual(first);
  });

  // -------------------------------------------------------------------------
  // Shim-parity check — AMENDED 2026-09-02, EXECUTOR-DERIVED CRITERION HELD AT
  // DEFERRED AUTHORITY PENDING AUTHOR RATIFICATION. See the gap note at
  // intentions/operational/gap-notes/20260902-86a51a33f38b.json for the full
  // finding; this comment summarizes it, not re-derives it.
  //
  // THE PLAN'S ORIGINAL CRITERION, "the deriver's item count is >= the raw
  // grep's `decision: deferred` match count", is FALSIFIED BY MEASUREMENT.
  // 2026-09-02: deriver items=10, raw grep=32, defects=48. The 32 decomposes
  // as 9 SELF-REFERENTIAL PROSE QUOTES of the shim command itself (7 inside
  // THIS VERY PLAN NODE's own body, describing/testing the shim it defines;
  // 1 in strategy-graph-native-dispatch.md quoting ruling (1) verbatim; 1 in
  // tactic-migration-frontier-projection.md quoting the interim-surface
  // command — none of these are even `(decision:`-shaped, so no stamp-finder
  // would ever touch them), ~5 DOCUMENTATION PLACEHOLDER examples that ARE
  // `(decision:` shaped but fail the grammar by construction (a literal
  // `YYYY-MM-DD`, or prose quoting kind-kind.md's stamp from a different
  // node), several MALFORMED-BUT-REAL free-prose dispositions Unit 1's
  // strict, already-committed-and-tested tag grammar correctly refuses (not a
  // parser bug — loosening that grammar is out of Unit 2's authority), and
  // stamps living in fields OUTSIDE Unit 2's declared scan scope (a real
  // `rationale`-embedded stamp on tactic-align-audit-retirement.md; real
  // `attributes.adopted[]`-embedded stamps on tradition-hacker-culture.md,
  // tradition-motivation-psychology.md, virtue-knowledge-as-gift.md). None of
  // that is a code defect in `deferredQueue`.
  //
  // THIS DOES NOT DELETE THE PLAN'S DIRECTIONAL INTENT — it re-anchors it.
  // What the plan actually feared, in its own words ("a deriver finding fewer
  // is a parser bug"), is silent under-collection: a real disposition
  // vanishing with no trace at all. The honest, mechanical way to check that
  // is not "does the deriver's count exceed a raw substring grep that also
  // matches the plan node's own prose about itself", but "does every
  // `(decision: ...)` stamp-shaped span WITHIN THE DERIVER'S DECLARED SCAN
  // SCOPE (clarifications + body) end up as EITHER an item OR a defect —
  // never neither". `baseline` below measures exactly that, independently of
  // `deferredQueue`/`parseTolerant` (it re-derives spans and re-parses each
  // IN ISOLATION with its own local regex and a direct `parseStampGrammar`
  // call, never calling `deferredQueue` or `parseTolerant`), so a regression
  // in the deriver's own loop — skipping a clarification, mis-sorting nodes,
  // losing a record between `parseTolerant` and the `items`/`defects` split —
  // would show up as `baseline` exceeding `items + matching defects`, the
  // exact silent-under-collection failure mode this guards against.
  // -------------------------------------------------------------------------
  it(
    "shim parity (amended): every deferred-shaped stamp in the declared scan scope " +
      "becomes an item or a defect, never neither",
    () => {
      // repo root: packages/intentionsutil/test/ -> up three.
      const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..");
      const intentionsDir = join(repoRoot, "intentions");

      const nodes = listNodes(intentionsDir);
      const bodyById = new Map<string, string>();
      for (const node of nodes) {
        bodyById.set(node.id, readNodeBody(intentionsDir, node.id));
      }

      const queue = deferredQueue(nodes, bodyById, grammarSource);

      // The independent baseline. Same declared scope as deferredQueue's own
      // corpus (clarifications answers + body, joined the same way), same
      // stamp-shaped-span finder shape `parseTolerant` uses internally — but
      // a SEPARATE walk and a DIRECT `parseStampGrammar` call per isolated
      // span, never going through `deferredQueue` or `parseTolerant`
      // themselves, so this cannot trivially agree with them by construction.
      const stampSpanPattern = /\(decision:[^)]*\)/g;
      let baseline = 0;
      for (const node of nodes) {
        const corpus = [...node.clarifications.map((c) => c.answer), bodyById.get(node.id) ?? ""].join(
          "\n\n",
        );
        const pattern = new RegExp(stampSpanPattern.source, "g");
        let match = pattern.exec(corpus);
        while (match !== null) {
          const span = match[0];
          try {
            const records = parseStampGrammar(node.id, node.kind, span);
            if (records.some((r) => r.state === "deferred")) baseline += 1;
          } catch {
            // Malformed, but its own text still says "deferred" — a real
            // disposition (or at minimum, deferred-shaped) the grammar can't
            // parse. Counts toward the baseline exactly like the doc-quote
            // and malformed-prose cases in the finding above: both sides of
            // the assertion below count it, since `deferredQueue` reports the
            // identical failure as a defect whose excerpt carries the same
            // text.
            if (span.toLowerCase().includes("deferred")) baseline += 1;
          }
          match = pattern.exec(corpus);
        }
      }

      const defectsMentioningDeferred = queue.defects.filter((d) =>
        d.toLowerCase().includes("deferred"),
      ).length;

      // Historical context only, no longer the assertion basis — the raw
      // grep is the baseline the finding above falsified. Kept in the log
      // line so a reader can see both numbers without re-running either.
      const grepOutput = execFileSync("grep", ["-rho", "decision: deferred", intentionsDir], {
        encoding: "utf8",
      });
      const rawGrepCount = grepOutput.split("\n").filter((line) => line.length > 0).length;

      console.log(
        `shim parity (amended): items=${queue.items.length} ` +
          `defects-mentioning-deferred=${defectsMentioningDeferred} baseline=${baseline} ` +
          `delta=${queue.items.length + defectsMentioningDeferred - baseline} ` +
          `(historical raw-grep=${rawGrepCount}, superseded — see gap note ` +
          `20260902-86a51a33f38b)`,
      );

      // Silent-under-collection guard: nothing stamp-shaped in scope vanishes
      // without a trace (an item, or a defect naming it).
      expect(queue.items.length + defectsMentioningDeferred).toBeGreaterThanOrEqual(baseline);
      // Hard floor: today's hand-verified count, so a parser regression that
      // silently drops real stamps still fails loudly even in the (unlikely)
      // event `baseline` itself regressed in lockstep.
      expect(queue.items.length).toBeGreaterThanOrEqual(10);
    },
  );
});

// ---------------------------------------------------------------------------
// Unit 5 — one-ruling-one-stamp normalization.
// ---------------------------------------------------------------------------

/** A clarification fixture, so the tests read as answers rather than objects. */
function aclar(question: string, answer: string): { question: string; answer: string } {
  return { question, answer };
}

/** `label=authority` per segment, the shape most assertions below compare. */
function shape(splits: readonly RulingSplit[]): string[] {
  return splits.map((s) => `${s.label}=${s.authority}`);
}

const DEFERRED_STAMP = "(decision: deferred, delegation-anthropic-claude, 2026-08-30)";
const RATIFIED_STAMP = "(decision: author-ratified, 2026-08-31)";
const DELEGATED_STAMP = "(decision: delegated, delegation-anthropic-claude, 2026-09-01)";

describe("splitMultiRuling — the normalizer, one segment per ruling", () => {
  it("gives each segment its OWN stamp when the answer is already normalized (case 1)", () => {
    const clar = aclar(
      "q",
      `DEFERRED-QUEUE SHIM, the interim surface is a grep ${DEFERRED_STAMP}. ` +
        `BOOTSTRAP INITIATION PROTOCOL: mint the carrier first ${RATIFIED_STAMP}.`,
    );

    const splits = splitMultiRuling("strategy-x", "strategy", clar);

    expect(shape(splits)).toEqual([
      "DEFERRED-QUEUE SHIM=deferred",
      "BOOTSTRAP INITIATION PROTOCOL=ratified",
    ]);
    expect(splits.map((s) => s.ordinal)).toEqual([1, 2]);
    expect(splits.every((s) => s.reason.startsWith("case 1"))).toBe(true);
    expect(splits[0]?.stamp?.key).toBe("strategy-x#1");
    expect(splits[1]?.stamp?.key).toBe("strategy-x#2");
  });

  it(
    "makes an unstamped segment INHERIT the clarification's single stamp (case 2) — " +
      "the one-stamp-many-rulings mis-attribution, made visible rather than invented",
    () => {
      const clar = aclar(
        "q",
        "DEFERRED-QUEUE SHIM, the interim surface is a grep. " +
          `BOOTSTRAP INITIATION PROTOCOL: mint the carrier first ${DELEGATED_STAMP}.`,
      );

      const splits = splitMultiRuling("strategy-x", "strategy", clar);

      // Both segments read `delegated`, but only the second one was ever
      // stamped: the first inherits, and its `reason` says so. That is the
      // defect this unit exists to surface, not a defect in the split.
      expect(shape(splits)).toEqual([
        "DEFERRED-QUEUE SHIM=delegated",
        "BOOTSTRAP INITIATION PROTOCOL=delegated",
      ]);
      expect(splits[0]?.reason).toContain("case 2");
      expect(splits[0]?.reason).toContain("inherits");
      expect(splits[1]?.reason).toContain("case 1");
      // The inherited stamp is reported, not nulled — a reader must be able to
      // see WHICH stamp was stretched over the segment.
      expect(splits[0]?.stamp?.key).toBe("strategy-x#1");
      expect(splits[1]?.stamp?.key).toBe("strategy-x#1");
    },
  );

  it("refuses with authority \"unknown\" when the clarification carries NO stamp (case 3)", () => {
    const clar = aclar(
      "q",
      "DEFERRED-QUEUE SHIM, the interim surface is a grep. " +
        "BOOTSTRAP INITIATION PROTOCOL: mint the carrier first.",
    );

    const splits = splitMultiRuling("strategy-x", "strategy", clar);

    expect(shape(splits)).toEqual([
      "DEFERRED-QUEUE SHIM=unknown",
      "BOOTSTRAP INITIATION PROTOCOL=unknown",
    ]);
    // A refusal, not a default: no stamp is invented and none is attached.
    expect(splits.every((s) => s.stamp === null)).toBe(true);
    expect(splits[0]?.reason).toContain("treated as binding");
  });

  it(
    "refuses an unstamped segment when the clarification carries MORE THAN ONE stamp " +
      "(case 3), and refuses a segment carrying more than one (case 4)",
    () => {
      const clar = aclar(
        "q",
        "ALPHA RULING, unstamped prose. " +
          `BETA RULING: ${DEFERRED_STAMP} and also ${DELEGATED_STAMP}.`,
      );

      const splits = splitMultiRuling("strategy-x", "strategy", clar);

      expect(shape(splits)).toEqual(["ALPHA RULING=unknown", "BETA RULING=unknown"]);
      // Segment 1: nothing of its own and no SINGLE stamp to inherit from.
      expect(splits[0]?.reason).toContain("case 3");
      expect(splits[0]?.reason).toContain("carries 2");
      // Segment 2: two stamps of its own. Combining `deferred` and `delegated`
      // into one state is `consolidationVerdict`'s job on a caller's explicit
      // request, never a side effect of splitting.
      expect(splits[1]?.reason).toContain("case 4");
      expect(splits[1]?.reason).toContain("strategy-x#1, strategy-x#2");
      expect(splits.every((s) => s.stamp === null)).toBe(true);
    },
  );

  it("returns an empty list for an answer carrying no ruling label", () => {
    expect(
      splitMultiRuling("strategy-x", "strategy", aclar("q", `Ordinary prose. ${DEFERRED_STAMP}`)),
    ).toEqual([]);
  });

  it("opens a new segment for a REPEATED label, splitting by occurrence not by name", () => {
    const clar = aclar("q", "ALPHA RULING, first. ALPHA RULING, again.");
    const splits = splitMultiRuling("strategy-x", "strategy", clar);
    expect(splits).toHaveLength(2);
    expect(splits.map((s) => s.label)).toEqual(["ALPHA RULING", "ALPHA RULING"]);
  });

  it("tiles the answer from the first label onward, leaving the preamble to no segment", () => {
    const answer = "(Recorded 2026-09-01.) ALPHA RULING, first. BETA RULING: second.";
    const splits = splitMultiRuling("strategy-x", "strategy", aclar("q", answer));

    expect(splits).toHaveLength(2);
    // The preamble is outside every segment — this splits rulings, it does not
    // partition the answer, and a restatement must carry the preamble itself.
    expect(splits[0]?.start).toBeGreaterThan(0);
    expect(answer.slice(0, splits[0]?.start ?? 0)).toContain("Recorded");
    // No gaps, no overlap, and the last segment runs to the end.
    expect(splits[0]?.end).toBe(splits[1]?.start);
    expect(splits[1]?.end).toBe(answer.length);
    for (const s of splits) {
      expect(s.text).toBe(answer.slice(s.start, s.end));
      expect(s.text.startsWith(s.label)).toBe(true);
    }
  });

  it("is STRICT: a malformed stamp on the clarification under normalization throws", () => {
    const clar = aclar(
      "q",
      "ALPHA RULING, first. BETA RULING: second (decision: author-issued 2026-09-01).",
    );
    expect(() => splitMultiRuling("strategy-x", "strategy", clar)).toThrow(IntentionSchemaError);
    expect(() => splitMultiRuling("strategy-x", "strategy", clar)).toThrow(
      /expected 2 or 3 comma-separated elements/,
    );
  });
});

describe("multiRulingCandidates — the detector, a shortlist and not a disposition", () => {
  const candidateAnswer =
    "DEFERRED-QUEUE SHIM, the interim surface is a grep. " +
    `BOOTSTRAP INITIATION PROTOCOL: mint the carrier first ${DELEGATED_STAMP}.`;

  it("shortlists a clarification with two distinct labels under one stamp", () => {
    const node = anode({
      id: "strategy-x",
      kind: "strategy",
      clarifications: [aclar("What did the round rule?", candidateAnswer)],
    });

    const found = multiRulingCandidates([node]);

    expect(found).toHaveLength(1);
    const candidate: MultiRulingCandidate | undefined = found[0];
    expect(candidate?.nodeId).toBe("strategy-x");
    expect(candidate?.kind).toBe("strategy");
    expect(candidate?.index).toBe(0);
    // `?` numbers clarifications, where DispositionRecord's `#` numbers stamps,
    // so the two key spaces cannot be confused in one report.
    expect(candidate?.key).toBe("strategy-x?1");
    expect(candidate?.labels).toEqual(["DEFERRED-QUEUE SHIM", "BOOTSTRAP INITIATION PROTOCOL"]);
    expect(candidate?.stampCount).toBe(1);
    expect(candidate?.splitError).toBeNull();
    expect(shape(candidate?.splits ?? [])).toEqual([
      "DEFERRED-QUEUE SHIM=delegated",
      "BOOTSTRAP INITIATION PROTOCOL=delegated",
    ]);
  });

  it("excludes the ALREADY-NORMALIZED shape: one stamp per ruling is what this aims AT", () => {
    const node = anode({
      id: "strategy-x",
      kind: "strategy",
      clarifications: [
        aclar(
          "q",
          `DEFERRED-QUEUE SHIM, a grep ${DEFERRED_STAMP}. ` +
            `BOOTSTRAP INITIATION PROTOCOL: mint first ${RATIFIED_STAMP}.`,
        ),
      ],
    });

    expect(multiRulingCandidates([node])).toEqual([]);
  });

  it("excludes an answer whose labels are not DISTINCT, and one with no label at all", () => {
    const repeated = anode({
      id: "strategy-repeat",
      kind: "strategy",
      clarifications: [aclar("q", "ALPHA RULING, first. ALPHA RULING, again.")],
    });
    const bare = anode({
      id: "strategy-bare",
      kind: "strategy",
      clarifications: [aclar("q", `Ordinary prose with a stamp ${DEFERRED_STAMP}.`)],
    });

    expect(multiRulingCandidates([repeated, bare])).toEqual([]);
  });

  it(
    "is TOLERANT: a malformed stamp yields a candidate carrying the parser's message, " +
      "and does not hide another node's candidate",
    () => {
      const malformed = anode({
        id: "strategy-malformed",
        kind: "strategy",
        clarifications: [
          aclar(
            "q",
            "ALPHA RULING, first. BETA RULING: second (decision: author-issued 2026-09-01).",
          ),
        ],
      });
      const clean = anode({
        id: "strategy-x",
        kind: "strategy",
        clarifications: [aclar("q", candidateAnswer)],
      });

      const found = multiRulingCandidates([malformed, clean]);

      expect(found.map((c) => c.nodeId)).toEqual(["strategy-malformed", "strategy-x"]);
      // The malformed one is still shortlisted — the detector's job is to find
      // it, and a stamp the grammar refuses is if anything MORE interesting.
      expect(found[0]?.splits).toEqual([]);
      expect(found[0]?.splitError).toContain("expected 2 or 3 comma-separated elements");
      // ...and it did not abort the sweep before the clean node was reached.
      expect(found[1]?.splitError).toBeNull();
      expect(found[1]?.splits).toHaveLength(2);
    },
  );

  it("sorts by node id and keeps clarification declaration order (determinism)", () => {
    const nodeB = anode({
      id: "tactic-b",
      kind: "tactic",
      clarifications: [
        aclar("q1", candidateAnswer),
        aclar("q2", "GAMMA RULING, one. DELTA RULING: two."),
      ],
    });
    const nodeA = anode({
      id: "tactic-a",
      kind: "tactic",
      clarifications: [aclar("q1", candidateAnswer)],
    });

    // Deliberately passed out of id order — the detector must sort.
    const first = multiRulingCandidates([nodeB, nodeA]);
    const second = multiRulingCandidates([nodeB, nodeA]);

    expect(first.map((c) => c.key)).toEqual(["tactic-a?1", "tactic-b?1", "tactic-b?2"]);
    expect(second).toEqual(first);
  });

  it(
    "live store: the shortlist is non-empty and contains strategy-graph-native-dispatch's " +
      "\"items 1-8\" clarification, the canonical four-rulings-one-stamp instance",
    () => {
      // repo root: packages/intentionsutil/test/ -> up three.
      const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..");
      const intentionsDir = join(repoRoot, "intentions");

      const nodes = listNodes(intentionsDir);
      const found = multiRulingCandidates(nodes);
      const clarificationCount = nodes.reduce((n, node) => n + node.clarifications.length, 0);

      console.log(
        `multi-ruling shortlist: candidates=${found.length} of ` +
          `${clarificationCount} clarifications across ${nodes.length} nodes ` +
          `(${found.filter((c) => c.splitError !== null).length} carry a stamp the strict ` +
          `grammar refuses); plan measured 130 of 1021 on 2026-09-01`,
      );

      // Deliberately NOT `toBe(130)`: the shortlist is a measurement of a store
      // that moves, and pinning it would make every unrelated /align round red.
      expect(found.length).toBeGreaterThan(0);

      const canonical = found.filter(
        (c) => c.nodeId === "strategy-graph-native-dispatch" && c.question.includes("items 1-8"),
      );
      expect(canonical).toHaveLength(1);
      expect(canonical[0]?.stampCount).toBe(1);
      expect(canonical[0]?.labels).toEqual([
        "DEFERRED-QUEUE SHIM",
        "BOOTSTRAP INITIATION PROTOCOL",
        "INITIATION ORDER",
        "CONSOLIDATION SCOPE FOLDS",
      ]);
      // Four rulings under ONE stamp — and that stamp is free prose the interim
      // grammar refuses, which is why the detector's tolerance is load-bearing
      // rather than theoretical: a per-node abort would drop the very instance
      // the plan names.
      expect(canonical[0]?.splitError).toContain("Unrecognized disposition state");
      expect(canonical[0]?.splits).toEqual([]);
    },
  );
});
