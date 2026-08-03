// hold-sweep — the pure enumeration half of the stale-hold auto-resolve sweep.
//
// A hold is a born-parked `tactic` node carrying `attributes.hold_kind` (a
// member of HOLD_KINDS) and `attributes.hold_for` (the source node id it
// blocks), NAMED by the canonical derivation `holdIdFor(hold_kind, hold_for)`;
// the source names the hold in its `blocked_by` list. Clearing a hold
// means writing `office_hours: null` + `phase: done` on the hold AND removing
// the edge from the source's `blocked_by` — two writes that a batched
// graph-commit can silently drop the removal half of.
//
// This module answers only "which holds are there, and what should the sweep do
// with each?". It performs no filesystem, git, or network access: everything it
// decides on comes from the `nodes` array it is handed.

import { HOLD_KINDS, KIND_RECHECK, holdIdFor, type HoldKind } from "./holds.js";
import type { IntentionNode } from "./schema.js";

/**
 * What the sweep must do with a hold:
 *
 *  - `predicate`    — the hold is open and its kind has an `auto` re-check
 *                     policy, so a predicate can decide whether the tracked
 *                     condition has cleared.
 *  - `edge-residue` — the hold itself already completed, but the source's
 *                     `blocked_by` edge survives (the dropped-removal hazard).
 *  - `manual`       — the hold is open and its kind has no machine-checkable
 *                     predicate. Reported for visibility only.
 */
export type HoldClass = "predicate" | "edge-residue" | "manual";

/** One classified hold: the hold node, the source it blocks, and its bucket. */
export interface HoldCandidate {
  holdId: string;
  sourceId: string;
  kind: HoldKind;
  cls: HoldClass;
}

/** Narrow a raw attribute value to a known hold kind. */
function isHoldKindValue(value: unknown): value is HoldKind {
  return typeof value === "string" && (HOLD_KINDS as readonly string[]).includes(value);
}

/**
 * Whether `nodeId` is the canonical derived hold id for (`kind`, `sourceId`).
 *
 * Load-bearing, not cosmetic. The sweep enumerates BY hold node id but the
 * downstream `resolve-hold` re-derives the hold id from (source, kind) — so a
 * node whose id is NOT the canonical derivation would have its classification
 * applied to a DIFFERENT node — any `kind: tactic` node may carry
 * `attributes.hold_kind` + `hold_for` (nothing in validate-graph constrains the
 * id), so a `phase: done`, `office_hours: null` decoy named in a victim's
 * `blocked_by` would classify as `edge-residue` — bypassing both the manual
 * re-check policy and the residue predicate — and force-resolve the victim's
 * genuine, still-open hold. Binding the enumeration to the derived id is what
 * keeps "the hold that was classified" and "the hold that gets resolved" the
 * same node.
 *
 * `holdIdFor` throws when the derivation does not fit the node-id slug shape
 * (e.g. a `hold_for` carrying characters the slug regex rejects); a throw here
 * is a non-match, never a sweep-wide failure.
 */
function isCanonicalHoldId(nodeId: string, kind: HoldKind, sourceId: string): boolean {
  try {
    return holdIdFor(kind, sourceId) === nodeId;
  } catch {
    return false;
  }
}

/**
 * Enumerate and classify every hold node in `nodes`.
 *
 * Pure: no filesystem, git, or network access — the whole decision is made from
 * the passed-in node array, so it is offline-testable with in-memory fixtures.
 *
 * A node is a hold when ALL hold:
 *   - `kind === "tactic"`,
 *   - `attributes.hold_kind` is a member of `HOLD_KINDS`,
 *   - `attributes.hold_for` is a non-empty string, and
 *   - the node's own id IS `holdIdFor(hold_kind, hold_for)` — the canonical
 *     derived hold id. See `isCanonicalHoldId` for why this one is a security
 *     property rather than a tidiness check.
 *
 * Each hold's source is looked up by `hold_for` in the same `nodes` array, and
 * the hold is EXCLUDED (nothing emitted for it) when either:
 *   - the source id is not present in `nodes` at all, or
 *   - the source's `blocked_by` does not contain the hold's own id — the hold is
 *     already fully resolved, edge and all.
 *
 * Otherwise (source present, edge still there) it is classified, where a hold is
 * TERMINAL iff `phase === "done"` AND `office_hours === null` (both required —
 * a `done` hold that is still parked counts as open):
 *   - `edge-residue` — the hold is terminal. The tracked condition is
 *     definitionally gone (the hold completed) but the source's `blocked_by`
 *     edge survives: resolve-hold's known dropped-removal hazard. This applies
 *     regardless of the hold's kind — auto and manual policies alike.
 *   - `predicate` — the hold is open and
 *     `KIND_RECHECK[kind].policy === "auto"`.
 *   - `manual` — the hold is open and `KIND_RECHECK[kind].policy === "manual"`.
 *     Emitted purely for the sweep's reporting; nothing acts on it directly.
 *
 * @param nodes The loaded graph nodes (as from `listNodes`).
 * @returns One candidate per classified hold, sorted by `holdId` ascending.
 */
export function listHoldCandidates(nodes: IntentionNode[]): HoldCandidate[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const candidates: HoldCandidate[] = [];

  for (const node of nodes) {
    if (node.kind !== "tactic") continue;

    const kind = node.attributes.hold_kind;
    if (!isHoldKindValue(kind)) continue;

    const sourceId = node.attributes.hold_for;
    if (typeof sourceId !== "string" || sourceId === "") continue;

    // The enumeration is BY node id; the resolve is BY (source, kind). Emitting
    // a hold whose id is not the canonical derivation would let one node's
    // classification drive another node's resolution — see isCanonicalHoldId.
    if (!isCanonicalHoldId(node.id, kind, sourceId)) continue;

    const source = byId.get(sourceId);
    if (source === undefined) continue; // source gone: nothing to unblock
    if (!source.blocked_by.includes(node.id)) continue; // edge already cleared

    const terminal = node.phase === "done" && node.office_hours === null;
    const cls: HoldClass = terminal
      ? "edge-residue"
      : KIND_RECHECK[kind].policy === "auto"
        ? "predicate"
        : "manual";

    candidates.push({ holdId: node.id, sourceId, kind, cls });
  }

  candidates.sort((a, b) => (a.holdId < b.holdId ? -1 : a.holdId > b.holdId ? 1 : 0));
  return candidates;
}
