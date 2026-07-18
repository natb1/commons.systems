// Validates the intention-graph state directory: loads every node with
// listNodes, then runs validateGraph's integrity checks (dangling refs,
// cycles, etc.) across the whole set. Used as the guard step of the
// graph/** CI fast path — an intentions/-only push validates its own state
// in seconds, rather than waiting on the full PR CI lane.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/validate-graph.ts [intentionsDir]
//
// Defaults to `intentions` (relative to cwd) when no argument is given.
// validateGraph throws IntentionSchemaError on any problem — this script
// lets that propagate, so a bad graph exits non-zero with the error message.

import { listNodes } from "../src/store.js";
import { validateGraph } from "../src/schema.js";
import { lintTacticBodies } from "../src/planlint.js";

function main(): void {
  const intentionsDir = process.argv[2] ?? "intentions";
  const nodes = listNodes(intentionsDir);
  validateGraph(nodes);
  // Frontmatter integrity (validateGraph) is not enough for tactics: for a
  // planned/execution-phase tactic the markdown body IS the authoritative plan,
  // so also lint each such body for the required plan-schema markers.
  lintTacticBodies(intentionsDir, nodes);
  process.stdout.write(`ok — ${nodes.length} nodes\n`);
}

main();
