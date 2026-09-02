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
 */
import { IntentionSchemaError } from "./errors.js";

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
