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
 * The top-level IntentionNode fields merged by the list-union rule: dedup-append
 * union of theirs then ours, no base needed. `attributes.conditions` follows the
 * same rule but is handled key-by-key inside `attributes` (not listed here).
 */
export const LIST_FIELDS: readonly (keyof IntentionNode)[] = [
  "serves",
  "recovers",
  "clarifications",
  "tooling_goals",
  "validates",
  "blocked_by",
];

/**
 * Top-level scalar/object fields merged by the three-way scalar rule. Every
 * IntentionNode field that is neither a LIST_FIELD nor `attributes` (which is
 * merged key-by-key). The synthetic pseudo-field `body` is merged by the same
 * rule but handled separately since it is not an IntentionNode key.
 */
const SCALAR_FIELDS: readonly (keyof IntentionNode)[] = [
  "id",
  "kind",
  "statement",
  "owner",
  "status",
  "parent",
  "rationale",
  "reading",
  "gap",
  "success_signal",
  "attention",
  "phase",
  "execution",
  "office_hours",
  "pace_exempt",
  "rounds",
];

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
  if (typeof a === "object" && typeof b === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const aKeys = Object.keys(ao);
    const bKeys = Object.keys(bo);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(bo, key)) return false;
      if (!eq(ao[key], bo[key])) return false;
    }
    return true;
  }
  return false;
}

/** Union of two lists preserving `theirs` order first, then `ours` novel
 * entries in `ours` order, deduped by structural `eq`. Deterministic; base-free. */
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
 *  - List fields (`LIST_FIELDS`) union-dedup theirs+ours, base-free.
 *  - `attributes` is merged key-by-key: `conditions` gets the list-union rule;
 *    every other key gets the scalar rule. A key present on only one side is a
 *    pure addition (kept, never a conflict).
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
  const merged = { ...theirs.node } as IntentionNode;
  const mergedRec = merged as unknown as Record<string, unknown>;

  // List fields: union-dedup, base-free.
  for (const field of LIST_FIELDS) {
    const theirsList = theirs.node[field] as unknown[];
    const oursList = ours.node[field] as unknown[];
    mergedRec[field] = unionList(theirsList, oursList);
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

  // attributes: merge key-by-key. Union of all keys across ours + theirs (and
  // base for base-comparison legs). A key on only one side is a pure addition.
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
    if (inOurs && !inTheirs) {
      mergedAttrs[key] = oursAttrs[key]; // ours-only addition
      continue;
    }
    if (inTheirs && !inOurs) {
      mergedAttrs[key] = theirsAttrs[key]; // theirs-only addition
      continue;
    }
    // Present on both sides.
    if (key === "conditions" && Array.isArray(oursAttrs[key]) && Array.isArray(theirsAttrs[key])) {
      mergedAttrs[key] = unionList(theirsAttrs[key] as unknown[], oursAttrs[key] as unknown[]);
      continue;
    }
    const inBase = Object.prototype.hasOwnProperty.call(baseAttrs, key);
    const { value, conflict } = scalarMerge(
      `attributes.${key}`,
      hasBase && inBase,
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
  const body = bodyResult.value as string;

  return { merged, body, conflicts };
}
