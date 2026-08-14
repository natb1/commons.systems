// The ladder-terminus predicate (tactic-ladder-terminus-owns-main-qa): a
// /dispatch-ladder run may not report a terminal disposition until its node's
// work is terminal (`phase: done`) or legitimately excused. Exactly two
// excuses count — parked to office-hours (`office_hours` non-null), or
// blocked on an awaited event (`blocked_by` non-empty). A halt, a drained
// budget, a reconciler error, or a phase left mid-flight is a violation.
//
// This module is fs-free and process-free by design, matching census.ts: no
// `node:fs`, no `child_process`. Callers supply the already-loaded node list;
// `findUnstructuredWaits` takes an fs-touching body reader as an injected
// callback so it stays testable without disk.

import type { IntentionNode } from "./schema.js";

export type TerminusClassification =
  | "not-merged"
  | "done"
  | "excused-parked"
  | "excused-blocked"
  | "violation";

/**
 * Classify one node against the ladder-terminus requirement. The five
 * conditions are checked in exactly this order — first match wins — so the
 * result is total and deterministic even when more than one condition holds
 * (e.g. a node that is both parked AND blocked classifies `excused-parked`;
 * a `done` node that is also parked classifies `done`, since the work is
 * already finished and the excuse is moot).
 *
 * 1. `not-merged` — the node was never merged (`execution.completion.mergedAt`
 *    unset/null), so it sits outside the census entirely: the requirement
 *    only binds work whose PR has landed.
 * 2. `done` — the work reached its terminal phase. No excuse needed.
 * 3. `excused-parked` — office-hours holds it (`office_hours` non-null).
 * 4. `excused-blocked` — a `blocked_by` edge holds it (non-empty).
 * 5. `violation` — merged, not done, and neither excuse applies. This is
 *    exactly the failure the requirement exists to catch: a halt, a drained
 *    budget, a reconciler error, or a phase left mid-flight while the merge
 *    already looks like success.
 */
export function classifyTerminus(node: IntentionNode): TerminusClassification {
  if (node.execution?.completion?.mergedAt == null) return "not-merged";
  if (node.phase === "done") return "done";
  if (node.office_hours != null) return "excused-parked";
  if (node.blocked_by.length > 0) return "excused-blocked";
  return "violation";
}

/** One row of the ladder-terminus census table. */
export interface TerminusRow {
  id: string;
  phase: string | null;
  pr: number | null;
  classification: TerminusClassification;
}

export interface LadderTerminusCensus {
  /**
   * One row per CENSUS-POPULATION node, sorted by id. The population is the
   * requirement's own observable (tactic-ladder-terminus-owns-main-qa,
   * "Verification"): "the merged-but-not-terminal count" — nodes that ARE
   * merged (excluding `not-merged`) and are NOT already `done`. A `done` node
   * is excluded from `rows` for the same reason `not-merged` is: it is not
   * part of what this observable measures (a `done` node needs no excuse and
   * contributes nothing to a violation count), so `rows` holds only
   * `excused-parked` / `excused-blocked` / `violation` classifications.
   *
   * This is what makes the summary counts trivially derivable with no
   * re-application of the classification order above: `mergedNotDone` is
   * `rows.length`; `excused` and `violations` are `rows.filter(...).length`
   * over the two excused kinds and `"violation"` respectively. Including
   * `done` rows would break that — `mergedNotDone` would then need to filter
   * `done` back out to match the requirement's own count, defeating the
   * point of returning a pre-scoped table.
   */
  rows: TerminusRow[];
  mergedNotDone: number;
  excused: number;
  violations: number;
}

/**
 * Compute the ladder-terminus census over a store snapshot: the count of
 * merged-but-not-done nodes, split into legitimately excused and violation.
 * `rows` carries the census population (merged AND not done — see
 * `LadderTerminusCensus.rows`), sorted by id for a stable report.
 */
export function ladderTerminusCensus(nodes: IntentionNode[]): LadderTerminusCensus {
  const rows: TerminusRow[] = [];
  let excused = 0;
  let violations = 0;

  for (const n of nodes) {
    const classification = classifyTerminus(n);
    if (classification === "not-merged" || classification === "done") continue;
    rows.push({ id: n.id, phase: n.phase, pr: n.execution?.pr ?? null, classification });
    if (classification === "excused-parked" || classification === "excused-blocked") excused++;
    if (classification === "violation") violations++;
  }

  rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { rows, mergedNotDone: rows.length, excused, violations };
}

/** One node reporting a prose-only wait rather than a structural excuse. */
export interface UnstructuredWait {
  id: string;
  awaited: string;
}

/**
 * The regex that finds an "awaited event:" line in a node body. Case-
 * sensitive and matches the exact phrasing the requirement's authors use in
 * needs-main residue sections (e.g. "Verifiability: WAIT — awaited event:
 * `tactic-foo` lands"). Captures everything after the colon to end of line.
 */
const AWAITED_EVENT_LINE = /awaited event:\s*(.+)/;

/**
 * DETECTOR for prose-only waits: find every `phase: "main-qa"` node whose
 * body carries an "awaited event:" line but which records neither excuse
 * structurally — `blocked_by` is empty and `office_hours` is null. This is
 * the gap tactic-ladder-terminus-owns-main-qa's scope item 3 names: a wait
 * like `tactic-attention-namespaced-rank`'s needs-main residue ("Verifiability:
 * WAIT — awaited event: tactic-attention-per-tier-boost-migration lands") IS
 * an awaited event under the requirement, but it lives as body prose, not as
 * a `blocked_by` edge, so `classifyTerminus` scores it a `violation`.
 *
 * `readBody` is injected `(id) => string` rather than this module reading
 * `<dir>/<id>.md` itself, so tests can supply bodies in-memory — matching the
 * fs-free contract the rest of this module keeps.
 *
 * CRITICAL, DO NOT "FIX" THIS: the result of this function must NEVER feed
 * back into `classifyTerminus` to reclassify a detected prose wait as excused.
 * A node found here still classifies `violation` — that is not a bug in this
 * function, it is the tactic's explicit ruling ("Do not close this by
 * loosening the census to accept prose"). This detector exists to REPORT the
 * gap (so the two live prose waits get converted to real `blocked_by` edges
 * or handled another way), not to paper over it by widening what counts as
 * excused. A later reader who wires `findUnstructuredWaits` into
 * `classifyTerminus` so these stop reading as violations is reintroducing the
 * exact loophole this tactic was written to close.
 */
export function findUnstructuredWaits(
  nodes: IntentionNode[],
  readBody: (id: string) => string,
): UnstructuredWait[] {
  const out: UnstructuredWait[] = [];
  for (const n of nodes) {
    if (n.phase !== "main-qa") continue;
    if (n.blocked_by.length > 0) continue;
    if (n.office_hours != null) continue;
    const body = readBody(n.id);
    const match = body.match(AWAITED_EVENT_LINE);
    if (match === null) continue;
    out.push({ id: n.id, awaited: match[1].trim() });
  }
  return out;
}
