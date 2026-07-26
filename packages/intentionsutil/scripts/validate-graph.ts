// Validates the intention-graph state directory in two passes:
//
//  1. `validateGraph` — structural referential integrity of the graph edges
//     (kind/parent/serves/recovers/blocked_by/validates, cycles, layer rules).
//  2. `validateGraphProseRefs` — PROSE referential integrity: every
//     backtick-quoted, id-shaped reference in a node's statement / rationale /
//     attention.rationale / clarification answers / markdown body must resolve
//     to a live or pruned node, be a forward reference to planned-but-
//     uncommitted work, or be grandfathered by the baseline. This catches the
//     2026-07-18 incident class: a node's prose named a sibling id that did not
//     yet exist on main (the sibling's own graph-commit lost a push race) and
//     CI stayed green because nothing checked prose.
//
// Used as the guard step of the graph/** CI fast path — an intentions/-only
// push validates its own state in seconds, rather than waiting on the full PR
// CI lane. Both passes throw IntentionSchemaError on any problem, which this
// script lets propagate, so a bad graph exits non-zero with the error message.
//
// The prose baseline (`../prose-ref-baseline.json`) exists PURELY to
// grandfather prose-dangling references that already existed on main when this
// check was introduced, so the new check does not retroactively break main. It
// is a JSON array of `{ ref, referencedBy }` objects (JSON has no comments, so
// this is the explanation). It should NOT grow going forward — a genuinely new
// prose-dangling reference is a violation to fix, not a baseline entry to add.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/validate-graph.ts [intentionsDir]
//
// Defaults to `intentions` (relative to cwd) when no argument is given.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listNodes, readNodeBody } from "../src/store.js";
import { validateGraph, validateGraphProseRefs } from "../src/schema.js";
import { lintTacticBodies, loadPlanBodyBaseline } from "../src/planlint.js";
import { deletedNodeIds } from "./lib-deleted-node-ids.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(scriptDir, "..", "prose-ref-baseline.json");

function isProseRefBaselineEntry(
  value: unknown,
): value is { ref: string; referencedBy: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ref" in value &&
    "referencedBy" in value &&
    typeof value.ref === "string" &&
    typeof value.referencedBy === "string"
  );
}

/** Load the grandfather baseline as a Set of `"<ref>|<referencedBy>"` keys. */
function loadBaseline(): Set<string> {
  const parsed: unknown = JSON.parse(readFileSync(baselinePath, "utf8"));
  if (!Array.isArray(parsed) || !parsed.every(isProseRefBaselineEntry)) {
    throw new Error(`${baselinePath}: expected a JSON array of {ref, referencedBy} objects`);
  }
  return new Set(parsed.map((e) => `${e.ref}|${e.referencedBy}`));
}

function main(): void {
  const intentionsDir = process.argv[2] ?? "intentions";
  const nodes = listNodes(intentionsDir);

  validateGraph(nodes);

  // Frontmatter integrity (validateGraph) is not enough for tactics: for a
  // planned/execution-phase tactic the markdown body IS the authoritative plan,
  // so also lint each such body for the required plan-schema markers. The
  // baseline grandfathers pre-existing violations so landing this lint does not
  // retroactively break main (same rollout pattern as the prose-ref baseline
  // below).
  lintTacticBodies(intentionsDir, nodes, loadPlanBodyBaseline());

  const bodies = new Map<string, string>();
  for (const node of nodes) {
    bodies.set(node.id, readNodeBody(intentionsDir, node.id));
  }
  const deletedIds = deletedNodeIds();
  const baseline = loadBaseline();
  validateGraphProseRefs(nodes, bodies, deletedIds, baseline);

  process.stdout.write(`ok — ${nodes.length} nodes\n`);
  process.stdout.write(
    `ok — prose refs: 0 unresolved (${baseline.size} grandfathered by baseline)\n`,
  );
}

main();
