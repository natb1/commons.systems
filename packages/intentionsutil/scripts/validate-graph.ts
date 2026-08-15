// Validates the intention-graph state directory in three passes:
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
//  3. `findUnboundRegisteredSensorNames` — SENSOR registration integrity:
//     every name the default sensor registry registers should still be some
//     node's verbatim `success_signal.sensor`. This catches the 2026-08-12
//     incident class: an /align round appended a clause to a recorded sensor,
//     whose exact-match registration then resolved to nothing and read null in
//     silence. REPORTED, NOT FATAL — see the call site's comment for why.
//     (`lintTacticBodies` also runs, on tactic plan bodies.)
//
// Used as the guard step of the graph/** CI fast path — an intentions/-only
// push validates its own state in seconds, rather than waiting on the full PR
// CI lane. The graph passes throw IntentionSchemaError on any problem, which
// this script lets propagate, so a bad graph exits non-zero with the error
// message. The sensor pass is the deliberate exception: it prints and exits 0.
//
// The prose baseline (`../prose-ref-baseline.json`) exists PURELY to
// grandfather prose-dangling references that already existed on main when this
// check was introduced, so the new check does not retroactively break main. It
// is a JSON array of `{ ref, referencedBy }` objects (JSON has no comments, so
// this is the explanation). It should NOT grow going forward — a genuinely new
// prose-dangling reference is a violation to fix, not a baseline entry to add.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/validate-graph.ts <intentionsDir>
//
// <intentionsDir> is REQUIRED and has no default (strategy-graph-native-dispatch
// clarification 194, ADOPTED; clarification 242 scopes the conversion to this
// file plus write-node.ts / dump-node.ts / clear-park). It used to default to
// the literal `intentions` relative to cwd, which made the tree this script
// validated a property of where it happened to be invoked from rather than of
// what the caller asked for: run it from a directory with no `intentions/` and
// `listNodesStrict` returned an empty node list, every pass validated nothing,
// and the script exited 0 — a vacuous pass reported as a clean graph. A missing
// argument is now a usage error, never a fallback (.claude/rules/code-style.md).

import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listNodesStrict, readNodeBody } from "../src/store.js";
import { validateGraph, validateGraphProseRefs } from "../src/schema.js";
import { lintTacticBodies, loadPlanBodyBaseline } from "../src/planlint.js";
import {
  findUnboundRegisteredSensorNames,
  formatUnboundSensorNames,
} from "../src/sensors.js";
import { deletedNodeIds } from "./lib-deleted-node-ids.js";
import { UNBOUND_SENSOR_NAMES, registeredSensorNames } from "./read-sensors.js";

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

const USAGE = "usage: validate-graph.ts <intentionsDir>";

/**
 * The intentions directory this run validates, taken verbatim from argv. There
 * is deliberately no default: see the header note — the old cwd-relative
 * `intentions` default turned "no such directory" into an empty node list and a
 * silent exit 0. Exits 2 (usage) rather than returning a fallback.
 */
function parseIntentionsDir(argv: string[]): string {
  const positional = argv.filter((a) => !a.startsWith("-"));
  if (positional.length !== 1 || positional[0] === "") {
    process.stderr.write(
      "validate-graph: <intentionsDir> is required and has no default — name the store to " +
        "validate (e.g. `intentions`, or an absolute path). Without it this script cannot " +
        "tell an empty graph from a directory that is not a graph at all.\n" +
        `${USAGE}\n`,
    );
    process.exit(2);
  }
  return positional[0];
}

/**
 * Fail loudly when the named directory is not a readable directory. Without
 * this the store enumeration below would surface the same condition as a bare
 * ENOENT stack trace, and — before <intentionsDir> became required — as an
 * empty node list and a clean exit 0. Validating "nothing" is never a pass.
 */
function assertIsDirectory(intentionsDir: string): void {
  let stat;
  try {
    stat = statSync(intentionsDir);
  } catch {
    process.stderr.write(
      `validate-graph: '${intentionsDir}' (resolved: ${resolve(intentionsDir)}) does not exist. ` +
        "Nothing was validated — this is NOT a clean graph. Pass the path to the intention " +
        "store you meant to validate.\n",
    );
    process.exit(2);
  }
  if (!stat.isDirectory()) {
    process.stderr.write(
      `validate-graph: '${intentionsDir}' (resolved: ${resolve(intentionsDir)}) is not a directory. ` +
        "Nothing was validated — this is NOT a clean graph.\n",
    );
    process.exit(2);
  }
}

function main(): void {
  const intentionsDir = parseIntentionsDir(process.argv.slice(2));
  assertIsDirectory(intentionsDir);
  const nodes = listNodesStrict(intentionsDir);

  validateGraph(nodes);

  // Frontmatter integrity (validateGraph) is not enough for tactics: for a
  // planned/execution-phase tactic the markdown body IS the authoritative plan,
  // so also lint each such body for the required plan-schema markers. The
  // baseline grandfathers pre-existing violations so landing this lint does not
  // retroactively break main (same rollout pattern as the prose-ref baseline
  // below).
  lintTacticBodies(intentionsDir, nodes, loadPlanBodyBaseline());

  // Sensor registration integrity: a sensor resolves by exact string match, so
  // a reworded `success_signal.sensor` de-registers the sensor reading it — a
  // failure that is invisible everywhere else (the reading just stays null).
  // Forward direction only: every registered name should still be some node's
  // recorded sensor. The reverse is NOT asserted — most recorded sensors in the
  // store are deliberately unimplemented prose.
  //
  // REPORTED, NEVER FATAL HERE. This script is the `guard` job of
  // graph-fast-path.yml, and that workflow's four other required contexts each
  // declare `needs: guard` — so throwing here leaves EVERY graph writer in the
  // repo with four non-success required checks and `graph-commit` refusing to
  // land, over a registry defect that says nothing about the node being
  // written. That is the 2026-08-14 outage: 54 minutes, three blocked writes,
  // none of them about sensors
  // (tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes).
  //
  // The signal is not lost, it moves to where the change that breaks it is
  // made: `validateRegisteredSensorNames` (same rule, fatal) runs against the
  // live store in packages/intentionsutil/test/lifecycle-sensor.test.ts, and
  // that suite is in the PR CI of any branch touching packages/intentionsutil —
  // the home of both the registered constants and this rule.
  const registered = registeredSensorNames();
  const unboundRegistered = findUnboundRegisteredSensorNames(
    nodes,
    registered,
    UNBOUND_SENSOR_NAMES,
  );
  if (unboundRegistered.length > 0) {
    process.stderr.write(
      `warning — sensor registration\n${formatUnboundSensorNames(unboundRegistered)}\n` +
        `Not fatal here: denying the graph write path over a registry/store pairing ` +
        `defect blocks every writer in the repo over content that has nothing to do ` +
        `with sensors (2026-08-14). The same rule IS fatal in packages/intentionsutil's ` +
        `unit CI — test/lifecycle-sensor.test.ts, on any branch touching that package.\n`,
    );
  }

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
  process.stdout.write(
    `ok — sensors: ${registered.size} registered, ` +
      `${UNBOUND_SENSOR_NAMES.size} node-agnostic, ` +
      `${unboundRegistered.length} unbound (reported on stderr, never fatal), ` +
      `rest recorded verbatim\n`,
  );
}

main();
