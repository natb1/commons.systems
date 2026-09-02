/**
 * Consolidation (restatement): the authority gate and the disposition-source
 * seam.
 *
 * A consolidation is a RESTATEMENT — a read of an append-accreted journal and a
 * write of a ledger holding its current state, citing what it consolidated and
 * stamping who had the authority to do it. Two carriers share that shape (a
 * node's clarifications and body; the operational evidence log), and this
 * module is the one place both of them ask "may this content be folded, and
 * under whose authority does the fold land". Not two parallel gates that can
 * drift.
 *
 * PURE. No fs, no process, no clock, no store read — text and plain data arrive
 * as arguments, exactly like `criteria.ts` and `digest.ts`. The fs and argv live
 * in the CLIs that call in.
 *
 * THE ALGEBRA IS CITED, NEVER RE-DERIVED. Every branch of `consolidationVerdict`
 * names the rule it implements from the ratified overrule algebra
 * (`intentions/strategy-explicit-intent.md`, the "What is the overrule algebra
 * across disposition states" clarification, 2026-08-31, recorded in the
 * tactic-rsi-graph-review finalize interview), together with the CONSOLIDATION
 * clarification of the same round ("for ratified content it happens only in
 * interview; for delegated or deferred content it follows the overrule algebra,
 * an AI consolidation being itself a deferred disposition entering the author
 * queue"). Do not restate either from memory — the four rules are quoted in
 * `consolidationVerdict`'s doc comment and the branches map onto them one to one.
 *
 * THE SEAM. `DispositionSource` is the interface every consumer in this plan
 * takes; a concrete parser is never imported by a consumer.
 * `tactic-node-review-skill`'s Unit 2 specifies `parseDispositions` in
 * `packages/intentionsutil/src/review.ts` with exactly the `DispositionRecord`
 * shape and exactly the normalization table below. That file DOES NOT EXIST at
 * the time this module was written (checked 2026-09-02), so `parseStampGrammar`
 * here is the conforming implementation, per this unit's guard clause. When
 * `review.ts` lands, the correct move is to replace this body with a thin
 * adapter over `parseDispositions` and delete the duplicate grammar — the seam
 * exists so that swap touches no consumer. `{ dispositions: parseStampGrammar }`
 * satisfies `DispositionSource` structurally today.
 *
 * TOLERANT READ, STRICT WRITE. The stamp vocabulary is mid-migration: the
 * three-state clarification's INTERIM TAG GRAMMAR spells the states
 * `author-ratified` / `delegated-pending-review` / `delegated-review-declined`,
 * while the live corpus also carries the bare `ratified` / `deferred` /
 * `delegated` forms. `parseStampGrammar` accepts every one of those spellings
 * (the same three-shape tolerance idiom `isFingerprintStale` uses,
 * `packages/intentionsutil/src/transitions.ts:508-534`); `renderStamp` emits
 * exactly one canonical spelling per state so no call site invents a seventh.
 *
 * REFUSE, DON'T SKIP. An unrecognized state token, a malformed date, or a
 * wrong-arity stamp throws `IntentionSchemaError` naming the node, its kind,
 * and the excerpt. A stamp this parser cannot read is a disposition whose
 * authority is unknown, and silently dropping it removes content from the
 * author's review queue — the one failure this operation must not have
 * (`.claude/rules/code-style.md`).
 *
 * MOUNT KINDS ARE NOT DOCTRINE. Tradition and delegation nodes are MOUNT POINTS
 * (`strategy-graph-mounts`, restated in the three-state clarification): they are
 * reference for delegated decisions and never carry doctrine themselves. A
 * disposition stamp found on one is therefore a DEFECT, not a queue member.
 * Parsing is kind-independent — the grammar is the same everywhere — so
 * `parseStampGrammar` returns the records and the CONSUMER routes them by
 * testing the node's kind against the exported `MOUNT_KINDS`. Unit 2's
 * `deferredQueue` is that consumer: mount-kind records go to its `defects`,
 * never to its `items`.
 *
 * `deferredQueue` LIQUIDATES THE DEFERRED-QUEUE SHIM. The 2026-09-01 finalize
 * round on `strategy-graph-native-dispatch` (ruling (1), the "interim mechanics
 * and initiation protocol" clarification) recorded that the deferred-disposition
 * review queue's target mechanism is a stamp-derived queue, that no deriver
 * existed yet, and that the interim surface — `grep -rn "decision: deferred"
 * intentions/`, the documented office-hours practice — is retired once the
 * deriver lands, with deriver ownership assigned to
 * `tactic-consolidation-operation` at its finalization. `deferredQueue`, below,
 * is that deriver: once it is in place, the `grep -rn "decision: deferred"
 * intentions/` practice is retired, and a caller reads this function's output
 * (or the `deferred-queue.ts` CLI wrapping it) instead of re-running the grep.
 *
 * TOLERANT DERIVATION, STRICT PARSER. `parseStampGrammar` above refuses rather
 * than skips — correct for a single stamp whose authority is genuinely unknown.
 * But the live corpus carries stamps the grammar CANNOT parse at all — measured
 * 2026-09-02, e.g. `(decision: author-issued 2026-09-01)` (wrong arity),
 * `(decision: deferred — Claude-drafted, held for author review)` (prose, not
 * the tag grammar), `(decision: delegated, ...)` (an elided placeholder), and
 * `(decision: <state>, <delegatee>, YYYY-MM-DD)` (grammar-spec prose quoting its
 * own tag shape) — across
 * strategy-graph-native-dispatch/kind-kind/tactic-node-review-skill/
 * tactic-rsi-graph-review/tactic-intent-orchestration-layer-schema/
 * tactic-bootstrap-operation. If `deferredQueue` let one such stamp abort the
 * whole node's parse, it would lose every WELL-FORMED stamp sharing that node's
 * text too — measured concretely on strategy-graph-native-dispatch, whose body
 * carries well-formed `author-ratified` stamps a few thousand characters away
 * from a malformed `author-directed` one. That would push the deriver's count
 * BELOW the raw-grep shim it exists to replace, failing the very parity property
 * this unit ships a test for. So `deferredQueue` catches at PER-STAMP
 * granularity, not per-node: it tries the whole text first (the fast path,
 * which preserves `parseStampGrammar`'s own ordinal numbering unchanged), and
 * only on a throw isolates each individual `(decision: ...)` occurrence and
 * re-parses it alone, routing a stamp that still fails to `defects` while
 * keeping every stamp that parses. See `parseTolerant`'s doc comment.
 *
 * ONE RULING, ONE STAMP. `multiRulingCandidates` and `splitMultiRuling` are the
 * folding-pass half of ruling (4) of the 2026-09-01 adversarial-review set
 * (`strategy-graph-native-dispatch`, the "interim mechanics and initiation
 * protocol" clarification: "CONSOLIDATION SCOPE FOLDS ... one-ruling-one-stamp
 * normalization of multi-ruling clarifications (the folding pass)"). The defect
 * they address, measured over the store 2026-09-01: only 4 clarifications carry
 * two or more `(decision:` stamps, but 130 carry two or more distinct ALL-CAPS
 * ruling labels under at most one. One stamp is silently claiming authority over
 * rulings it was never issued for, and under the overrule algebra above that
 * mis-attribution decides whether AI may revise the text at all.
 *
 * DETECT TOLERANTLY, SPLIT STRICTLY. The two functions sit on opposite sides of
 * the same seam `parseTolerant` straddles, for the same reason.
 * `splitMultiRuling` works on ONE clarification a caller has chosen to
 * normalize, so it calls `parseStampGrammar` directly and lets a malformed stamp
 * throw — a stamp whose authority cannot be read is exactly the case where
 * proceeding would guess. `multiRulingCandidates` sweeps every node, so a single
 * malformed stamp must not hide the store-wide shortlist: it catches per
 * clarification and still emits the candidate, carrying the parser's message in
 * `splitError` with `splits` empty. That tolerance is load-bearing rather than
 * theoretical — the canonical instance the plan names, the "items 1-8"
 * clarification itself, carries exactly one stamp and that stamp is free prose
 * the interim grammar refuses.
 *
 * THE TRIGGER SIGNAL. `consolidationCandidates` (Unit 7) is the read-cost half
 * of the operation: where `multiRulingCandidates` shortlists a STRUCTURAL
 * defect (one stamp over many rulings), `consolidationCandidates` shortlists
 * SIZE — content that costs a lot to read relative to how much of it there is.
 * It is deliberately generic over `SizeRecord` rather than over `IntentionNode`,
 * because two unrelated corpora feed it: `digest.ts`'s per-node graph
 * inputs (`CONSOLIDATION-DEBT`) and `.claude/rules/*.md`'s file corpus
 * (`consolidate-node.ts --corpus rules`). One ranking implementation serves
 * both rather than two that could drift on what "worth a look" means.
 */
import { IntentionSchemaError } from "./errors.js";
import type { Clarification, IntentionNode } from "./schema.js";

/**
 * The three disposition states, normalized. This is the vocabulary the overrule
 * algebra is written in, and it is deliberately narrower than the set of
 * spellings the store carries — see `STATE_SPELLINGS`.
 */
export type DispositionState = "ratified" | "deferred" | "delegated";

/** Runtime membership test data for the public boundary guard below. */
const DISPOSITION_STATES: readonly DispositionState[] = ["ratified", "deferred", "delegated"];

/**
 * One recorded disposition, field-for-field the shape
 * `tactic-node-review-skill`'s Unit 2 specifies for `parseDispositions`
 * (`intentions/tactic-node-review-skill.md:448-470`), so the two are one type
 * when `review.ts` lands.
 *
 *  - `nodeId`    — the node the stamp was found on.
 *  - `state`     — the normalized state, never the raw spelling.
 *  - `delegatee` — the delegatee mount id, or `null` for a ratified stamp
 *                  written in the two-element form (grammar note H11).
 *  - `date`      — `YYYY-MM-DD`, the date the disposition was recorded.
 *  - `key`       — `<nodeId>#<ordinal>`, ordinal 1-based over stamps in
 *                  DOCUMENT ORDER within the text parsed. Stable across
 *                  re-parses of the same text, so a sitting can name exactly
 *                  which disposition it reviewed and the queue can be diffed
 *                  across cycles.
 *  - `excerpt`   — a bounded (200 char) window of surrounding text, whitespace
 *                  collapsed and control characters neutralized, so the queue
 *                  is readable without opening the node.
 */
export interface DispositionRecord {
  nodeId: string;
  state: DispositionState;
  delegatee: string | null;
  date: string;
  key: string;
  excerpt: string;
}

/**
 * The seam. Every consumer in the consolidation plan takes this interface and
 * never a concrete parser, so `review.ts`'s `parseDispositions` can replace
 * `parseStampGrammar` without touching a call site.
 */
export interface DispositionSource {
  dispositions(nodeId: string, kind: string, text: string): DispositionRecord[];
}

/**
 * The kinds that are MOUNT POINTS rather than doctrine carriers. A disposition
 * stamp found on a node of one of these kinds is a defect for the consumer to
 * report, not a queue member — see the module header.
 */
export const MOUNT_KINDS = ["tradition", "delegation"] as const;

/**
 * Every accepted spelling of a state token, mapped to its normalized state.
 * This table must stay identical to the one `review.ts` states; it is quoted
 * from `tactic-node-review-skill.md:456-459` and from the INTERIM TAG GRAMMAR
 * of `strategy-explicit-intent`'s three-state clarification.
 *
 * The migration this tolerates is `tactic-substantiation-edge-migration`'s
 * rename sweep, which this module deliberately does not pre-empt.
 */
const STATE_SPELLINGS = new Map<string, DispositionState>([
  ["ratified", "ratified"],
  ["author-ratified", "ratified"],
  ["deferred", "deferred"],
  ["delegated-pending-review", "deferred"],
  ["delegated", "delegated"],
  ["delegated-review-declined", "delegated"],
]);

/**
 * The one spelling `renderStamp` emits per state. Chosen to match live practice
 * measured on the store 2026-09-02 (`grep -rho "(decision: [^)]*)" intentions/`):
 * every ratified stamp is written `author-ratified`, and every delegated or
 * deferred stamp is written with the bare token.
 */
const CANONICAL_SPELLING: Readonly<Record<DispositionState, string>> = {
  ratified: "author-ratified",
  deferred: "deferred",
  delegated: "delegated",
};

/** The stamp itself: `(decision: ...)`, captured with its inner element list. */
const STAMP_PATTERN = /\(decision:([^)]*)\)/g;

/** `YYYY-MM-DD`. The one date shape the interim grammar admits. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Upper bound on `excerpt`, per the `parseDispositions` spec. */
const EXCERPT_MAX = 200;

/** Characters of surrounding text kept on each side of a stamp in an excerpt. */
const EXCERPT_CONTEXT = 70;

/**
 * Flatten a text window into one readable line. Whitespace runs collapse to a
 * single space and control characters become spaces, because an excerpt is
 * rendered into queue lines and error messages and must not break out of its
 * field — the same render-boundary duty `digest.ts`'s `renderId` carries.
 *
 * Walks code points rather than using a control-character regex literal, which
 * trips eslint's no-control-regex (the idiom is copied from `digest.ts:69-81`).
 */
function flattenExcerpt(raw: string): string {
  const neutralized = Array.from(raw)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      const isControl = code <= 0x1f || code === 0x7f || (code >= 0x80 && code <= 0x9f);
      return isControl ? " " : ch;
    })
    .join("");
  return neutralized.replace(/ {2,}/g, " ").trim();
}

/** The bounded window of `text` surrounding `[start, end)`. */
function excerptAround(text: string, start: number, end: number): string {
  const from = Math.max(0, start - EXCERPT_CONTEXT);
  const to = Math.min(text.length, end + EXCERPT_CONTEXT);
  const flat = flattenExcerpt(text.slice(from, to));
  return flat.length <= EXCERPT_MAX ? flat : flat.slice(0, EXCERPT_MAX);
}

/** A grammar failure, reported with everything a reader needs to find it. */
function grammarError(
  nodeId: string,
  kind: string,
  excerpt: string,
  detail: string,
): IntentionSchemaError {
  return new IntentionSchemaError(
    `Malformed disposition stamp in ${nodeId} (kind ${kind}): ${detail} — ${excerpt}`,
  );
}

/**
 * Parse every disposition stamp in `text`, in document order.
 *
 * The interim tag grammar, recorded on `strategy-explicit-intent` (the
 * three-state clarification's INTERIM TAG GRAMMAR, amended by grammar note H11
 * at `intentions/strategy-explicit-intent.md:719-724`):
 *
 *     (decision: <state>, <delegatee-mount-id>, YYYY-MM-DD)   deferred, delegated
 *     (decision: <state>, YYYY-MM-DD)                         ratified
 *
 * H11's amendment is the reason the two-element form exists at all: "the
 * delegatee element is required only for the two delegated states". So a
 * deferred or delegated stamp missing its delegatee is a grammar failure, while
 * a ratified stamp carrying one is accepted (tolerant read, strict write — the
 * module header says why).
 *
 * `kind` is the node's kind. Parsing does not branch on it — the grammar is the
 * same on every node — but it is carried in every error message, and it is the
 * value a consumer tests against `MOUNT_KINDS` to route these records to defects
 * rather than to a queue.
 *
 * Throws `IntentionSchemaError` on an unrecognized state token, a wrong element
 * count, a malformed date, or a missing required delegatee. Never skips a stamp
 * it cannot read.
 */
export function parseStampGrammar(
  nodeId: string,
  kind: string,
  text: string,
): DispositionRecord[] {
  if (nodeId.trim() === "") {
    throw new IntentionSchemaError("parseStampGrammar: nodeId must be a non-empty node id");
  }
  if (kind.trim() === "") {
    throw new IntentionSchemaError(
      `parseStampGrammar: kind must be a non-empty node kind (node ${nodeId})`,
    );
  }

  const records: DispositionRecord[] = [];
  // A fresh regex per call: STAMP_PATTERN is global and therefore stateful, and
  // sharing `lastIndex` across calls would silently skip stamps in the second.
  const pattern = new RegExp(STAMP_PATTERN.source, "g");
  let match = pattern.exec(text);
  let ordinal = 0;

  while (match !== null) {
    ordinal += 1;
    const whole = match[0];
    const inner = match[1] ?? "";
    const start = match.index;
    const excerpt = excerptAround(text, start, start + whole.length);

    const parts = inner.split(",").map((p) => p.trim());
    if (parts.length < 2 || parts.length > 3) {
      throw grammarError(
        nodeId,
        kind,
        excerpt,
        `expected 2 or 3 comma-separated elements, got ${parts.length}`,
      );
    }

    const rawState = (parts[0] ?? "").toLowerCase();
    const state = STATE_SPELLINGS.get(rawState);
    if (state === undefined) {
      throw new IntentionSchemaError(
        `Unrecognized disposition state "${parts[0] ?? ""}" in ${nodeId} (kind ${kind}) — ${excerpt}`,
      );
    }

    const delegatee = parts.length === 3 ? (parts[1] ?? "") : null;
    const date = parts.length === 3 ? (parts[2] ?? "") : (parts[1] ?? "");

    if (delegatee !== null && delegatee === "") {
      throw grammarError(nodeId, kind, excerpt, "the delegatee element is empty");
    }
    if (delegatee === null && state !== "ratified") {
      throw grammarError(
        nodeId,
        kind,
        excerpt,
        `a ${state} disposition must name its delegatee mount id (grammar note H11)`,
      );
    }
    if (!ISO_DATE.test(date)) {
      throw grammarError(nodeId, kind, excerpt, `expected a YYYY-MM-DD date, got "${date}"`);
    }

    records.push({
      nodeId,
      state,
      delegatee,
      date,
      key: `${nodeId}#${ordinal}`,
      excerpt,
    });

    match = pattern.exec(text);
  }

  return records;
}

/** The verdict `consolidationVerdict` returns. A refusal is data, not a throw. */
interface ConsolidationVerdict {
  /** Whether an AI consolidation of this content is sanctioned. */
  permitted: boolean;
  /** The state the fold's own stamp inherits, or `null` when refused. */
  resultState: DispositionState | null;
  /** The rule that decided it, in words a reader can check against the graph. */
  reason: string;
}

/**
 * THE AUTHORITY GATE. One function, consulted by both carriers of the operation
 * family — a node restatement and an evidence-log fold — so the two can never
 * drift apart on who is allowed to delete what.
 *
 * `states` is the normalized state of every disposition covering the content
 * being folded. The ratified overrule algebra, quoted verbatim from
 * `intentions/strategy-explicit-intent.md` (the "What is the overrule algebra
 * across disposition states" clarification, 2026-08-31):
 *
 *   (1) "A ratified disposition is overruled only in interview - /align or
 *        /exetasis - never during execution or rsi."
 *   (2) "Delegated and deferred dispositions may be overruled by AI during
 *        either execution or rsi (iterative or batch)."
 *   (3) "A disposition that overrules a DEFERRED one inherits the deferred
 *        stamp - it is subject to review in lieu of the disposition it
 *        superseded."
 *   (4) "An AI disposition that overrules a DELEGATED one becomes DEFERRED
 *        (author refinement of Claude's proposal, which had kept it delegated):
 *        every AI override enters the author review queue."
 *
 * Rule (2) is what makes the two permitted rows permitted at all; rules (3) and
 * (4) decide which stamp the fold itself carries. Both permitted rows resolve to
 * `deferred`, which is the CONSOLIDATION clarification's "an AI consolidation
 * being itself a deferred disposition entering the author queue" — the fold
 * never disappears from the author's queue by having been performed.
 *
 * Rule (4) is the row that must not be written backwards. Leaving an AI
 * consolidation of delegated content stamped `delegated` would remove it from
 * the author review queue, which is the single failure this whole operation
 * exists to avoid.
 *
 * The empty case is not a fifth rule but the provenance discipline of
 * `.claude/rules/measurement-and-provenance.md`: content carrying no stamp has
 * unrecoverable provenance, and an unrecoverable constraint is treated as
 * binding rather than silently dropped. It refuses.
 */
export function consolidationVerdict(states: readonly DispositionState[]): ConsolidationVerdict {
  for (const state of states) {
    if (!DISPOSITION_STATES.includes(state)) {
      throw new IntentionSchemaError(
        `consolidationVerdict: unknown disposition state "${String(state)}" — expected one of ${DISPOSITION_STATES.join(", ")}`,
      );
    }
  }

  if (states.length === 0) {
    return {
      permitted: false,
      resultState: null,
      reason: "no disposition stamps found — authority is unknown, treat as binding",
    };
  }

  if (states.includes("ratified")) {
    return {
      permitted: false,
      resultState: null,
      reason:
        "overrule algebra rule (1): a ratified disposition is overruled only in interview (/align or /exetasis), never during execution or rsi — route this consolidation to the author queue",
    };
  }

  if (states.includes("delegated")) {
    return {
      permitted: true,
      resultState: "deferred",
      reason:
        "overrule algebra rule (4): an AI disposition that overrules a delegated one becomes deferred — every AI override enters the author review queue",
    };
  }

  return {
    permitted: true,
    resultState: "deferred",
    reason:
      "overrule algebra rule (3): a disposition that overrules a deferred one inherits the deferred stamp — it is subject to review in lieu of the disposition it superseded",
  };
}

/**
 * Emit a disposition stamp in the canonical interim tag grammar, so no call site
 * hand-formats one and no seventh spelling is born.
 *
 * Strict by design, where `parseStampGrammar` is tolerant: exactly one spelling
 * per state, the two-element form for `ratified` (grammar note H11 makes the
 * delegatee element required only for the two delegated states), and the
 * three-element form otherwise. Every stamp this emits parses back to the record
 * it was built from.
 *
 * Throws `IntentionSchemaError` on an unknown state, a missing delegatee for a
 * deferred or delegated stamp, a delegatee supplied for a ratified one, or a
 * date that is not `YYYY-MM-DD`.
 */
export function renderStamp(
  state: DispositionState,
  delegatee: string | null,
  date: string,
): string {
  const spelling = CANONICAL_SPELLING[state];
  if (spelling === undefined) {
    throw new IntentionSchemaError(
      `renderStamp: unknown disposition state "${String(state)}" — expected one of ${DISPOSITION_STATES.join(", ")}`,
    );
  }
  if (!ISO_DATE.test(date)) {
    throw new IntentionSchemaError(`renderStamp: expected a YYYY-MM-DD date, got "${date}"`);
  }
  if (state === "ratified") {
    if (delegatee !== null) {
      throw new IntentionSchemaError(
        `renderStamp: a ratified disposition is the author's own and takes no delegatee, got "${delegatee}" (grammar note H11)`,
      );
    }
    return `(decision: ${spelling}, ${date})`;
  }
  if (delegatee === null || delegatee.trim() === "") {
    throw new IntentionSchemaError(
      `renderStamp: a ${state} disposition must name its delegatee mount id (grammar note H11)`,
    );
  }
  return `(decision: ${spelling}, ${delegatee}, ${date})`;
}

// ---------------------------------------------------------------------------
// Unit 2 — the deferred-disposition queue deriver (liquidates shim (1)).
// See the module header's "deferredQueue LIQUIDATES THE DEFERRED-QUEUE SHIM"
// and "TOLERANT DERIVATION, STRICT PARSER" paragraphs for why this exists and
// why it cannot simply call `source.dispositions` once per node.
// ---------------------------------------------------------------------------

/**
 * A bare `(decision: ...)` parenthetical, used ONLY to find where to cut `text`
 * into per-stamp segments when a whole-text parse throws (`parseTolerant`
 * below). This is deliberately looser than any grammar `source` actually
 * enforces — it exists to locate candidate spans, not to validate them, so it
 * works the same whether `source` is `parseStampGrammar` or a future
 * `review.ts` adapter with a different internal grammar.
 */
const STAMP_SPAN_PATTERN = /\(decision:[^)]*\)/g;

/**
 * Parse `text` for disposition stamps, catching a grammar failure at the
 * FINEST granularity that still keeps every well-formed stamp in `text` —
 * per-stamp, not per-node, per-body, or per-clarification. See the module
 * header for why per-node-or-coarser catching would push `deferredQueue`'s
 * item count below the raw-grep shim it replaces.
 *
 * The common case (every stamp in `text` well-formed) costs exactly one call
 * to `source.dispositions` and returns its records verbatim, `key` ordinals
 * included unchanged — this is the path every existing `parseStampGrammar`
 * test already covers.
 *
 * On a throw, every `(decision: ...)` span in `text` is located (via the
 * looser `STAMP_SPAN_PATTERN`, not the grammar itself) and `text` is cut at
 * the midpoints between consecutive spans, so each segment is guaranteed to
 * contain at most one candidate stamp in full (a segment boundary never lands
 * inside a span, only strictly between two). Each segment is then parsed on
 * its own: a segment that parses contributes its record(s) (re-keyed below,
 * since each segment call restarts `parseStampGrammar`'s own ordinal at 1);
 * a segment that still throws contributes its error message to `errors` and
 * loses nothing else.
 *
 * If `text` throws but contains no `(decision:` span at all, the failure is
 * not a stamp-isolation problem (e.g. an empty `nodeId`/`kind`, which never
 * happens here since both come from an already-validated `IntentionNode`) —
 * the original error is surfaced directly rather than silently swallowed by
 * an empty segment loop.
 */
function parseTolerant(
  source: DispositionSource,
  nodeId: string,
  kind: string,
  text: string,
): { records: DispositionRecord[]; errors: string[] } {
  try {
    return { records: source.dispositions(nodeId, kind, text), errors: [] };
  } catch (wholeErr) {
    const wholeMessage = wholeErr instanceof Error ? wholeErr.message : String(wholeErr);

    const pattern = new RegExp(STAMP_SPAN_PATTERN.source, "g");
    const spans: { start: number; end: number }[] = [];
    let match = pattern.exec(text);
    while (match !== null) {
      spans.push({ start: match.index, end: match.index + match[0].length });
      match = pattern.exec(text);
    }

    if (spans.length === 0) {
      return { records: [], errors: [wholeMessage] };
    }

    const records: DispositionRecord[] = [];
    const errors: string[] = [];
    for (let i = 0; i < spans.length; i++) {
      const current = spans[i];
      const prevEnd = i === 0 ? 0 : spans[i - 1].end;
      const nextStart = i === spans.length - 1 ? text.length : spans[i + 1].start;
      const segStart = i === 0 ? 0 : Math.floor((prevEnd + current.start) / 2);
      const segEnd = i === spans.length - 1 ? text.length : Math.floor((current.end + nextStart) / 2);
      const segment = text.slice(segStart, segEnd);
      try {
        records.push(...source.dispositions(nodeId, kind, segment));
      } catch (segErr) {
        errors.push(segErr instanceof Error ? segErr.message : String(segErr));
      }
    }

    // Re-key in document order over the stamps that actually parsed, so a
    // malformed neighbour skipped above never leaves a gap or a duplicate
    // ordinal in the surviving records' `key` — each segment call restarted
    // `parseStampGrammar`'s own ordinal at 1, so the raw keys collide.
    const reKeyed = records.map((r, idx) => ({ ...r, key: `${nodeId}#${idx + 1}` }));
    return { records: reKeyed, errors };
  }
}

/**
 * The deferred-disposition review queue, derived from the store rather than
 * grepped from it — the liquidation of shim (1); see the module header.
 *
 *  - `items`   — every disposition whose normalized state is `deferred`,
 *                found on a non-`MOUNT_KINDS` node, from either a
 *                clarification answer or the node body.
 *  - `defects` — a mount-kind disposition (never a queue member — mount points
 *                are never doctrine) and every stamp `parseTolerant` could not
 *                parse even in isolation, each as a human-readable string
 *                carrying the node id and, where available, the parser's own
 *                excerpted detail.
 */
export interface DeferredQueue {
  items: DispositionRecord[];
  defects: string[];
}

/**
 * Derive the deferred-disposition queue over the whole store.
 *
 * `bodyById` mirrors `DigestInput.bodies` (`digest.ts`): node id → raw markdown
 * body, from `readNodeBody`. A node absent from `bodyById` is treated as having
 * an empty body rather than throwing — a caller that has not yet read a body
 * for some subset of nodes still gets a queue over what it has, per the
 * tolerant-derivation posture the module header states.
 *
 * Deterministic: nodes are visited in id-sorted order and stamps within a node
 * emit in document order, so two runs over the same `nodes`/`bodyById`/`source`
 * produce byte-identical `items`/`defects` arrays — the same determinism
 * contract `digest.ts:13-15` states. No wall-clock, no environment data.
 *
 * A node's clarification answers and its body are concatenated into one
 * per-node text (clarifications first, in `clarifications[]` order, then the
 * body, each joined by a blank line) before parsing, so a single stamp
 * ordinal sequence covers the whole node and `key`s stay unique per node
 * rather than colliding across two independently-numbered sources. The one
 * cost is that `parseStampGrammar`'s bounded excerpt can, for a stamp within
 * ~70 characters of the clarification/body join point, include a few
 * characters of the other source's text — informational only, since neither
 * `state`, `delegatee`, `date`, nor `key` reads from the excerpt.
 */
export function deferredQueue(
  nodes: readonly IntentionNode[],
  bodyById: ReadonlyMap<string, string>,
  source: DispositionSource,
): DeferredQueue {
  const items: DispositionRecord[] = [];
  const defects: string[] = [];

  const sortedNodes = [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const node of sortedNodes) {
    const isMount = MOUNT_KINDS.some((k) => k === node.kind);
    const body = bodyById.get(node.id) ?? "";
    const corpus = [...node.clarifications.map((c) => c.answer), body].join("\n\n");

    const { records, errors } = parseTolerant(source, node.id, node.kind, corpus);
    for (const message of errors) {
      defects.push(`${node.id} (kind ${node.kind}): ${message}`);
    }
    for (const record of records) {
      if (isMount) {
        defects.push(
          `${node.id} (kind ${node.kind}): disposition ${record.key} found on a MOUNT_KINDS node — ` +
            `mount points are never doctrine, not a queue member — ${record.excerpt}`,
        );
        continue;
      }
      if (record.state === "deferred") {
        items.push(record);
      }
    }
  }

  return { items, defects };
}

// ---------------------------------------------------------------------------
// Unit 5 — one-ruling-one-stamp normalization. See the module header's
// "ONE RULING, ONE STAMP" and "DETECT TOLERANTLY, SPLIT STRICTLY" paragraphs.
// ---------------------------------------------------------------------------

/**
 * An ALL-CAPS ruling label opening a segment of a multi-ruling clarification
 * answer — `DEFERRED-QUEUE SHIM,` or `BOOTSTRAP INITIATION PROTOCOL:`.
 *
 * The shape is the house style for enumerated rulings inside one answer: a
 * capitalized run, optionally several space-separated words, closed by a comma
 * or a colon. Hyphens are admitted inside a word because the live corpus writes
 * `DEFERRED-QUEUE` and `MAIN-QA`. The trailing `[,:]` lookahead is what keeps
 * ordinary emphatic prose (`NOT`, `THIS DOES NOT DELETE`) out: a label
 * introduces a clause, so it is punctuated.
 *
 * This regex is a HEURISTIC, quoted verbatim from the Unit 5 scope so it can be
 * argued with rather than reverse-engineered. It is not doctrine and it is not
 * a grammar the store is validated against.
 */
const RULING_LABEL_PATTERN = /\b[A-Z][A-Z-]{3,}(?:[ ][A-Z][A-Z-]{2,}){0,5}\b(?=[,:])/g;

/** A clarification is a candidate at or above this many DISTINCT labels. */
const MULTI_RULING_MIN_LABELS = 2;

/**
 * ...and at or below this many stamps. A clarification already carrying one
 * stamp per ruling is not the defect; the defect is many rulings under one.
 */
const MULTI_RULING_MAX_STAMPS = 1;

/**
 * The authority covering one ruling segment. `"unknown"` is a REFUSAL — the
 * segment's authority could not be established, so it is routed to the author
 * queue — never a default, and never a fourth disposition state. It is
 * deliberately outside `DispositionState` so it cannot be handed to
 * `consolidationVerdict` by accident.
 */
export type RulingAuthority = DispositionState | "unknown";

/**
 * One ruling segment of a clarification answer.
 *
 *  - `ordinal`   — 1-based, in document order within the answer.
 *  - `label`     — the ALL-CAPS label that opens the segment.
 *  - `start`     — index of the label's first character in the answer.
 *  - `end`       — index one past the segment's last character: the next
 *                  label's `start`, or the answer's length for the last
 *                  segment. Segments therefore tile the answer from the first
 *                  label onward, with no gaps and no overlap.
 *  - `text`      — `answer.slice(start, end)`, the span itself.
 *  - `authority` — the state covering the segment, or `"unknown"`.
 *  - `stamp`     — the record `authority` came from, or `null` when
 *                  `"unknown"`. A stamp INHERITED from the clarification is
 *                  reported here too; `reason` says which case it was.
 *  - `reason`    — why `authority` is what it is, in words a reader can check
 *                  against the answer without re-deriving the rule.
 */
export interface RulingSplit {
  ordinal: number;
  label: string;
  start: number;
  end: number;
  text: string;
  authority: RulingAuthority;
  stamp: DispositionRecord | null;
  reason: string;
}

/** Every `RULING_LABEL_PATTERN` match in `text`, with its offset, in document order. */
function matchRulingLabels(text: string): { label: string; start: number }[] {
  const pattern = new RegExp(RULING_LABEL_PATTERN.source, "g");
  const found: { label: string; start: number }[] = [];
  let match = pattern.exec(text);
  while (match !== null) {
    found.push({ label: match[0], start: match.index });
    match = pattern.exec(text);
  }
  return found;
}

/**
 * The offsets of every `(decision: ...)` span in `text`, in document order.
 *
 * `STAMP_SPAN_PATTERN` and `parseStampGrammar`'s own `STAMP_PATTERN` match the
 * identical span shape, differing only in whether the inner element list is
 * captured, so the i-th span here is the i-th record the parser returns. That
 * pairing is how a positionless `DispositionRecord` is placed inside a segment,
 * and `splitMultiRuling` asserts the two counts agree rather than assuming it.
 */
function stampSpans(text: string): { start: number; end: number }[] {
  const pattern = new RegExp(STAMP_SPAN_PATTERN.source, "g");
  const spans: { start: number; end: number }[] = [];
  let match = pattern.exec(text);
  while (match !== null) {
    spans.push({ start: match.index, end: match.index + match[0].length });
    match = pattern.exec(text);
  }
  return spans;
}

/**
 * THE NORMALIZER. Split one clarification answer into its per-ruling segments,
 * each carrying the label, the text span, and the stamp that currently covers
 * it.
 *
 * It never guesses a NEW authority state. The four cases, exhaustive:
 *
 *   1. the segment carries exactly one stamp   → that stamp's state;
 *   2. the segment carries no stamp, and the clarification carries exactly one
 *      → inherit it (the mis-attribution this unit exists to make visible: one
 *      stamp covering rulings it was never issued for);
 *   3. the segment carries no stamp, and the clarification carries none or more
 *      than one → `"unknown"`;
 *   4. the segment carries more than one stamp → `"unknown"`, because combining
 *      several states into one is a DISPOSITION (that is
 *      `consolidationVerdict`'s job, on a caller's explicit request), not a
 *      split.
 *
 * Cases 3 and 4 are refusals routed to the author queue, per the provenance
 * discipline `consolidationVerdict`'s empty case already states.
 *
 * The signature takes `nodeId` and `kind` alongside the clarification — the
 * plan writes it `splitMultiRuling(clarification)`, but `parseStampGrammar`
 * requires both to name a node in its errors, and inventing placeholders here
 * would put an unfindable node id in a grammar failure.
 *
 * STRICT, by the module header's "DETECT TOLERANTLY, SPLIT STRICTLY": a
 * malformed stamp on the one clarification under normalization throws
 * `IntentionSchemaError` rather than being routed around. Callers sweeping the
 * store want `multiRulingCandidates`, which catches this per clarification.
 *
 * Returns `[]` for an answer carrying no label at all. Text preceding the first
 * label belongs to no segment — this splits rulings, it does not partition the
 * answer, and a caller writing a restatement must carry that preamble itself.
 * Splitting is not restricted to multi-ruling answers; a one-label answer
 * yields one segment.
 */
export function splitMultiRuling(
  nodeId: string,
  kind: string,
  clarification: Clarification,
): RulingSplit[] {
  const answer = clarification.answer;
  const labels = matchRulingLabels(answer);
  if (labels.length === 0) return [];

  const stamps = parseStampGrammar(nodeId, kind, answer);
  const spans = stampSpans(answer);
  if (spans.length !== stamps.length) {
    throw new IntentionSchemaError(
      `splitMultiRuling: ${nodeId} (kind ${kind}) — the stamp grammar read ${stamps.length} stamps ` +
        `where the span finder located ${spans.length}; both walk the same "(decision: ...)" shape ` +
        `and must agree for a stamp to be placed within a segment`,
    );
  }

  const splits: RulingSplit[] = [];
  for (let i = 0; i < labels.length; i++) {
    const start = labels[i].start;
    const end = i === labels.length - 1 ? answer.length : labels[i + 1].start;

    const own: DispositionRecord[] = [];
    for (let s = 0; s < spans.length; s++) {
      if (spans[s].start >= start && spans[s].start < end) own.push(stamps[s]);
    }

    let authority: RulingAuthority;
    let stamp: DispositionRecord | null;
    let reason: string;

    if (own.length === 1) {
      authority = own[0].state;
      stamp = own[0];
      reason = `case 1: the segment carries its own stamp ${own[0].key}`;
    } else if (own.length > 1) {
      authority = "unknown";
      stamp = null;
      reason =
        `case 4: the segment carries ${own.length} stamps (${own.map((r) => r.key).join(", ")}) — ` +
        `combining their states is a disposition, not a split; routed to the author queue`;
    } else if (stamps.length === 1) {
      authority = stamps[0].state;
      stamp = stamps[0];
      reason =
        `case 2: the segment carries no stamp of its own and inherits the clarification's single ` +
        `stamp ${stamps[0].key} — the one-stamp-many-rulings mis-attribution itself`;
    } else {
      authority = "unknown";
      stamp = null;
      reason =
        stamps.length === 0
          ? "case 3: the segment carries no stamp and the clarification carries none to inherit — authority is unknown, treated as binding"
          : `case 3: the segment carries no stamp and the clarification carries ${stamps.length}, so there is no single stamp to inherit — authority is unknown, treated as binding`;
    }

    splits.push({
      ordinal: i + 1,
      label: labels[i].label,
      start,
      end,
      text: answer.slice(start, end),
      authority,
      stamp,
      reason,
    });
  }

  return splits;
}

/**
 * One clarification the detector shortlists.
 *
 *  - `nodeId` / `kind` — the node it was found on.
 *  - `index`      — 0-based position in that node's `clarifications`.
 *  - `key`        — `<nodeId>?<ordinal>`, ordinal 1-based over the node's
 *                   clarifications. Distinct from `DispositionRecord.key`'s
 *                   `#` separator, which numbers stamps rather than
 *                   clarifications, so the two can never be confused when both
 *                   land in one report.
 *  - `question`   — the clarification's question, verbatim.
 *  - `labels`     — the DISTINCT labels, first-occurrence order.
 *  - `stampCount` — `(decision: ...)` spans in the answer, counted by shape
 *                   rather than by the grammar, so a malformed stamp still
 *                   counts as a stamp. This is the count the heuristic tests.
 *  - `splits`     — `splitMultiRuling`'s output, or `[]` when it threw.
 *  - `splitError` — the parser's message when it threw, else `null`.
 *  - `excerpt`    — a bounded, flattened window of the answer, so a reader can
 *                   triage the shortlist without opening the node.
 */
export interface MultiRulingCandidate {
  nodeId: string;
  kind: string;
  index: number;
  key: string;
  question: string;
  labels: string[];
  stampCount: number;
  splits: RulingSplit[];
  splitError: string | null;
  excerpt: string;
}

/**
 * THE DETECTOR. A SHORTLIST FOR HUMAN DISPOSITION, NEVER A DISPOSITION ITSELF —
 * the same posture `tableNearDup` states for itself
 * (`packages/intentionsutil/src/digest.ts`, the NEAR-DUP-STATEMENTS comment).
 * Membership here means "worth a look", not "defective": a clarification may
 * legitimately state several ALL-CAPS terms under one genuinely single ruling,
 * and this function has no way to tell that from the real thing.
 *
 * The heuristic, stated so it can be argued with rather than inferred from the
 * code: a clarification answer is a candidate when it contains at least
 * `MULTI_RULING_MIN_LABELS` DISTINCT `RULING_LABEL_PATTERN` labels and at most
 * `MULTI_RULING_MAX_STAMPS` `(decision: ...)` spans. Both halves matter — many
 * labels with one stamp per ruling is the normalized shape this unit is aiming
 * AT, not the defect.
 *
 * TOLERANT, per the module header: `splitMultiRuling` is attempted per
 * candidate and its `IntentionSchemaError` is caught, so one malformed stamp
 * cannot hide the rest of the store's shortlist. The candidate is still
 * emitted, with the message in `splitError` and `splits` empty.
 *
 * Deterministic: nodes are visited in id-sorted order and clarifications in
 * declaration order, so two sweeps over the same `nodes` produce identical
 * output. No wall-clock, no fs, no environment data.
 */
export function multiRulingCandidates(
  nodes: readonly IntentionNode[],
): MultiRulingCandidate[] {
  const candidates: MultiRulingCandidate[] = [];
  const sortedNodes = [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const node of sortedNodes) {
    for (let i = 0; i < node.clarifications.length; i++) {
      const clarification = node.clarifications[i];
      const answer = clarification.answer;

      const distinct: string[] = [];
      for (const { label } of matchRulingLabels(answer)) {
        if (!distinct.includes(label)) distinct.push(label);
      }
      if (distinct.length < MULTI_RULING_MIN_LABELS) continue;

      const stampCount = stampSpans(answer).length;
      if (stampCount > MULTI_RULING_MAX_STAMPS) continue;

      let splits: RulingSplit[] = [];
      let splitError: string | null = null;
      try {
        splits = splitMultiRuling(node.id, node.kind, clarification);
      } catch (err) {
        splitError = err instanceof Error ? err.message : String(err);
      }

      candidates.push({
        nodeId: node.id,
        kind: node.kind,
        index: i,
        key: `${node.id}?${i + 1}`,
        question: clarification.question,
        labels: distinct,
        stampCount,
        splits,
        splitError,
        excerpt: flattenExcerpt(answer).slice(0, EXCERPT_MAX),
      });
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Unit 7 — the TRIGGER signal: parsimony ranking by read cost. See the module
// header's "THE TRIGGER SIGNAL" paragraph for why this is generic rather than
// `IntentionNode`-shaped.
// ---------------------------------------------------------------------------

/**
 * One unit of read-cost input, generic over whatever corpus is feeding it — a
 * graph node (`id` = node id, `bytes` = body size, `units` = clarification
 * count) or a `.claude/rules/*.md` file (`id` = file path, `bytes` = file
 * size, `units` = `## ` heading count). Deliberately narrow: only the four
 * fields the ranking needs, so a caller building one from its own corpus never
 * has to fabricate fields that mean nothing there.
 *
 *  - `id`         — whatever names the record in its corpus (a node id, a
 *                    file path). Rendered through `renderId` at every table
 *                    render boundary in `digest.ts`, per that module's control-
 *                    character escaping discipline — `consolidationCandidates`
 *                    itself does not escape, since it is a data function, not
 *                    a render boundary.
 *  - `bytes`      — the read cost itself: how much text a reader (human or
 *                    AI) must take in to use this record's full content.
 *  - `units`      — how many discrete pieces that content is already divided
 *                    into (clarifications, headings). Read cost concentrated
 *                    into few units is a stronger consolidation signal than
 *                    the same bytes spread over many, but `units` is carried
 *                    through unranked — see `consolidationCandidates`'s own
 *                    doc comment for why ranking stays bytes-only.
 *  - `latestDate` — `YYYY-MM-DD`, or `null` when the corpus carries no date
 *                    signal (the rules corpus has none).
 */
export interface SizeRecord {
  id: string;
  bytes: number;
  units: number;
  latestDate: string | null;
}

/**
 * One `SizeRecord` promoted to the shortlist, field-for-field identical to its
 * source record. A distinct type from `SizeRecord` (rather than reusing it
 * verbatim) so a caller cannot pass an un-ranked record where a ranked one is
 * expected, and distinct from Unit 5's `MultiRulingCandidate` by name so the
 * two shortlist types are never confused where both are in scope (`digest.ts`
 * imports both).
 */
export interface SizeCandidate {
  id: string;
  bytes: number;
  units: number;
  latestDate: string | null;
}

/** Options narrowing `consolidationCandidates`'s shortlist. */
export interface ConsolidationCandidateOptions {
  /**
   * Drop a record below this many bytes from the shortlist entirely, rather
   * than ranking it at the bottom. Below this size, folding buys negligible
   * read-cost savings — this is a floor on "worth a look", not a display cap
   * (that is `CONSOLIDATION_DEBT_LIMIT` / `MULTI_RULING_LIMIT` in `digest.ts`,
   * a caller-side concern this function does not know about).
   *
   * The comparison is `bytes >= minBytes`, so the default `0` admits EVERY
   * record — a zero-byte one included. That is deliberate (a floor is the
   * caller's judgment, not this function's), but it means a caller that
   * defaults it is not shortlisting: with no floor the "candidate" count is the
   * corpus size and the reported total is the corpus's whole byte count. Pass a
   * floor if the header line is meant to read as debt rather than as inventory.
   */
  minBytes?: number;
}

/**
 * THE TRIGGER SIGNAL. A SHORTLIST FOR HUMAN/AI DISPOSITION, NEVER A
 * DISPOSITION ITSELF — the same posture `tableNearDup` states for itself
 * (`packages/intentionsutil/src/digest.ts`, the NEAR-DUP-STATEMENTS comment)
 * and `multiRulingCandidates` states above. Membership here means "reading
 * this costs a lot relative to how it is divided", not "this is bloated" —
 * a large record may be exactly as long as its subject warrants, and this
 * function has no way to tell that from the read-cost numbers alone.
 *
 * Ranks every `records` entry with `bytes >= opts.minBytes` (default 0) by
 * `bytes` descending, `id` ascending on a tie — bytes-only, deliberately: a
 * ranking that also weighted `units` would need a units-per-byte trade-off
 * this unit does not have a measured basis for, so `units` rides along in
 * each `SizeCandidate` for a reader to judge, rather than being folded into
 * the sort key silently. Never filters or reorders beyond that — capping the
 * shown rows and reporting the graph-wide total are caller concerns
 * (`digest.ts`'s `CONSOLIDATION_DEBT_LIMIT`/`MULTI_RULING_LIMIT`, this CLI's
 * `--corpus rules` mode), not this function's.
 *
 * Deterministic and pure: no fs, no clock, no environment — `records` is the
 * only input, sorted stably (`bytes` desc then `id` asc), so two calls over
 * the same `records` produce byte-identical output. This is what lets both
 * `digest.ts`'s byte-identity contract and `--corpus rules`'s read-only
 * listing rely on it without re-deriving the tie-break rule themselves.
 */
export function consolidationCandidates(
  records: readonly SizeRecord[],
  opts: ConsolidationCandidateOptions = {},
): SizeCandidate[] {
  const minBytes = opts.minBytes ?? 0;
  return records
    .filter((r) => r.bytes >= minBytes)
    .map((r) => ({ id: r.id, bytes: r.bytes, units: r.units, latestDate: r.latestDate }))
    .sort((a, b) => b.bytes - a.bytes || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
