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

import { readNodeBody } from "./store.js";
import { IntentionSchemaError } from "./errors.js";
import type { IntentionNode } from "./schema.js";

/**
 * Phases in which a tactic's body must carry a full clean-session plan. A tactic
 * that is not yet planned (`null`/`draft`/`align-tactics`) has no plan to lint;
 * a `done` tactic is historical. `main-qa` is intentionally absent — the current
 * main-qa nodes carry `phase: null` (see the named-exemption note below), so
 * they fall outside this filter already.
 */
const PLANNED_PHASES: ReadonlySet<string> = new Set(["implement", "fix", "qa", "review"]);

/**
 * `tactic-mainqa-*` nodes are exempt from the recommended-model marker ONLY
 * (Context and Verification stay required). These 12 nodes model a main-qa
 * review whose implementation is a human/Chrome verification pass, not a
 * model-selected code unit, so a recommended-model tag is meaningless for them.
 *
 * DEAD-CODE NOTE: this exemption exists only because those nodes currently sit
 * at a real dispatch phase (`review`/`qa`) with a `tactic-mainqa-` id prefix.
 * `tactic-mainqa-first-class-phase` (today phase: null, status: raw) plans to
 * migrate these 12 nodes onto a real first-class `main-qa` phase. Once that
 * lands, they leave the PLANNED_PHASES filter entirely and this id-prefix
 * carve-out becomes dead code — find and remove it then.
 */
function isMainqaModelExempt(id: string): boolean {
  return /^tactic-mainqa-/.test(id);
}

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
 *     "**Recommended model:**", etc.), unless the node is `tactic-mainqa-*`,
 *   - a `## Verification` heading (`/^##\s+Verification\b/im`, so
 *     "## Verification checklist" still counts).
 */
export function lintTacticBodies(dir: string, nodes: IntentionNode[]): void {
  const problems: string[] = [];
  for (const node of nodes) {
    if (node.kind !== "tactic") continue;
    if (node.phase === null || !PLANNED_PHASES.has(node.phase)) continue;

    const body = readNodeBody(dir, node.id);

    if (!/^##\s+Context\b/im.test(body)) {
      problems.push(`${node.id}: body is missing a "## Context" heading`);
    }
    if (!isMainqaModelExempt(node.id) && !/recommended model/i.test(body)) {
      problems.push(`${node.id}: body is missing a "Recommended model" line`);
    }
    if (!/^##\s+Verification\b/im.test(body)) {
      problems.push(`${node.id}: body is missing a "## Verification" heading`);
    }
  }
  if (problems.length > 0) {
    throw new IntentionSchemaError(`Tactic body plan-schema violations:\n${problems.join("\n")}`);
  }
}
