// Pure, fs-free three-way field-level merge of two divergent edits to the same
// intention node. A later unit wires this into graph-commit so two concurrent
// writers touching DIFFERENT frontmatter fields (or the same field identically)
// auto-resolve instead of failing closed on a git rebase conflict. Genuine
// same-field divergences are reported as conflicts, and the merged node still
// takes a landable value (theirs) so the caller can decide policy.
//
// No fs/git/network here — all file I/O lives in scripts/merge-node.ts. This
// module operates only on already-parsed { node, body } triples.

import type { IntentionNode } from "./schema.js";
import { isPlainObject } from "./schema.js";

/** A single field that diverged on both sides and could not be auto-resolved. */
export interface FieldConflict {
  field: string;
  ours: unknown;
  theirs: unknown;
}

/** The outcome of a three-way merge. `merged` is always landable (a valid node
 * shape); `conflicts` lists the fields where ours and theirs genuinely
 * disagreed (merged took theirs for each). `body` is the merged markdown body. */
export interface MergeResult {
  merged: IntentionNode;
  body: string;
  conflicts: FieldConflict[];
}

/**
 * The top-level IntentionNode fields merged by the base-aware three-way list
 * rule: an entry dropped by exactly one side relative to `base` stays dropped,
 * and an entry only one side has that `base` never had is a genuine addition
 * and is kept. With no `base` the rule degrades to a dedup-append union of
 * theirs then ours. `attributes.conditions` follows the same rule but is
 * handled key-by-key inside `attributes` (not listed here).
 */
export const LIST_FIELDS = [
  "serves",
  "recovers",
  "clarifications",
  "tooling_goals",
  "validates",
  "blocked_by",
  "superseded_by",
] as const satisfies readonly (keyof IntentionNode)[];

/**
 * Top-level scalar/object fields merged by the three-way scalar rule. Every
 * IntentionNode field that is neither a LIST_FIELD nor `attributes` (which is
 * merged key-by-key). The synthetic pseudo-field `body` is merged by the same
 * rule but handled separately since it is not an IntentionNode key.
 *
 * These two lists must between them name EVERY `keyof IntentionNode` except
 * `attributes`. A field missing from both is not merged at all: `merged` starts
 * as a shallow clone of `theirs`, so the omitted field silently takes theirs'
 * value and reports no conflict — ours' edit to it is lost with nothing to
 * park on. Adding a field to `IntentionNode` therefore means adding it here.
 */
const SCALAR_FIELDS = [
  "id",
  "kind",
  "statement",
  "owner",
  "status",
  "parent",
  "rationale",
  "reading",
  "success_signal",
  "attention",
  "phase",
  "execution",
  "supersession_expiry",
  "office_hours",
  "pace_exempt",
  "rounds",
] as const satisfies readonly (keyof IntentionNode)[];

/**
 * Compile-time exhaustiveness probe over the two field lists above, in the same
 * spirit as `schema.ts`'s `FIRST_CLASS_FIELD_PROBE`: the object literal is
 * `Record<never, never>` exactly when every `keyof IntentionNode` other than
 * `attributes` is named by `LIST_FIELDS` or `SCALAR_FIELDS`. Add a field to
 * `IntentionNode` and forget it here, and this line stops compiling with the
 * missing name in the error — instead of the merge silently taking theirs'
 * value for it and reporting no conflict.
 */
type UnmergedNodeField = Exclude<
  keyof IntentionNode,
  (typeof LIST_FIELDS)[number] | (typeof SCALAR_FIELDS)[number] | "attributes"
>;
const MERGE_FIELD_COVERAGE_PROBE: Record<UnmergedNodeField, never> = {};
void MERGE_FIELD_COVERAGE_PROBE;

/**
 * Recursive structural deep-equality. Order-INDEPENDENT for plain-object keys
 * (a YAML round-trip can reorder object keys, so key order is not substance),
 * order-DEPENDENT for arrays (list order is meaningful — e.g. clarifications
 * carry dialectic sequence). Deliberately NOT `JSON.stringify`-based: two
 * semantically identical objects can serialize with different key order and
 * produce a false conflict.
 */
export function eq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!eq(a[i], b[i])) return false;
    }
    return true;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!eq(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

/** Union of two lists preserving `theirs` order first, then `ours` novel
 * entries in `ours` order, deduped by structural `eq`. Deterministic and
 * base-free — retained only for the no-common-ancestor path of `threeWayList`,
 * where a removal genuinely cannot be told apart from an addition and keeping
 * every entry is the correct answer. Do not call it directly for a merge that
 * has a base: base-free union is what silently restored deleted entries. */
function unionList(theirs: unknown[], ours: unknown[]): unknown[] {
  const out: unknown[] = [];
  const pushNovel = (item: unknown): void => {
    if (!out.some((existing) => eq(existing, item))) out.push(item);
  };
  for (const item of theirs) pushNovel(item);
  for (const item of ours) pushNovel(item);
  return out;
}

/**
 * Base-aware three-way list merge — the rule that makes a REMOVAL expressible.
 *
 * Per candidate entry, using structural `eq` for every membership test:
 *
 *   | in base | in ours | in theirs | outcome                        |
 *   |---------|---------|-----------|--------------------------------|
 *   | any     | yes     | yes       | keep                           |
 *   | yes     | yes     | no        | theirs removed it -> drop      |
 *   | no      | yes     | no        | ours added it -> keep          |
 *   | yes     | no      | yes       | ours removed it -> drop        |
 *   | no      | no      | yes       | theirs added it -> keep        |
 *   | yes     | no      | no        | both removed it -> drop        |
 *
 * With `baseList === null` there is no common ancestor, so a removal and an
 * addition are indistinguishable and this falls back to `unionList`. That is
 * the correct answer for an add/add merge, not a fallback hiding an error;
 * `scripts/merge-node.ts` deliberately synthesizes exactly that case.
 *
 * NEVER reports a conflict, by design. Entries are plain id strings, or objects
 * with no stable identity key, so a per-entry "modify" is not representable —
 * an edit is a remove plus an add. Residual: when both sides edit the SAME
 * object entry differently, the base version drops (both sides removed it) and
 * both new variants are kept, which leaves a visible duplicate a reader can
 * fix rather than a silent restoration. Conflicting here instead would turn
 * routine satisfied-`blocked_by` cleanup under contention into a park, which
 * is the outcome this rule exists to avoid.
 *
 * Ordering matches `unionList`: `theirs` in order first, then `ours`' novel
 * entries, deduped by `eq`, with dropped entries filtered out.
 */
function threeWayList(
  baseList: unknown[] | null,
  oursList: unknown[],
  theirsList: unknown[],
): unknown[] {
  if (baseList === null) return unionList(theirsList, oursList);
  // Bind post-guard so the non-null narrowing survives into the closures below.
  const baseEntries = baseList;
  const has = (list: unknown[], item: unknown): boolean =>
    list.some((existing) => eq(existing, item));
  const keep = (item: unknown): boolean => {
    if (has(oursList, item) && has(theirsList, item)) return true;
    // On exactly one side: absent from base means that side added it (keep);
    // present in base means the other side deleted it (drop).
    return !has(baseEntries, item);
  };
  const out: unknown[] = [];
  const pushNovel = (item: unknown): void => {
    if (!out.some((existing) => eq(existing, item))) out.push(item);
  };
  for (const item of theirsList) if (keep(item)) pushNovel(item);
  for (const item of oursList) if (keep(item)) pushNovel(item);
  return out;
}

/**
 * Three-way scalar merge of a single field value. Returns either a resolved
 * value or a conflict marker. When `base` is null (id absent on the base side),
 * the base-comparison legs are skipped and only the collapse-or-conflict check
 * of ours vs theirs applies.
 */
function scalarMerge(
  field: string,
  hasBase: boolean,
  baseVal: unknown,
  oursVal: unknown,
  theirsVal: unknown,
): { value: unknown; conflict: FieldConflict | null } {
  if (hasBase) {
    if (eq(oursVal, baseVal)) return { value: theirsVal, conflict: null }; // ours unchanged → take theirs
    if (eq(theirsVal, baseVal)) return { value: oursVal, conflict: null }; // theirs unchanged → take ours
  }
  if (eq(oursVal, theirsVal)) return { value: theirsVal, conflict: null }; // identical edit collapse
  // Genuine divergence: merged takes theirs (always landable) and reports it.
  return { value: theirsVal, conflict: { field, ours: oursVal, theirs: theirsVal } };
}

/**
 * Three-way field-level merge of two divergent edits to the same node.
 *
 *  - List fields (`LIST_FIELDS`) get the base-aware three-way list rule: an
 *    entry dropped by exactly one side relative to `base` stays dropped, an
 *    entry `base` never had is a genuine addition and is kept, and with no
 *    `base` it degrades to a theirs+ours union-dedup. Never conflicts.
 *  - `attributes` is merged key-by-key: `conditions` gets the same list rule;
 *    every other key gets the scalar rule. A key present on only one side is a
 *    pure addition when `base` lacks it, and the other side's deletion when
 *    `base` has it — a deletion racing a modification is the one conflict the
 *    attributes merge reports.
 *  - Every other field (plus the synthetic `body`) gets the three-way scalar
 *    rule. `merged` always carries a landable value even for conflicted fields.
 */
export function mergeIntentionNodes(
  base: { node: IntentionNode; body: string } | null,
  ours: { node: IntentionNode; body: string },
  theirs: { node: IntentionNode; body: string },
): MergeResult {
  const conflicts: FieldConflict[] = [];
  const hasBase = base !== null;
  // Start from a shallow clone of theirs — it supplies the fallback for every
  // conflicted field and the baseline shape for keys we then overwrite.
  const merged: IntentionNode = { ...theirs.node };
  // Generic field-by-field assignment below needs a string-keyed view; no
  // single static key type applies across heterogeneous keyof IntentionNode
  // keys (and the dotted "attributes.<key>" pseudo-keys further down).
  const mergedRec = merged as unknown as Record<string, unknown>; // type-safety-ok: generic dynamic-key assignment target, see comment above

  // List fields: base-aware three-way, so a removal by either side is honored
  // instead of being restored by a base-free union.
  for (const field of LIST_FIELDS) {
    const theirsList = theirs.node[field] as unknown[]; // type-safety-ok: field ranges over keyof IntentionNode, but LIST_FIELDS restricts it to array-typed keys at runtime
    const oursList = ours.node[field] as unknown[]; // type-safety-ok: same LIST_FIELDS array-typed-key invariant as theirsList above
    const baseList = base ? (base.node[field] as unknown[]) : null; // type-safety-ok: same LIST_FIELDS array-typed-key invariant; null when there is no common ancestor
    mergedRec[field] = threeWayList(baseList, oursList, theirsList);
  }

  // Scalar/object top-level fields.
  for (const field of SCALAR_FIELDS) {
    const { value, conflict } = scalarMerge(
      field,
      hasBase,
      base ? base.node[field] : undefined,
      ours.node[field],
      theirs.node[field],
    );
    mergedRec[field] = value;
    if (conflict) conflicts.push(conflict);
  }

  // attributes: merge key-by-key. `allKeys` is ours + theirs only, so a key
  // both sides deleted is already correctly absent. For a key on exactly one
  // side, `base` decides whether it is that side's addition or the other
  // side's deletion.
  const baseAttrs = base ? base.node.attributes : {};
  const oursAttrs = ours.node.attributes;
  const theirsAttrs = theirs.node.attributes;
  const mergedAttrs: Record<string, unknown> = {};
  const allKeys = new Set<string>([
    ...Object.keys(oursAttrs),
    ...Object.keys(theirsAttrs),
  ]);
  for (const key of allKeys) {
    const inOurs = Object.prototype.hasOwnProperty.call(oursAttrs, key);
    const inTheirs = Object.prototype.hasOwnProperty.call(theirsAttrs, key);
    const inBase = hasBase && Object.prototype.hasOwnProperty.call(baseAttrs, key);
    if (inOurs && !inTheirs) {
      // Not in base (or no base at all) — ours added it, so keep it.
      if (!inBase) {
        mergedAttrs[key] = oursAttrs[key]; // ours-only addition
        continue;
      }
      // In base — theirs deleted it. Honor the deletion when ours left the
      // value untouched.
      if (eq(baseAttrs[key], oursAttrs[key])) continue;
      // Delete-vs-modify: theirs deleted the key, ours changed its value.
      // Report it and keep ours' value so `merged` stays landable. The deleted
      // side is `undefined`.
      //
      // Rendering caveat: merge-node.ts JSON-stringifies the conflict list,
      // graph-commit's run_merge_node reshapes it through jq, and
      // build_recommendation renders a missing side literally, so in the park
      // recommendation a deleted side reads the same way a genuine null value
      // would. That ambiguity is not a correctness problem — either way
      // the outcome is a park naming both values, which is the safe direction.
      // Widening FieldConflict to disambiguate would require a matching
      // graph-commit jq change and is deliberately out of scope.
      conflicts.push({ field: `attributes.${key}`, ours: oursAttrs[key], theirs: undefined });
      mergedAttrs[key] = oursAttrs[key];
      continue;
    }
    if (inTheirs && !inOurs) {
      // Mirror image of the branch above, with ours the deleting side.
      if (!inBase) {
        mergedAttrs[key] = theirsAttrs[key]; // theirs-only addition
        continue;
      }
      if (eq(baseAttrs[key], theirsAttrs[key])) continue; // ours deleted a key theirs left untouched
      conflicts.push({ field: `attributes.${key}`, ours: undefined, theirs: theirsAttrs[key] });
      mergedAttrs[key] = theirsAttrs[key];
      continue;
    }
    // Present on both sides.
    if (key === "conditions" && Array.isArray(oursAttrs[key]) && Array.isArray(theirsAttrs[key])) {
      const baseConditions = inBase ? baseAttrs[key] : undefined;
      mergedAttrs[key] = threeWayList(
        Array.isArray(baseConditions) ? baseConditions : null,
        oursAttrs[key],
        theirsAttrs[key],
      );
      continue;
    }
    const { value, conflict } = scalarMerge(
      `attributes.${key}`,
      inBase,
      baseAttrs[key],
      oursAttrs[key],
      theirsAttrs[key],
    );
    mergedAttrs[key] = value;
    if (conflict) conflicts.push(conflict);
  }
  merged.attributes = mergedAttrs;

  // Synthetic `body` pseudo-field: identical three-way scalar rule.
  const bodyResult = scalarMerge(
    "body",
    hasBase,
    base ? base.body : undefined,
    ours.body,
    theirs.body,
  );
  if (bodyResult.conflict) conflicts.push(bodyResult.conflict);
  const body = bodyResult.value as string; // type-safety-ok: scalarMerge is generic over unknown; body's own three inputs (base/ours/theirs) are always string, so its result is too

  return { merged, body, conflicts };
}
