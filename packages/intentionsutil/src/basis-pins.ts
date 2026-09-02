/**
 * Basis pins on intra-graph citations, and the `stale-intent` arm of the
 * reconciliation frontier.
 *
 * THE RULE, ALREADY STATED, EXTENDED HERE. `.claude/skills/ref-diagnosis-time-cas/SKILL.md`
 * states it by SHAPE and not by caller class: "any caller that makes a decision
 * from a read of a node and later writes that node must capture the blob at the
 * deciding read and pin it through `--base`". That reference's canonical
 * instance is a park/clear-park write racing a fleet write — machine state,
 * minutes wide. This module extends the same shape ACROSS THE INTENT LAYER,
 * where the window is months wide and the "later write" is a human amendment:
 * a disposition that cites another disposition decided from a read of it, and
 * an amendment to the cited text silently invalidates the citing one. The
 * ratified criterion (`strategy-graph-integrity`, 2026-09-01) is that an
 * amendment to ratified content DERIVES a stale-intent frontier — "every
 * disposition, citation, or authority reference whose recorded basis rests on
 * the amended text" — rather than leaving the fallout for ad-hoc review. The
 * mechanism was delegated in that same ruling: "basis pins on intra-graph
 * citations, generalizing the two ratified pin machines — assessment basis pins
 * and tactic-plan strategy fingerprints — to disposition-to-disposition
 * references". This module is that generalization, and nothing here re-derives
 * the rule.
 *
 * READ-ONLY, LIKE `grounding.ts`. This module never WRITES a pin. Pinning at
 * authoring time belongs to the align skill family — the actor that made the
 * deciding read is the only actor that knows what it decided from — exactly as
 * `grounding.ts` reads marks it never writes ("marks are author-side"). An
 * EMPTY pin corpus therefore yields an EMPTY arm, and that is the honest
 * bootstrap reading rather than a hole: an unpinned citation is invisible to
 * this deriver by construction, and making it visible is a writer's job.
 *
 * PURE. No fs, no process, no clock — `node:crypto` only, for the same reason
 * `criteria.ts` imports it. `IntentionNode[]` arrives as an argument. This
 * module is therefore NOT on the browser-safe `graph.ts` barrel (`node:`
 * builtins are banned there, asserted by `test/graph.test.ts`); it rides the
 * root `index.ts` barrel beside `criteria.ts` and `frontier-reconciliation.ts`.
 *
 * THE ENTRY TYPE IS IMPORTED TYPE-ONLY, and deliberately: `frontier-reconciliation.ts`
 * imports `deriveStaleIntent` as a VALUE to wire the arm, so a value import back
 * the other way would close a runtime cycle. A `import type` is erased at
 * compile time, so the dependency is one-directional at runtime — the same
 * discipline `criteria.ts`'s header records for its `schema.ts` type import.
 *
 * --- THE ADDRESSING SCHEME ---------------------------------------------------
 *
 * A pin's `cites` is a DISPOSITION REFERENCE, spelled
 *
 *     <node-id>#<selector>
 *
 * split at the FIRST `#` (a `#` may legitimately appear inside a selector key —
 * a clarification question — and never inside a node id, which doubles as a
 * filename). Six selectors, each chosen because it resolves against a shape the
 * store ACTUALLY holds today rather than one this module wishes existed:
 *
 *   - `clarification:<question>` — the entry of `clarifications` whose
 *     `question` matches exactly. This is the primary unit: a clarification IS
 *     a recorded disposition in this graph ("(decision: ratified …)"), the
 *     align dialectic amends entries BY QUESTION, and question text is the only
 *     key the shape carries. Positional addressing was rejected: the log is
 *     appended to and folded, so an index names a different disposition after
 *     any consolidation.
 *   - `criterion:<id>` — an entry of `attributes.criteria`, or of
 *     `attributes.standing_criteria` on the node that homes it. Criteria carry
 *     an explicit stable id (`criteria.ts`), so this is the one selector with a
 *     purpose-built key. A pin cites the criterion where it is AUTHORED, never
 *     where it is projected in force: `effectiveCriteria` derives the union on
 *     read and stores no copy, so there is no other place to cite.
 *   - `statement` — the node's one-sentence intention.
 *   - `rationale` — the node's recorded why.
 *   - `conditions` — `attributes.conditions`, the WHOLE list. Conditions are
 *     free prose with no per-item key, so no stable per-item address exists;
 *     the list is cited as one unit and any edit to any item moves the hash.
 *     (This is the legacy carrier migrating into assumption-class criteria per
 *     `kind-kind` refinement 7; a pin on the migrated form uses
 *     `criterion:<id>` and gets per-item resolution for free.)
 *   - `node` — the node's whole INTENT substance, for a citation that rests on
 *     the node as a whole rather than on one disposition in it.
 *
 * WHAT IS HASHED, AND WHY A PHASE TRANSITION MUST NOT MOVE IT. `dispositionHash`
 * builds an explicit substance object in a fixed field order, `JSON.stringify`s
 * it and sha256s it — the recipe SHAPE copied from `strategyFingerprint`
 * (`router.ts`) and `criteriaFingerprint` (`criteria.ts`), so the repo carries
 * one hashing convention rather than three. The allowlist is the load-bearing
 * half: every state field a machine writes — `phase`, `execution`, `status`,
 * `reading`, `office_hours`, `attention`, `rounds`, `attempts`, markers — is
 * ABSENT from every substance object, so a dispatch transition, a park, a
 * sensor reading or a review marker CANNOT invalidate an intent citation. A
 * hash that moved on a phase transition would report the whole graph stale
 * every tick, which is worse than reporting nothing: the arm would be ignored
 * within a day. Only intent-class content moves it.
 *
 * The reference string itself is hashed ALONGSIDE the substance, so two
 * selectors that happen to resolve to identical text (a statement equal to a
 * clarification answer; the same criterion authored on two nodes) never alias
 * to one hash.
 */
import { createHash } from "node:crypto";
import {
  STANDING_CRITERIA_KEY,
  parseCriteria,
  validateStandingCriteriaList,
  type Criterion,
} from "./criteria.js";
import { IntentionSchemaError } from "./errors.js";
import type { ReconciliationFrontierEntry } from "./frontier-reconciliation.js";
import type { IntentionNode } from "./schema.js";

/** The attributes key carrying a node's basis pins. Valid on any node. */
export const BASIS_PINS_KEY = "basis_pins";

/** The closed key set of a basis pin. Order is the canonical field order. */
export const BASIS_PIN_KEYS: readonly string[] = ["cites", "hash", "pinned_at"];

/**
 * One basis pin: "when this node's disposition was decided, the cited
 * disposition read exactly this".
 *
 * `hash` is a `dispositionHash` of `cites` as it stood at the deciding read,
 * lowercase hex. `pinned_at` (`YYYY-MM-DD`) is the date of that read — it is
 * provenance for a human triaging the entry, never an input to the comparison.
 */
export interface BasisPin {
  /** `<node-id>#<selector>` — the cited disposition. */
  cites: string;
  /** sha256 hex of the cited disposition's substance at the deciding read. */
  hash: string;
  /** `YYYY-MM-DD` — when the deciding read happened. */
  pinned_at: string;
}

/**
 * The selector kinds a disposition reference may name, in the order the header
 * documents them. Closed: an unknown selector is a malformed reference, not a
 * future extension to tolerate silently.
 */
export const DISPOSITION_SELECTORS = [
  "clarification",
  "criterion",
  "statement",
  "rationale",
  "conditions",
  "node",
] as const;

export type DispositionSelector = (typeof DISPOSITION_SELECTORS)[number];

/** The two selectors that take a key after a `:`; the other four are bare. */
const KEYED_SELECTORS: readonly DispositionSelector[] = ["clarification", "criterion"];

/** A parsed `cites` string. `key` is null for the four bare selectors. */
export interface DispositionRef {
  /** The id of the node holding the cited disposition. */
  node: string;
  selector: DispositionSelector;
  /** The clarification question or criterion id, or null for a bare selector. */
  key: string | null;
}

// --- Local guards -----------------------------------------------------------
// Same throw-`IntentionSchemaError`-naming-the-field idiom `criteria.ts` and
// `operational-records.ts` use. Re-implemented rather than imported for the
// reason `criteria.ts`'s header gives: `schema.ts` must not become a value
// dependency of a module the schema layer itself reaches.

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new IntentionSchemaError(`Expected string for ${field}, got ${typeof value}`);
  }
  if (value.trim() === "") {
    throw new IntentionSchemaError(`Expected non-empty string for ${field}`);
  }
  return value;
}

/** Shape only, as `criteria.ts` does — calendar validity is not this layer's job. */
function requireDateString(value: unknown, field: string): string {
  const s = requireNonEmptyString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new IntentionSchemaError(`Expected YYYY-MM-DD date string for ${field}, got "${s}"`);
  }
  return s;
}

/** sha256 hex, lowercase — what `dispositionHash` emits and the only thing comparable to it. */
const SHA256_HEX = /^[0-9a-f]{64}$/;

// --- Reference parsing ------------------------------------------------------

/**
 * Parse a `cites` string into its node id and selector.
 *
 * THROWS on a malformed reference rather than treating it as dangling. The two
 * failures are different in kind and must stay distinguishable: a reference
 * that does not PARSE is a misconfigured pin (nothing could ever satisfy it),
 * while a reference that parses but does not RESOLVE is a real frontier item
 * — a citation whose target moved or was deleted, which is exactly what this
 * arm exists to report (`.claude/rules/code-style.md`: a clear error, never a
 * fallback that buries one shape inside the other).
 */
export function parseDispositionRef(cites: string, field = "cites"): DispositionRef {
  const at = cites.indexOf("#");
  if (at <= 0 || at === cites.length - 1) {
    throw new IntentionSchemaError(
      `Malformed disposition reference in ${field}: "${cites}" — expected ` +
        `<node-id>#<selector>, split at the first "#", with both halves non-empty ` +
        `(selectors: ${DISPOSITION_SELECTORS.join(", ")})`,
    );
  }
  const node = cites.slice(0, at);
  const rest = cites.slice(at + 1);
  const colon = rest.indexOf(":");
  const name = colon === -1 ? rest : rest.slice(0, colon);
  const key = colon === -1 ? null : rest.slice(colon + 1);
  const selector = DISPOSITION_SELECTORS.find((s) => s === name);
  if (selector === undefined) {
    throw new IntentionSchemaError(
      `Unknown disposition selector "${name}" in ${field}: "${cites}" (expected one of ` +
        `${DISPOSITION_SELECTORS.join(", ")})`,
    );
  }
  const keyed = KEYED_SELECTORS.includes(selector);
  if (keyed && (key === null || key.trim() === "")) {
    throw new IntentionSchemaError(
      `Disposition selector "${selector}" in ${field}: "${cites}" requires a key — ` +
        `spell it ${selector}:<${selector === "criterion" ? "criterion id" : "question"}>`,
    );
  }
  if (!keyed && key !== null) {
    throw new IntentionSchemaError(
      `Disposition selector "${selector}" in ${field}: "${cites}" takes no key, but ` +
        `":${key}" follows it — only ${KEYED_SELECTORS.join(" and ")} are keyed`,
    );
  }
  return { node, selector, key };
}

/** Render a parsed reference back to its `cites` spelling. Round-trips exactly. */
export function formatDispositionRef(ref: DispositionRef): string {
  const selector = ref.key === null ? ref.selector : `${ref.selector}:${ref.key}`;
  return `${ref.node}#${selector}`;
}

// --- Pin validation ---------------------------------------------------------

/**
 * Validate one basis pin, returning it normalized (canonical field order).
 *
 * REJECT, DON'T IGNORE, exactly as `criteria.ts` does: a pin decides whether a
 * disposition is reported stale, so a smuggled field — a status, a waiver, a
 * hand-stored verdict — must not ride along unread.
 */
export function validateBasisPin(value: unknown, field = "basis_pin"): BasisPin {
  if (!isPlainRecord(value)) {
    throw new IntentionSchemaError(
      `Expected a {${BASIS_PIN_KEYS.join(", ")}} object for ${field}, got ${
        value === null ? "null" : Array.isArray(value) ? "an array" : typeof value
      }`,
    );
  }
  for (const key of Object.keys(value)) {
    if (!BASIS_PIN_KEYS.includes(key)) {
      throw new IntentionSchemaError(
        `Unknown key ${field}.${key}: the basis-pin shape is closed, so no unread field ` +
          `can ride along on data that decides whether a disposition is stale ` +
          `(allowed: ${BASIS_PIN_KEYS.join(", ")})`,
      );
    }
  }
  const cites = requireNonEmptyString(value.cites, `${field}.cites`);
  parseDispositionRef(cites, `${field}.cites`);
  const hash = requireNonEmptyString(value.hash, `${field}.hash`);
  if (!SHA256_HEX.test(hash)) {
    throw new IntentionSchemaError(
      `Expected a lowercase sha256 hex digest for ${field}.hash, got "${hash}" — a pin whose ` +
        `hash cannot be one this graph produced would report its citation stale forever`,
    );
  }
  return { cites, hash, pinned_at: requireDateString(value.pinned_at, `${field}.pinned_at`) };
}

/**
 * Validate an array of pins, rejecting two pins on the SAME citation: two
 * recorded bases for one reference contradict each other, and nothing can rule
 * which read the citing disposition was actually decided from.
 */
export function validateBasisPinList(value: unknown, field: string): BasisPin[] {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(
      `Expected an array of basis pins for ${field}, got ${value === null ? "null" : typeof value}`,
    );
  }
  const pins = value.map((entry, i) => validateBasisPin(entry, `${field}[${i}]`));
  const seen = new Set<string>();
  for (const pin of pins) {
    if (seen.has(pin.cites)) {
      throw new IntentionSchemaError(
        `Duplicate basis pin for "${pin.cites}" in ${field}: two recorded bases for one ` +
          `citation contradict each other, and neither can be ruled the deciding read`,
      );
    }
    seen.add(pin.cites);
  }
  return pins;
}

/**
 * A node's basis pins, from `attributes.basis_pins`, in authored order.
 *
 * Absence yields `[]` — almost every node predates pinning, which is not a
 * defect. A malformed VALUE throws rather than degrading to `[]`: an unreadable
 * pin list would silently drop every citation it carries off the frontier,
 * which is the one output this surface must never produce.
 */
export function parseBasisPins(node: IntentionNode): BasisPin[] {
  const raw = node.attributes[BASIS_PINS_KEY];
  if (raw === undefined || raw === null) return [];
  return validateBasisPinList(raw, `${node.id}: attributes.${BASIS_PINS_KEY}`);
}

// --- The hash ---------------------------------------------------------------

/**
 * The criteria AUTHORED on a node: its own `attributes.criteria` plus, on the
 * node that homes it, `attributes.standing_criteria`.
 *
 * NOT `effectiveCriteria`. That projects the standing set onto every strategy
 * on read; a pin must cite the criterion where it is authored, or the same
 * criterion would be addressable under a hundred node ids and an amendment
 * would have to invalidate all of them. Own criteria are searched first, so a
 * node carrying both keys with one id in each resolves to its own entry —
 * `validateGraph` rule 28 already bans the standing key off its one home, so
 * that collision cannot exist on a valid graph.
 */
function authoredCriteria(node: IntentionNode): Criterion[] {
  const own = parseCriteria(node);
  const standing = node.attributes[STANDING_CRITERIA_KEY];
  if (standing === undefined || standing === null) return own;
  return [
    ...own,
    ...validateStandingCriteriaList(standing, `${node.id}: attributes.${STANDING_CRITERIA_KEY}`),
  ];
}

/**
 * The cited disposition's SUBSTANCE, or `null` when the reference does not
 * resolve against this node.
 *
 * Every branch builds an explicit object — never `node` itself, never a spread
 * — so a field added to `IntentionNode` cannot join the hash by accident. That
 * is the property the whole arm rests on: a machine-written state field must
 * never move an intent hash.
 */
function dispositionSubstance(node: IntentionNode, ref: DispositionRef): unknown {
  switch (ref.selector) {
    case "statement":
      return node.statement;
    case "rationale":
      // `null` here IS the unresolved signal: an unrecorded rationale is not an
      // empty one — there is nothing to cite, so the citation is dangling.
      return node.rationale;
    case "conditions": {
      const conditions = node.attributes.conditions;
      return conditions === undefined || conditions === null ? null : conditions;
    }
    case "clarification": {
      const matches = node.clarifications.filter((c) => c.question === ref.key);
      // Two entries under one question is an ambiguous citation, and guessing
      // which was cited is worse than reporting the reference unresolved.
      if (matches.length !== 1) return null;
      return { question: matches[0].question, answer: matches[0].answer };
    }
    case "criterion": {
      const criterion = authoredCriteria(node).find((c) => c.id === ref.key);
      if (criterion === undefined) return null;
      // Rebuilt in CRITERION_KEYS order, so a key reordering in the source YAML
      // does not move the hash — `criteriaFingerprint`'s rule, restated.
      return {
        id: criterion.id,
        statement: criterion.statement,
        class: criterion.class,
        authority: criterion.authority,
        recorded: criterion.recorded,
      };
    }
    case "node":
      // The intent-class allowlist. `strategyFingerprint`'s six fields plus
      // `rationale` and `criteria`, both intent-class per `kind-kind`'s
      // `field_write_class` map and both genuinely part of what a citation to
      // "this node" rests on. `strategyFingerprint` itself is NOT changed and
      // NOT called: it is the tactic-freeze signal, deliberately narrower, and
      // widening it would re-freeze in-flight tactics for a reason that has
      // nothing to do with their scope.
      return {
        statement: node.statement,
        rationale: node.rationale,
        clarifications: node.clarifications.map((c) => ({
          question: c.question,
          answer: c.answer,
        })),
        // Rebuilt in CRITERION_KEYS order, exactly as the `criterion:` branch
        // above does, so a key reordering in the source YAML does not move
        // this hash either. Passing the RAW `attributes.criteria` here would
        // make the two selectors disagree about the same content and report a
        // no-op reorder as stale intent.
        criteria: parseCriteria(node).map((c) => ({
          id: c.id,
          statement: c.statement,
          class: c.class,
          authority: c.authority,
          recorded: c.recorded,
        })),
        conditions: node.attributes.conditions ?? null,
        serves: [...node.serves].sort(),
        success_signal: node.success_signal,
        tooling_goals: node.tooling_goals.map((g) => ({ kind: g.kind, statement: g.statement })),
      };
  }
}

/**
 * THE HASH: sha256 hex over the canonical JSON of `{ cites, substance }`.
 *
 * `dispositionId` is the full `cites` reference, and it must name `node` — a
 * caller hashing one node's disposition against another node's content is a
 * programming error, not a graph defect, so it throws rather than resolving to
 * something.
 *
 * @throws IntentionSchemaError when the reference is malformed, when it names a
 *   different node, or when it does not resolve on this node. The last is
 *   deliberate: "the hash of a disposition that is not there" has no answer,
 *   and `deriveStaleIntent` reports that case as a frontier entry instead of
 *   asking for it.
 */
export function dispositionHash(node: IntentionNode, dispositionId: string): string {
  const ref = parseDispositionRef(dispositionId);
  if (ref.node !== node.id) {
    throw new IntentionSchemaError(
      `Disposition reference "${dispositionId}" names node "${ref.node}", but it was passed ` +
        `node "${node.id}" — a hash is only meaningful against the node the reference names`,
    );
  }
  const substance = dispositionSubstance(node, ref);
  if (substance === null) {
    throw new IntentionSchemaError(
      `Disposition reference "${dispositionId}" does not resolve on ${node.id} — there is no ` +
        `such ${ref.selector} to hash`,
    );
  }
  return createHash("sha256")
    .update(JSON.stringify({ cites: formatDispositionRef(ref), substance }))
    .digest("hex");
}

// --- The arm ----------------------------------------------------------------

/**
 * THE `stale-intent` ARM: every basis pin whose cited disposition no longer
 * reads as it did at the deciding read.
 *
 * Three shapes, all of them one entry — a citation that cannot be checked is
 * exactly as stale as one that fails the check, and a silent skip would let a
 * deleted node quietly retire the citations that rested on it:
 *
 *  - DANGLING NODE — `cites` names a node the store does not hold.
 *  - DANGLING DISPOSITION — the node is there, the disposition is not (a folded
 *    clarification, a renamed criterion, a rationale cleared), or two
 *    clarifications now answer the same question and the reference is ambiguous.
 *  - MISMATCH — both resolve, and the recomputed hash differs from the pin.
 *
 * READ-ONLY: nothing here writes a pin, refreshes one, or mutates a node.
 * Reconciling an entry is an authoring act — re-read the amended text, decide
 * whether the citing disposition still holds, then amend it and re-pin — and a
 * deriver that silently re-pinned would erase the very question it exists to
 * raise.
 *
 * Deterministic: nodes are visited in id order and each node's pins in authored
 * order, so two readings of an unchanged graph emit the same entries in the
 * same order (the frontier deriver re-sorts anyway; this makes the arm stable
 * on its own).
 *
 * @throws IntentionSchemaError when a pin list is malformed, or when a cited
 *   node's criteria list is malformed. Both are misconfiguration; neither
 *   degrades to a smaller frontier.
 */
export function deriveStaleIntent(
  nodes: readonly IntentionNode[],
): ReconciliationFrontierEntry[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const entries: ReconciliationFrontierEntry[] = [];
  const citing = [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const node of citing) {
    for (const pin of parseBasisPins(node)) {
      const ref = parseDispositionRef(pin.cites, `${node.id}: attributes.${BASIS_PINS_KEY}.cites`);
      const cited = byId.get(ref.node);
      if (cited === undefined) {
        entries.push(
          entry(
            node,
            pin,
            `no node "${ref.node}" is in the store — a citation whose target is gone is ` +
              `stale by definition`,
            null,
          ),
        );
        continue;
      }
      const substance = dispositionSubstance(cited, ref);
      if (substance === null) {
        entries.push(
          entry(
            node,
            pin,
            `${ref.node} carries no ${ref.selector}${ref.key === null ? "" : ` "${ref.key}"`} ` +
              `— the cited disposition was folded, renamed or removed`,
            null,
          ),
        );
        continue;
      }
      const current = dispositionHash(cited, pin.cites);
      if (current === pin.hash) continue;
      const criterion =
        ref.selector === "criterion"
          ? (authoredCriteria(cited).find((c) => c.id === ref.key) ?? null)
          : null;
      entries.push(
        entry(
          node,
          pin,
          `the cited disposition was amended since ${pin.pinned_at}: pinned ${pin.hash}, ` +
            `now ${current}`,
          criterion,
        ),
      );
    }
  }
  return entries;
}

/**
 * One `stale-intent` entry.
 *
 * SUBJECT is the CITING node — the node holding a disposition that may no
 * longer be supported is what a reader has to act on; the cited disposition is
 * named in the id and the detail. The criterion/authority join is populated
 * only for a `criterion:` reference that still resolves: an entry claiming a
 * join to a criterion that is gone would be invented provenance, which the
 * entry type's nullable fields exist to avoid.
 */
function entry(
  citing: IntentionNode,
  pin: BasisPin,
  detail: string,
  criterion: Criterion | null,
): ReconciliationFrontierEntry {
  return {
    kind: "stale-intent",
    id: `stale-intent:${citing.id}:${pin.cites}`,
    subject: citing.id,
    detail: `cites ${pin.cites} — ${detail}`,
    criterion: criterion === null ? null : criterion.id,
    authority: criterion === null ? null : criterion.authority,
  };
}
