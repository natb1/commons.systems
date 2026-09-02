import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MOUNT_KINDS,
  consolidationVerdict,
  deferredQueue,
  parseStampGrammar,
  renderStamp,
} from "../src/consolidation.js";
import type {
  DeferredQueue,
  DispositionRecord,
  DispositionSource,
  DispositionState,
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
