// Review-coverage sensor for strategy-graph-review-curriculum.
//
// Computes, per durable-layer node, its review mode (A = held on trust,
// re-validate against source; B = author-owned, re-affirm against broadened
// context), a derived review path, and a last-reviewed date — the mechanical
// half of the strategy's coverage signal (zero durable-layer nodes without a
// review path).
//
// The module is pure: callers supply the parsed nodes plus a map from node id
// to the node's raw markdown text (frontmatter + body). Reading the store off
// disk is the script's job (scripts/review-coverage.ts), not this module's, so
// the logic stays unit-testable on in-memory fixtures.

import type { IntentionNode } from "./schema.js";
import { readingDate } from "./router.js";

/** One durable-layer node's review-coverage row. */
export interface CoverageRow {
  id: string;
  kind: string;
  mode: "A" | "B";
  path: string;
  last_reviewed: string | null;
}

/**
 * Durable layer: the nodes a review curriculum is responsible for. Tactics are
 * excluded — live tactics are covered through their serving strategy,
 * born-parked review items are curriculum *entries* not subjects, and done
 * tactics are pruned (strategy-graph-review-curriculum clarification 2).
 */
const DURABLE_KINDS: ReadonlySet<string> = new Set([
  "virtue",
  "strategy",
  "kind",
  "tradition",
  "delegation",
]);

/** The sentinel path for a durable node with no derivable review path. */
const MISSING = "MISSING";

/**
 * Mode of a durable node (strategy clarification 3):
 * - `A` — content held on trust: delegations, traditions (delegated
 *   articulations of primary texts), and anything explicitly `delegated`.
 * - `B` — author-owned: re-affirmed against a broadened context.
 */
function modeOf(node: IntentionNode): "A" | "B" {
  if (node.kind === "delegation") return "A";
  if (node.kind === "tradition") return "A";
  if (node.status === "delegated") return "A";
  return "B";
}

/**
 * The ids of nodes that are frontier review *entries*: `office_hours` non-null
 * and `phase` not `"done"` (a done-phase parked node is spent, not a live
 * curriculum entry). Born-parked review items name their subject in prose, so
 * the mechanical linkage is: the entry's raw text contains the subject's id as
 * a substring.
 */
function frontierEntryFor(
  subjectId: string,
  nodes: readonly IntentionNode[],
  bodyById: ReadonlyMap<string, string>,
): string | null {
  let best: string | null = null;
  for (const candidate of nodes) {
    if (candidate.id === subjectId) continue;
    if (candidate.office_hours === null) continue;
    if (candidate.phase === "done") continue;
    const body = bodyById.get(candidate.id);
    if (body === undefined || !body.includes(subjectId)) continue;
    if (best === null || candidate.id < best) best = candidate.id;
  }
  return best;
}

/** A `review_trigger` attribute with a non-empty string value. */
function hasReviewTrigger(node: IntentionNode): boolean {
  const trigger = node.attributes["review_trigger"];
  return typeof trigger === "string" && trigger.trim() !== "";
}

/** A non-empty `conditions` array in attributes. */
function hasConditions(node: IntentionNode): boolean {
  const conditions = node.attributes["conditions"];
  return Array.isArray(conditions) && conditions.length > 0;
}

/**
 * The review path for a durable node — first matching rule wins:
 *
 *   1. a frontier review entry naming this node → `frontier-entry:<id>`
 *   2. delegation → `event-based-review` (has `review_trigger`) else `MISSING`
 *   3. tradition → `reading-program`
 *   4. author-owned strategy with recorded conditions → `condition-sweep`
 *   5. any other author-owned node → `frontier-reachable`
 *   6. otherwise (a mode-A node no class rule covers) → `MISSING`
 */
function pathOf(
  node: IntentionNode,
  mode: "A" | "B",
  nodes: readonly IntentionNode[],
  bodyById: ReadonlyMap<string, string>,
): string {
  const entry = frontierEntryFor(node.id, nodes, bodyById);
  if (entry !== null) return `frontier-entry:${entry}`;

  if (node.kind === "delegation") {
    return hasReviewTrigger(node) ? "event-based-review" : MISSING;
  }
  if (node.kind === "tradition") return "reading-program";

  if (mode === "B") {
    if (node.kind === "strategy" && hasConditions(node)) return "condition-sweep";
    return "frontier-reachable";
  }

  return MISSING;
}

/** A non-array, non-null object — a plain record we can enumerate by key. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Recursively collect every string value carried under an attributes key named
 * `last_assessed` or `last_exercised`, at any nesting depth. Delegations carry
 * `attributes.last_assessed` top-level and, e.g.,
 * `attributes.irreversibility.last_exercised` nested.
 */
function collectStampStrings(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    for (const element of value) collectStampStrings(element, out);
    return;
  }
  if (isRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      if ((key === "last_assessed" || key === "last_exercised") && typeof nested === "string") {
        out.push(nested);
      }
      collectStampStrings(nested, out);
    }
  }
}

/**
 * The newest ISO date (YYYY-MM-DD) across the node's clarification answers and
 * its `last_assessed`/`last_exercised` attribute stamps, or `null` when none of
 * those texts carry a parseable date.
 */
function lastReviewedOf(node: IntentionNode): string | null {
  const dates: string[] = [];
  for (const clarification of node.clarifications) {
    const date = readingDate(clarification.answer);
    if (date !== null) dates.push(date);
  }
  const stamps: string[] = [];
  collectStampStrings(node.attributes, stamps);
  for (const stamp of stamps) {
    const date = readingDate(stamp);
    if (date !== null) dates.push(date);
  }
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (a > b ? a : b));
}

/**
 * Compute the review-coverage rows for the durable layer. Non-durable kinds
 * (tactics included) are excluded from the result entirely. Input order is
 * preserved; the script passes id-sorted nodes.
 */
export function computeReviewCoverage(
  nodes: readonly IntentionNode[],
  bodyById: ReadonlyMap<string, string>,
): CoverageRow[] {
  const rows: CoverageRow[] = [];
  for (const node of nodes) {
    if (!DURABLE_KINDS.has(node.kind)) continue;
    const mode = modeOf(node);
    rows.push({
      id: node.id,
      kind: node.kind,
      mode,
      path: pathOf(node, mode, nodes, bodyById),
      last_reviewed: lastReviewedOf(node),
    });
  }
  return rows;
}

/**
 * Render the coverage rows as a deterministic stdout block: an id-sorted
 * markdown table, then a trailing summary line naming the nodes with no review
 * path. No wall-clock or environment data — byte-identical across runs on the
 * same store.
 */
export function renderCoverageTable(rows: readonly CoverageRow[]): string {
  const sorted = [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const lines: string[] = [];
  lines.push("| id | kind | mode | path | last_reviewed |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const row of sorted) {
    lines.push(
      `| ${row.id} | ${row.kind} | ${row.mode} | ${row.path} | ${row.last_reviewed ?? "—"} |`,
    );
  }

  const missing = sorted.filter((row) => row.path === MISSING).map((row) => row.id);
  const summary =
    missing.length === 0
      ? `${sorted.length} durable nodes; 0 missing a review path`
      : `${sorted.length} durable nodes; ${missing.length} missing a review path: ${missing.join(", ")}`;

  lines.push("");
  lines.push(summary);
  return lines.join("\n") + "\n";
}
