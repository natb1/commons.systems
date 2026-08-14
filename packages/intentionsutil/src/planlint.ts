// Plan-schema body lint for tactic nodes.
//
// `validateGraph` (schema.ts) judges only frontmatter — it never inspects a
// node's markdown body. But for a tactic in a planned/execution phase the body
// IS the authoritative clean-session plan a dispatch worker executes, so a
// tactic that reaches `implement` with no `## Context`, no recommended-model
// tag, and no `## Verification` is a silent gap: it validates clean yet carries
// no executable plan. This lint closes that gap by requiring three plan-schema
// markers in the body of every planned/execution-phase tactic.
//
// It lives beside the frontmatter validator rather than inside it: schema.ts's
// contract is frontmatter-only and takes no store dir, whereas this lint must
// read raw bodies off disk, so it takes the store `dir` as an argument and is
// wired into validate-graph.ts after `validateGraph`.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readNodeBody } from "./store.js";
import { IntentionSchemaError } from "./errors.js";
import type { IntentionNode } from "./schema.js";

/**
 * The three plan-schema markers this lint requires, used as the `marker` field
 * of a baseline entry (below).
 */
export type PlanBodyMarker = "context" | "model" | "verification";

/**
 * One grandfathered pre-existing violation: node `id` is permitted to lack
 * `marker`. This mirrors `prose-ref-baseline.json`'s role for
 * `validateGraphProseRefs` — it grandfathers violations that already existed
 * when the lint was introduced, so landing the lint does not retroactively
 * break main. It should NOT grow going forward: a newly planned tactic missing
 * a marker is a violation to fix, not a baseline entry to add. Fixing a
 * baselined node's body (adding the marker) makes its entry dead — remove it
 * then so the ratchet only tightens.
 */
export type PlanBodyBaselineEntry = { id: string; marker: PlanBodyMarker };

const scriptDir = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(scriptDir, "..", "plan-body-baseline.json");

function isPlanBodyBaselineEntry(value: unknown): value is PlanBodyBaselineEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "marker" in value &&
    typeof (value as { id: unknown }).id === "string" &&
    ((value as { marker: unknown }).marker === "context" ||
      (value as { marker: unknown }).marker === "model" ||
      (value as { marker: unknown }).marker === "verification")
  );
}

/**
 * Load the grandfather baseline (`../plan-body-baseline.json` by default) as a
 * Set of `"<id>|<marker>"` keys — the shape `lintTacticBodies` consults. Throws
 * a descriptive error rather than silently defaulting when the file is missing
 * or malformed, matching the code-style "clear errors over defensive fallbacks"
 * rule.
 */
export function loadPlanBodyBaseline(path: string = baselinePath): Set<string> {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(parsed) || !parsed.every(isPlanBodyBaselineEntry)) {
    throw new Error(`${path}: expected a JSON array of {id, marker} objects`);
  }
  return new Set(parsed.map((e) => `${e.id}|${e.marker}`));
}

/**
 * Phases in which a tactic's body must carry a full clean-session plan. A tactic
 * that is not yet planned (`null`/`draft`/`align-tactics`) has no plan to lint;
 * a `done` tactic is historical. `main-qa` is also absent: a main-qa tactic's
 * work is a human/Chrome verification pass against deployed prod, not a
 * model-selected code unit, so the plan-schema markers this lint checks for do
 * not apply to it.
 */
const PLANNED_PHASES: ReadonlySet<string> = new Set(["implement", "fix", "qa", "review"]);

// `tactic-mainqa-*` nodes no longer get a special carve-out here — removed
// 2026-08-13. They used to be exempt from the recommended-model marker only,
// back when the 12 main-qa verification nodes sat at a real dispatch phase
// (`qa`/`review`) with a `tactic-mainqa-` id prefix but no code unit to pick a
// model for. `tactic-mainqa-first-class-phase` migrated them onto the
// first-class `main-qa` phase (landed 2026-07-23, commit ce03274a): all 12 now
// carry `phase: main-qa`, which `PLANNED_PHASES` already excludes (see above),
// so the id-prefix carve-out was dead code and has been deleted.
//
// Do NOT re-add an id-prefix exemption: the `tactic-mainqa-` prefix is no
// longer exclusive to those 12 verification nodes.
// `tactic-mainqa-record-time-routing` (the tactic implementing the
// strategy-graph-native-dispatch main-qa redesign) is a genuine code
// implementation tactic that happens to share the prefix. Once it is planned
// into a real dispatch phase, an id-prefix carve-out would silently exempt it
// from the recommended-model marker it actually needs.

/**
 * Lint the markdown bodies of every planned/execution-phase tactic in `nodes`,
 * reading each body from `dir` via `readNodeBody`. Throws a single
 * `IntentionSchemaError` listing ALL violations (matching `validateGraph`'s
 * failure style — one run surfaces every problem, not just the first).
 *
 * For every `kind: "tactic"` node whose `phase` is `implement`/`fix`/`qa`/
 * `review`, the body must contain:
 *   - a `## Context` heading (`/^##\s+Context\b/im`),
 *   - at least one recommended-model line (`/recommended model/i`, anywhere —
 *     any format: "- **Recommended model**: sonnet", "Recommended model: opus",
 *     "**Recommended model:**", etc.),
 *   - a `## Verification` heading (`/^##\s+Verification\b/im`, so
 *     "## Verification checklist" still counts).
 *
 * `baseline` grandfathers pre-existing `"<id>|<marker>"` violations (see
 * `loadPlanBodyBaseline`); a baselined {node, marker} pair is skipped. Defaults
 * to an empty set — callers that want no grandfathering (e.g. unit tests) omit
 * it; `validate-graph.ts` passes `loadPlanBodyBaseline()`.
 */
export function lintTacticBodies(
  dir: string,
  nodes: IntentionNode[],
  baseline: ReadonlySet<string> = new Set(),
): void {
  const problems: string[] = [];
  for (const node of nodes) {
    if (node.kind !== "tactic") continue;
    if (node.phase === null || !PLANNED_PHASES.has(node.phase)) continue;

    const body = readNodeBody(dir, node.id);

    if (!/^##\s+Context\b/im.test(body) && !baseline.has(`${node.id}|context`)) {
      problems.push(`${node.id}: body is missing a "## Context" heading`);
    }
    if (!/recommended model/i.test(body) && !baseline.has(`${node.id}|model`)) {
      problems.push(`${node.id}: body is missing a "Recommended model" line`);
    }
    if (!/^##\s+Verification\b/im.test(body) && !baseline.has(`${node.id}|verification`)) {
      problems.push(`${node.id}: body is missing a "## Verification" heading`);
    }
  }
  if (problems.length > 0) {
    throw new IntentionSchemaError(`Tactic body plan-schema violations:\n${problems.join("\n")}`);
  }
}
